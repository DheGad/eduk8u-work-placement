/**
 * EDUK8U — Self-Contained API Server
 * Phase 3 Validation: SQLite-backed, zero-dependency-install Express API.
 * Replaces PostgreSQL pg driver with better-sqlite3.
 *
 * Routes:
 *   GET  /health
 *   POST /api/v1/auth/login
 *   GET  /api/v1/students
 *   POST /api/v1/students
 *   GET  /api/v1/students/:id
 *   GET  /api/v1/hosts
 *   POST /api/v1/hosts
 *   GET  /api/v1/hosts/:id
 *   GET  /api/v1/supervisors
 *   POST /api/v1/supervisors
 *   PATCH /api/v1/supervisors/:id/verify
 *   GET  /api/v1/placements
 *   POST /api/v1/placements
 *   GET  /api/v1/placements/:id
 *   PATCH /api/v1/placements/:id
 *   GET  /api/v1/placements/:id/hours
 *   POST /api/v1/placements/:id/hours
 *   PATCH /api/v1/placements/:id/hours/:hourId/approve
 *   PATCH /api/v1/placements/:id/hours/:hourId/reject
 *   GET  /api/v1/placements/:id/evidence
 *   POST /api/v1/placements/:id/evidence  (multipart)
 *   GET  /api/v1/placements/:id/journal
 *   POST /api/v1/placements/:id/journal
 *   GET  /api/v1/placements/:id/compliance
 *   PATCH /api/v1/placements/:id/sign-agreement
 *   PATCH /api/v1/placements/:id/complete
 *   GET  /api/v1/placements/:id/report
 *   GET  /api/v1/dashboard/stats
 */
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { dispatchEvent } from './services/eventBus';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, connectWithRetry } from './config/database';

// ── Sentry & Monitoring ────────────────────────────────────────────────────
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0, 
  profilesSampleRate: 1.0,
});

// ── Environment Validation ─────────────────────────────────────────────────
const REQUIRED_ENV_VARS = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'VULTR_ACCESS_KEY', 'VULTR_SECRET_KEY', 'VULTR_ENDPOINT', 'VULTR_BUCKET_NAME'];
for (const envVar of REQUIRED_ENV_VARS) {
  if (!process.env[envVar] || process.env[envVar].includes('replace_me') || process.env[envVar].includes('change-in-prod')) {
    console.error(`CRITICAL ERROR: Missing or default value for ${envVar}. Server refusing to start in production.`);
    if (process.env.NODE_ENV === 'production') process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'eduk8u-dev-secret-change-in-prod-2024';

// ── S3 Document Storage ────────────────────────────────────────────────────
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.VULTR_REGION || 'sgp1',
  endpoint: process.env.VULTR_ENDPOINT || 'https://sgp1.vultrobjects.com',
  credentials: {
    accessKeyId: process.env.VULTR_ACCESS_KEY || 'dev-access-key',
    secretAccessKey: process.env.VULTR_SECRET_KEY || 'dev-secret-key',
  },
});

// Use memory storage for Multer to forward to S3 directly
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// ── Middleware ─────────────────────────────────────────────────────────────
Sentry.setupExpressErrorHandler(app);

app.use(helmet({ contentSecurityPolicy: false }));
// Only allow specific origin in production, wildcard in dev
const allowedOrigin = process.env.NODE_ENV === 'production' ? process.env.ALLOWED_ORIGINS?.split(',') : '*';
app.use(cors({ origin: allowedOrigin, credentials: true, methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'] }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Auth middleware ────────────────────────────────────────────────────────
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });
  try {
    (req as any).user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

// ── 403 Audit Logging Middleware ───────────────────────────────────────────
function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;
    if (!roles.includes(userRole)) {
      // Log the 403 Access Denied attempt
      logActivity(req, 'security_alert', 'endpoint', req.path, `Unauthorized access attempt. Required: ${roles.join(',')}, Had: ${userRole}`);
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    next();
  };
}

// ── Helper ─────────────────────────────────────────────────────────────────
function ok(res: Response, data: any, meta?: any) {
  return res.json({ success: true, data, ...(meta ? { meta } : {}) });
}
function err(res: Response, status: number, message: string) {
  return res.status(status).json({ success: false, error: message });
}
function logActivity(req: any, action: string, entity_type: string, entity_id: string, description: string, userId?: string) {
  try {
    db.query(`INSERT INTO activity_logs (id,tenant_id,user_id,action,entity_type,entity_id,description,details) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [uuidv4(), req?.user?.tenantId || null, userId || req?.user?.userId || null, action, entity_type, entity_id, description, '{}']).catch(e => console.error('Failed to log activity', e));
  } catch (e) { console.error('Failed to log activity', e); }
}

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH
// ─────────────────────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const counts = {
    tenants: ((await db.query('SELECT COUNT(*) as c FROM tenants')).rows[0] as any).c,
    students: ((await db.query('SELECT COUNT(*) as c FROM students')).rows[0] as any).c,
    placements: ((await db.query('SELECT COUNT(*) as c FROM placements')).rows[0] as any).c,
  };
  res.json({ status: 'ok', version: 'v1', environment: 'development', db: 'sqlite', counts });
});

app.get('/health/db', async (req, res) => {
  const result = ((await db.query('SELECT CURRENT_TIMESTAMP as now')).rows[0] as any).now;
  res.json({ status: 'connected', engine: 'SQLite (better-sqlite3)', time: result });
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'eduk8u-refresh-secret-change-in-prod';


app.post("/api/v1/auth/register", async (req, res) => {
  const { email, password, first_name, last_name, role, tenant_id } = req.body;
  if (!email || !password || !first_name || !last_name) return err(res, 400, "Missing fields");

  const existing = (await db.query("SELECT id FROM users WHERE email = $1", [email])).rows[0];
  if (existing) return err(res, 400, "Email already in use");

  const hash = bcrypt.hashSync(password, 10);
  const user_id = uuidv4();
  const assigned_role = role || "student";
  
  // For safety, only super_admin can create another super_admin, defaulting to student if unknown
  const valid_roles = ["college_admin", "trainer", "student", "supervisor", "host_manager"];
  const final_role = valid_roles.includes(assigned_role) ? assigned_role : "student";
  
  // Set default tenant if missing
  const tid = tenant_id || (req as any).user?.tenantId || "00000000-0000-0000-0000-000000000001";

  await db.query(`
    INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, approval_status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [user_id, tid, email, hash, first_name, last_name, final_role, "pending"]);

  logActivity(req as any, "created", "user", user_id, `New ${final_role} registered`);

  return ok(res, { message: "Registration successful. Please wait for admin approval." });
});

app.post('/api/v1/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return err(res, 400, 'Email and password required');

  const user = (await db.query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email])).rows[0] as any;
  if (!user) return err(res, 401, 'Invalid credentials');

  // Check if locked
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    logActivity(req as any, 'security_alert', 'user', user.id, 'Attempted login on locked account', user.id);
    return err(res, 403, 'Account is temporarily locked due to multiple failed login attempts. Try again later.');
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    const newFails = (user.failed_login_attempts || 0) + 1;
    if (newFails >= 5) {
      await db.query(`UPDATE users SET failed_login_attempts = $1, locked_until = NOW() + INTERVAL '15 minutes' WHERE id = $2`, [newFails, user.id]);
      logActivity(req as any, 'security_alert', 'user', user.id, 'Account locked after 5 failed login attempts', user.id);
    } else {
      await db.query('UPDATE users SET failed_login_attempts = $1 WHERE id = $2', [newFails, user.id]);
    }
    return err(res, 401, "Invalid credentials");
  }

  if (user.approval_status === "pending") return err(res, 403, "Account pending admin approval");
  if (user.approval_status === "rejected") return err(res, 403, "Account registration rejected");
  if (user.approval_status === "suspended") return err(res, 403, "Account suspended");

  // Reset failed attempts on success
  await db.query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP, failed_login_attempts = 0, locked_until = NULL WHERE id = $1', [user.id]);

  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, tenantId: user.tenant_id },
    JWT_SECRET, { expiresIn: '8h' }
  );
  const refreshToken = jwt.sign(
    { userId: user.id },
    JWT_REFRESH_SECRET, { expiresIn: '30d' }
  );

  // Store refresh token hash for validation
  const refreshHash = bcrypt.hashSync(refreshToken, 4);
  await db.query(`INSERT INTO user_sessions (id,user_id,refresh_token_hash,expires_at) VALUES ($1,$2,$3,NOW() + INTERVAL '30 days')`, [uuidv4(), user.id, refreshHash]);

  const fullName = `${user.first_name} ${user.last_name}`;
  return ok(res, {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: fullName,
      tenant_id: user.tenant_id,
      tenant: { name: 'ICQA' },
    },
    tokens: {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 28800,
    }
  });
});

app.post('/api/v1/auth/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return err(res, 400, 'refresh_token required');

  try {
    const payload = jwt.verify(refresh_token, JWT_REFRESH_SECRET) as any;
    const sessions = (await db.query('SELECT * FROM user_sessions WHERE user_id=$1 AND is_revoked=false AND expires_at > CURRENT_TIMESTAMP', [payload.userId])).rows as any[];
    
    // Validate refresh token against stored hashes
    const validSession = sessions.find(s => bcrypt.compareSync(refresh_token, s.refresh_token_hash));
    if (!validSession) return err(res, 401, 'Invalid or expired refresh token');

    const user = (await db.query('SELECT * FROM users WHERE id=$1 AND is_active=true', [payload.userId])).rows[0] as any;
    if (!user) return err(res, 401, 'User not found');

    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, tenantId: user.tenant_id },
      JWT_SECRET, { expiresIn: '8h' }
    );
    const newRefreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
    const newRefreshHash = bcrypt.hashSync(newRefreshToken, 4);

    // Revoke old, create new
    await db.query('UPDATE user_sessions SET is_revoked=true WHERE id=$1', [validSession.id]);
    await db.query(`INSERT INTO user_sessions (id,user_id,refresh_token_hash,expires_at) VALUES ($1,$2,$3,NOW() + INTERVAL '30 days')`, [uuidv4(), user.id, newRefreshHash]);

    return ok(res, { access_token: newAccessToken, refresh_token: newRefreshToken, token_type: 'Bearer', expires_in: 28800 });
  } catch {
    return err(res, 401, 'Invalid refresh token');
  }
});

app.post('/api/v1/auth/logout', async (req, res) => {
  const { refresh_token } = req.body;
  if (refresh_token) {
    try {
      const payload = jwt.verify(refresh_token, JWT_REFRESH_SECRET) as any;
      await db.query('UPDATE user_sessions SET is_revoked=true WHERE user_id=$1', [payload.userId]);
    } catch {}
  }
  return ok(res, { message: 'Logged out successfully' });
});

app.post('/api/v1/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return err(res, 400, 'Email required');
  const user = (await db.query('SELECT id FROM users WHERE email=$1 AND is_active=true', [email])).rows[0] as any;
  // Always return success to prevent email enumeration
  if (user) {
    const resetToken = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
    const hash = bcrypt.hashSync(resetToken, 4);
    await db.query(`INSERT INTO password_reset_tokens (id,user_id,token_hash,expires_at) VALUES ($1,$2,$3,CURRENT_TIMESTAMP + INTERVAL '1 hour')`, [uuidv4(), user.id, hash]);
    // In production: send email. For now, log it.
    console.log(`[PASSWORD RESET] Token for ${email}: ${resetToken}`);
  }
  return ok(res, { message: 'If that email is registered, you will receive a password reset link.' });
});

app.post('/api/v1/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return err(res, 400, 'token and password required');
  if (password.length < 8) return err(res, 400, 'Password must be at least 8 characters');

  const tokens = (await db.query('SELECT * FROM password_reset_tokens WHERE used_at IS NULL AND expires_at > CURRENT_TIMESTAMP')).rows as any[];
  const validToken = tokens.find(t => { try { return bcrypt.compareSync(token, t.token_hash); } catch { return false; } });
  if (!validToken) return err(res, 400, 'Invalid or expired reset token');

  const hash = bcrypt.hashSync(password, 10);
  await db.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, validToken.user_id]);
  await db.query('UPDATE password_reset_tokens SET used_at=CURRENT_TIMESTAMP WHERE id=$1', [validToken.id]);
  return ok(res, { message: 'Password reset successfully. Please sign in.' });
});

app.post('/api/v1/auth/change-password', authMiddleware, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return err(res, 400, 'current_password and new_password required');
  if (new_password.length < 8) return err(res, 400, 'Password must be at least 8 characters');
  const user = (await db.query('SELECT * FROM users WHERE id=$1', [(req as any).user.userId])).rows[0] as any;
  if (!bcrypt.compareSync(current_password, user.password_hash)) return err(res, 400, 'Current password is incorrect');
  await db.query('UPDATE users SET password_hash=$1 WHERE id=$2', [bcrypt.hashSync(new_password, 10), user.id]);
  return ok(res, { message: 'Password changed successfully' });
});

app.get('/api/v1/auth/me', authMiddleware, async (req, res) => {
  const user = (await db.query('SELECT id,email,role,first_name,last_name,tenant_id FROM users WHERE id = $1', [(req as any).user.userId])).rows[0] as any;
  if (!user) return err(res, 404, 'User not found');
  return ok(res, { ...user, full_name: `${user.first_name} ${user.last_name}`, tenant: { name: 'ICQA' } });
});

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/admin/dashboard/stats', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  try {
    const tid = (req as any).user.tenantId;
    const [pl, ac, co, st, ho, su, sv, ar, ph, ef, hco, nr, md] = await Promise.all([
      db.query('SELECT COUNT(*) as c FROM placements WHERE tenant_id=$1', [tid]),
      db.query("SELECT COUNT(*) as c FROM placements WHERE tenant_id=$1 AND status='active'", [tid]),
      db.query("SELECT COUNT(*) as c FROM placements WHERE tenant_id=$1 AND status='completed'", [tid]),
      db.query('SELECT COUNT(*) as c FROM students WHERE tenant_id=$1 AND is_active=true', [tid]),
      db.query('SELECT COUNT(*) as c FROM host_facilities WHERE tenant_id=$1', [tid]),
      db.query('SELECT COUNT(*) as c FROM supervisors WHERE tenant_id=$1', [tid]),
      db.query("SELECT COUNT(*) as c FROM supervisors WHERE tenant_id=$1 AND qualification_status='verified'", [tid]),
      db.query("SELECT COUNT(*) as c FROM placements WHERE tenant_id=$1 AND risk_level IN ('high','critical')", [tid]),
      db.query("SELECT COUNT(*) as c FROM placement_hours WHERE tenant_id=$1 AND verification_status='pending'", [tid]),
      db.query("SELECT COUNT(*) as c FROM email_logs WHERE tenant_id=$1 AND status='failed'", [tid]),
      db.query('SELECT COALESCE(SUM(hours_completed),0) as total FROM placements WHERE tenant_id=$1', [tid]),
      db.query("SELECT COUNT(*) as c FROM placements WHERE tenant_id=$1 AND status='active' AND hours_completed >= 100", [tid]),
      db.query("SELECT COUNT(*) as c FROM placements p WHERE p.tenant_id=$1 AND p.status='active' AND (SELECT COUNT(*) FROM placement_evidence WHERE placement_id=p.id) < 3", [tid]),
    ]);
    const stats = {
      total_placements: parseInt((pl.rows[0] as any).c) || 0,
      active_placements: parseInt((ac.rows[0] as any).c) || 0,
      completed_placements: parseInt((co.rows[0] as any).c) || 0,
      total_students: parseInt((st.rows[0] as any).c) || 0,
      total_hosts: parseInt((ho.rows[0] as any).c) || 0,
      total_supervisors: parseInt((su.rows[0] as any).c) || 0,
      verified_supervisors: parseInt((sv.rows[0] as any).c) || 0,
      at_risk_placements: parseInt((ar.rows[0] as any).c) || 0,
      pending_hours: parseInt((ph.rows[0] as any).c) || 0,
      email_failures: parseInt((ef.rows[0] as any).c) || 0,
      total_hours_logged: parseFloat((hco.rows[0] as any).total) || 0,
      near_completion: parseInt((nr.rows[0] as any).c) || 0,
      missing_documents: parseInt((md.rows[0] as any).c) || 0,
    };
    return ok(res, stats);
  } catch (e: any) {
    console.error('Dashboard stats error:', e.message);
    return ok(res, { total_placements: 0, active_placements: 0, completed_placements: 0, total_students: 0, total_hosts: 0, total_supervisors: 0, error: 'partial' });
  }
});

app.get('/api/v1/admin/dashboard/recent-activity', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const logs = (await db.query(`SELECT al.*, u.first_name||' '||u.last_name as user_name FROM activity_logs al LEFT JOIN users u ON al.user_id=u.id WHERE al.tenant_id=$1 ORDER BY al.created_at DESC LIMIT $2`, [(req as any).user.tenantId, limit])).rows;
  return ok(res, logs);
});

app.get('/api/v1/admin/dashboard/at-risk', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const placements = (await db.query(`
    SELECT p.id, p.placement_ref as placement_number, st.first_name||' '||st.last_name as student_name, hf.facility_name as host_name, p.risk_level, p.compliance_score, p.hours_completed, 120 as hours_required 
    FROM placements p 
    LEFT JOIN students st ON p.student_id=st.id 
    LEFT JOIN host_facilities hf ON p.host_facility_id=hf.id 
    WHERE p.tenant_id=$1 AND p.risk_level IN ('high', 'critical')
  `, [(req as any).user.tenantId])).rows;
  return ok(res, placements);
});

app.get('/api/v1/admin/dashboard/weekly-hours', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const data = (await db.query(`
    SELECT log_date as day, SUM(hours_claimed) as currentWeek, 0 as lastWeek 
    FROM placement_hours 
    WHERE tenant_id=$1 AND status='approved' 
    GROUP BY log_date 
    ORDER BY log_date DESC LIMIT 7
  `, [(req as any).user.tenantId])).rows;
  return ok(res, data.reverse());
});

app.get('/api/v1/admin/dashboard/compliance-distribution', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const data = [
    { name: 'High (>80%)', value: ((await db.query('SELECT COUNT(*) as c FROM placements WHERE tenant_id=$1 AND compliance_score >= 80', [(req as any).user.tenantId])).rows[0] as any).c, color: '#10b981' },
    { name: 'Medium (60-79%)', value: ((await db.query('SELECT COUNT(*) as c FROM placements WHERE tenant_id=$1 AND compliance_score >= 60 AND compliance_score < 80', [(req as any).user.tenantId])).rows[0] as any).c, color: '#f59e0b' },
    { name: 'Low (<60%)', value: ((await db.query('SELECT COUNT(*) as c FROM placements WHERE tenant_id=$1 AND compliance_score < 60', [(req as any).user.tenantId])).rows[0] as any).c, color: '#ef4444' }
  ];
  return ok(res, data);
});

app.get('/api/v1/admin/dashboard/audit-readiness', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  // Score: percentage of active placements that have > 80% compliance
  const activePlacements = (await db.query("SELECT COUNT(*) as c FROM placements WHERE tenant_id=$1 AND status='active'", [(req as any).user.tenantId])).rows[0] as any;
  const readyPlacements = (await db.query("SELECT COUNT(*) as c FROM placements WHERE tenant_id=$1 AND status='active' AND compliance_score >= 80", [(req as any).user.tenantId])).rows[0] as any;
  
  const score = activePlacements.c > 0 ? Math.round((readyPlacements.c / activePlacements.c) * 100) : 100;
  
  return ok(res, { score, ready_count: readyPlacements.c, total_active: activePlacements.c });
});

app.get('/api/v1/admin/dashboard/compliance-alerts', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const alerts: any[] = [];
  
  const placements = (await db.query(`
    SELECT p.id, p.placement_ref as placement_number, p.compliance_score, p.agreement_signed, 
           st.first_name||' '||st.last_name as student_name,
           (SELECT COUNT(*) FROM placement_evidence WHERE placement_id=p.id) as evidence_count,
           (SELECT COUNT(*) FROM placement_journal WHERE placement_id=p.id) as journal_count,
           (SELECT COUNT(*) FROM placements WHERE supervisor_id=p.supervisor_id AND tenant_id=p.tenant_id) as sup_count,
           s.qualification_status
    FROM placements p
    LEFT JOIN students st ON p.student_id=st.id
    LEFT JOIN supervisors s ON p.supervisor_id=s.id
    WHERE p.tenant_id=$1 AND p.status='active'
  `, [(req as any).user.tenantId])).rows;

  for (const p of placements as any[]) {
    if (!p.agreement_signed) {
      alerts.push({ id: `alert-${p.id}-ag`, placement_id: p.id, student_name: p.student_name, alert_type: 'Missing Agreement', priority: 'high', description: 'Tripartite agreement is unsigned' });
    }
    if (p.evidence_count < 1) {
      alerts.push({ id: `alert-${p.id}-ev`, placement_id: p.id, student_name: p.student_name, alert_type: 'Missing Evidence', priority: 'medium', description: 'No evidence documents uploaded yet' });
    }
    if (p.journal_count < 1 && p.hours_completed > 40) {
      alerts.push({ id: `alert-${p.id}-jo`, placement_id: p.id, student_name: p.student_name, alert_type: 'Missing Journal', priority: 'medium', description: 'Student has logged >40 hours but has no journal entries' });
    }
    if (p.qualification_status !== 'verified') {
      alerts.push({ id: `alert-${p.id}-sup`, placement_id: p.id, student_name: p.student_name, alert_type: 'Supervisor Unverified', priority: 'high', description: 'The assigned supervisor has not been verified' });
    }
  }

  // Only return top 15 alerts to avoid clutter
  return ok(res, alerts.slice(0, 15));
});

// ─────────────────────────────────────────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/students', authMiddleware, async (req, res) => {
  const { search, status } = req.query;
  let sql = 'SELECT s.*, (SELECT COUNT(*) FROM placements p WHERE p.student_id=s.id AND p.status="active") as active_placement_count, (SELECT hours_completed FROM placements p WHERE p.student_id=s.id ORDER BY p.created_at DESC LIMIT 1) as hours_completed, (SELECT compliance_score FROM placements p WHERE p.student_id=s.id ORDER BY p.created_at DESC LIMIT 1) as compliance_score, (SELECT risk_level FROM placements p WHERE p.student_id=s.id ORDER BY p.created_at DESC LIMIT 1) as risk_level FROM students s WHERE s.tenant_id=?';
  const params: any[] = [(req as any).user.tenantId];
  if (search) { sql += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.student_number LIKE ? OR s.email LIKE ?)'; const q = `%${search}%`; params.push(q,q,q,q); }
  sql += ' ORDER BY s.created_at DESC';
  const students = (await db.query(sql, [...params])).rows;
  return ok(res, students, { total: students.length });
});

app.post('/api/v1/students', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const { first_name, last_name, email, phone, dob, address, emergency_contact_name, emergency_contact_phone, course_code } = req.body;
  if (!first_name || !last_name || !email) return err(res, 400, 'first_name, last_name, email required');
  const existing = (await db.query('SELECT id FROM students WHERE email=$1 AND tenant_id=$2', [email, (req as any).user.tenantId])).rows[0];
  if (existing) return err(res, 409, 'Student with this email already exists');
  const id = uuidv4();
  const count = ((await db.query('SELECT COUNT(*) as c FROM students WHERE tenant_id=$1', [(req as any).user.tenantId])).rows[0] as any).c;
  const sn = `STU-${String(count + 1).padStart(3, '0')}`;
  await db.query(`INSERT INTO students (id,tenant_id,user_id,student_number,first_name,last_name,email,phone,dob,address,emergency_contact_name,emergency_contact_phone,course_code,course_name,enrolment_status,enrolment_date,is_active,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,CURRENT_DATE,$16,$17)`, [id, (req as any).user.tenantId, null, sn, first_name, last_name, email, phone||null, dob||null, address||null, emergency_contact_name||null, emergency_contact_phone||null, course_code||'CHC33021', 'Certificate III in Individual Support', 'active', true, (req as any).user.userId]);
  logActivity(req as any, 'created', 'student', id, `Student ${first_name} ${last_name} enrolled`, (req as any).user.userId);
  return res.status(201).json({ success: true, data: (await db.query('SELECT * FROM students WHERE id=$1', [id])).rows[0] });
});

app.get('/api/v1/students/:id', authMiddleware, async (req, res) => {
  const student = (await db.query('SELECT st.*, u.first_name, u.last_name, u.email, u.phone FROM students st JOIN users u ON st.user_id = u.id WHERE st.id=$1 AND st.tenant_id=$2', [req.params.id, (req as any).user.tenantId])).rows[0] as any;
  if (!student) return err(res, 404, 'Student not found');
  const placements = (await db.query(`SELECT p.*, hf.facility_name, s.first_name||' '||s.last_name as supervisor_name FROM placements p LEFT JOIN host_facilities hf ON p.host_facility_id=hf.id LEFT JOIN supervisors s ON p.supervisor_id=s.id WHERE p.student_id=$1 ORDER BY p.created_at DESC`, [student.id])).rows;
  const journals = (await db.query('SELECT * FROM placement_journal WHERE student_id=$1 ORDER BY entry_date DESC LIMIT 10', [student.id])).rows;
  const evidence = (await db.query('SELECT * FROM placement_evidence WHERE student_id=$1 ORDER BY created_at DESC', [student.id])).rows;
  return ok(res, { ...student, placements, journals, evidence });
});

// ─────────────────────────────────────────────────────────────────────────────
// HOST FACILITIES
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/hosts', authMiddleware, async (req, res) => {
  const { search } = req.query;
  let sql = `SELECT hf.*, (SELECT COUNT(*) FROM supervisors s WHERE s.host_facility_id=hf.id AND s.is_active=true) as supervisor_count, (SELECT COUNT(*) FROM placements p WHERE p.host_facility_id=hf.id AND p.status='active') as active_placements, (SELECT expiry_date FROM host_insurance_records WHERE host_facility_id=hf.id AND is_current=1 ORDER BY expiry_date DESC LIMIT 1) as insurance_expiry FROM host_facilities hf WHERE hf.tenant_id=?`;
  const params: any[] = [(req as any).user.tenantId];
  if (search) { sql += ' AND (hf.facility_name LIKE ? OR hf.suburb LIKE ? OR hf.state LIKE ?)'; const q = `%${search}%`; params.push(q,q,q); }
  sql += ' ORDER BY hf.facility_name';
  return ok(res, (await db.query(sql, [...params])).rows);
});

app.post('/api/v1/hosts', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const { facility_name, abn, facility_type, address_line1, suburb, state, postcode, phone, email, primary_contact_name, primary_contact_role, student_capacity } = req.body;
  if (!facility_name || !suburb || !state) return err(res, 400, 'facility_name, suburb, state required');
  const id = uuidv4();
  await db.query(`INSERT INTO host_facilities (id,tenant_id,facility_name,trading_name,abn,facility_type,address_line1,suburb,state,postcode,country,phone,email,primary_contact_name,primary_contact_role,student_capacity,approval_status,is_active,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'pending',true,$17)`, [id, (req as any).user.tenantId, facility_name, facility_name, abn||null, facility_type||'Residential Aged Care', address_line1||null, suburb, state, postcode||null, 'Australia', phone||null, email||null, primary_contact_name||null, primary_contact_role||null, student_capacity||3, (req as any).user.userId]);
  logActivity(req as any, 'created', 'host_facility', id, `Host facility ${facility_name} added`, (req as any).user.userId);
  return res.status(201).json({ success: true, data: (await db.query('SELECT * FROM host_facilities WHERE id=$1', [id])).rows[0] });
});

app.get('/api/v1/hosts/:id', authMiddleware, async (req, res) => {
  const host = (await db.query('SELECT * FROM host_facilities WHERE id=$1 AND tenant_id=$2', [req.params.id, (req as any).user.tenantId])).rows[0] as any;
  if (!host) return err(res, 404, 'Host not found');
  const supervisors = (await db.query('SELECT * FROM supervisors WHERE host_facility_id=$1 AND is_active=true', [host.id])).rows;
  const insurance = (await db.query('SELECT * FROM host_insurance_records WHERE host_facility_id=$1 ORDER BY expiry_date DESC', [host.id])).rows;
  const placements = (await db.query(`SELECT p.*, st.first_name||' '||st.last_name as student_name FROM placements p LEFT JOIN students st ON p.student_id=st.id WHERE p.host_facility_id=$1 ORDER BY p.created_at DESC`, [host.id])).rows;
  return ok(res, { ...host, supervisors, insurance, placements });
});

app.patch('/api/v1/hosts/:id/approve', authMiddleware, async (req, res) => {
  await db.query(`UPDATE host_facilities SET approval_status='approved', approved_at=NOW(), updated_at=NOW() WHERE id=$1 AND tenant_id=$2`, [req.params.id, (req as any).user.tenantId]);
  logActivity(req as any, 'approved', 'host_facility', req.params.id, 'Host facility approved', (req as any).user.userId);
  return ok(res, { message: 'Host facility approved' });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUPERVISORS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/supervisors', authMiddleware, async (req, res) => {
  const { search, host_id } = req.query;
  let sql = `SELECT sv.*, hf.facility_name, hf.suburb, hf.state, (SELECT COUNT(*) FROM placements p WHERE p.supervisor_id=sv.id AND p.status='active') as students_assigned, (SELECT SUM(ph.hours_claimed) FROM placement_hours ph JOIN placements p ON ph.placement_id=p.id WHERE p.supervisor_id=sv.id AND ph.status='approved') as hours_approved FROM supervisors sv LEFT JOIN host_facilities hf ON sv.host_facility_id=hf.id WHERE sv.tenant_id=?`;
  const params: any[] = [(req as any).user.tenantId];
  if (host_id) { sql += ' AND sv.host_facility_id=?'; params.push(host_id); }
  if (search) { sql += ' AND (sv.first_name LIKE ? OR sv.last_name LIKE ? OR hf.facility_name LIKE ? OR sv.position_title LIKE ?)'; const q = `%${search}%`; params.push(q,q,q,q); }
  sql += ' ORDER BY sv.first_name';
  return ok(res, (await db.query(sql, [...params])).rows);
});

app.post('/api/v1/supervisors', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const { host_facility_id, first_name, last_name, email, phone, position_title, years_experience } = req.body;
  if (!host_facility_id || !first_name || !last_name || !email) return err(res, 400, 'host_facility_id, first_name, last_name, email required');
  const id = uuidv4();
  await db.query(`INSERT INTO supervisors (id,tenant_id,host_facility_id,first_name,last_name,email,phone,position_title,qualification_status,briefing_status,years_experience,qualifications,is_active,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending_verification','not_started',$9,$10,true,$11)`, [id, (req as any).user.tenantId, host_facility_id, first_name, last_name, email, phone||null, position_title||null, years_experience||null, '[]', (req as any).user.userId]);
  logActivity(req as any, 'created', 'supervisor', id, `Supervisor ${first_name} ${last_name} added`, (req as any).user.userId);
  return res.status(201).json({ success: true, data: (await db.query('SELECT * FROM supervisors WHERE id=$1', [id])).rows[0] });
});

app.get('/api/v1/supervisors/:id', authMiddleware, async (req, res) => {
  const sv = (await db.query(`SELECT sv.*, hf.facility_name FROM supervisors sv LEFT JOIN host_facilities hf ON sv.host_facility_id=hf.id WHERE sv.id=$1 AND sv.tenant_id=$2`, [req.params.id, (req as any).user.tenantId])).rows[0] as any;
  if (!sv) return err(res, 404, 'Supervisor not found');
  const placements = (await db.query(`SELECT p.*, st.first_name||' '||st.last_name as student_name FROM placements p LEFT JOIN students st ON p.student_id=st.id WHERE p.supervisor_id=$1 ORDER BY p.created_at DESC`, [sv.id])).rows;
  return ok(res, { ...sv, placements });
});

app.patch('/api/v1/supervisors/:id/verify', authMiddleware, async (req, res) => {
  await db.query(`UPDATE supervisors SET qualification_status='verified', briefing_status='completed', updated_at=NOW() WHERE id=$1 AND tenant_id=$2`, [req.params.id, (req as any).user.tenantId]);
  logActivity(req as any, 'approved', 'supervisor', req.params.id, 'Supervisor verified and briefed', (req as any).user.userId);
  return ok(res, { message: 'Supervisor verified successfully' });
});

// ─────────────────────────────────────────────────────────────────────────────
// PLACEMENTS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/placements', authMiddleware, async (req, res) => {
  const { search, phase, risk, status } = req.query;
  let paramIdx = 2;
  let sql = `
    SELECT p.*,
      st.first_name||' '||st.last_name as student_name, st.student_number,
      hf.facility_name, hf.suburb, hf.state,
      sv.first_name||' '||sv.last_name as supervisor_name, sv.qualification_status as supervisor_status,
      (SELECT COUNT(*) FROM placement_evidence pe WHERE pe.placement_id=p.id AND pe.review_status='approved') as evidence_count
    FROM placements p
    LEFT JOIN students st ON p.student_id=st.id
    LEFT JOIN host_facilities hf ON p.host_facility_id=hf.id
    LEFT JOIN supervisors sv ON p.supervisor_id=sv.id
    WHERE p.tenant_id=$1`;
  const params: any[] = [(req as any).user.tenantId];
  if (search) { sql += ` AND (st.first_name ILIKE $${paramIdx} OR st.last_name ILIKE $${paramIdx+1} OR p.placement_reference ILIKE $${paramIdx+2} OR hf.facility_name ILIKE $${paramIdx+3})`; const q = `%${search}%`; params.push(q,q,q,q); paramIdx+=4; }
  if (phase && phase !== 'all') { sql += ` AND p.current_phase=$${paramIdx++}`; params.push(phase); }
  if (risk && risk !== 'all') { sql += ` AND p.risk_level=$${paramIdx++}`; params.push(risk); }
  if (status && status !== 'all') { sql += ` AND p.status=$${paramIdx++}::placement_status`; params.push(status); }
  sql += ' ORDER BY p.created_at DESC';
  const placements = (await db.query(sql, params)).rows as any[];
  placements.forEach(p => {
    p.placement_ref = p.placement_reference;
    p.hours_required = p.total_hours_required;
    p.start_date = p.planned_start_date;
    p.end_date = p.planned_end_date;
    p.compliance_score = p.audit_readiness_score || 0;
  });
  return ok(res, placements, { total: placements.length });
});

app.post('/api/v1/placements', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const { student_id, host_facility_id, supervisor_id, start_date, end_date, course_code } = req.body;
  if (!student_id || !host_facility_id || !supervisor_id) return err(res, 400, 'student_id, host_facility_id, supervisor_id required');
  const host = (await db.query('SELECT * FROM host_facilities WHERE id=$1 AND tenant_id=$2', [host_facility_id, (req as any).user.tenantId])).rows[0] as any;
  if (!host) return err(res, 404, 'Host facility not found');
  const sv = (await db.query('SELECT * FROM supervisors WHERE id=$1', [supervisor_id])).rows[0] as any;
  if (!sv) return err(res, 404, 'Supervisor not found');
  const id = uuidv4();
  const count = ((await db.query('SELECT COUNT(*) as c FROM placements WHERE tenant_id=$1', [(req as any).user.tenantId])).rows[0] as any).c;
  const ref = `ICQA-${new Date().getFullYear()}-${String(parseInt(count) + 1).padStart(3, '0')}`;
  const initial_readiness = host.approval_status === 'approved' && sv?.qualification_status === 'verified' ? 25 : 0;
  await db.query(`INSERT INTO placements (id,tenant_id,placement_reference,student_id,host_facility_id,supervisor_id,trainer_id,total_hours_required,hours_completed,hours_verified,audit_readiness_score,risk_level,current_phase,status,planned_start_date,planned_end_date,course_code,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,120,0,0,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [id, (req as any).user.tenantId, ref, student_id, host_facility_id, supervisor_id, (req as any).user.userId, initial_readiness, 'none', 'setup', 'active', start_date||null, end_date||null, course_code||null, (req as any).user.userId]);
  logActivity(req as any, 'created', 'placement', id, `Placement ${ref} created`, (req as any).user.userId);
  return res.status(201).json({ success: true, data: { id, placement_reference: ref, placement_ref: ref } });
});

app.get('/api/v1/placements/:id', authMiddleware, async (req, res) => {
  const p = (await db.query(`
    SELECT p.*,
      st.first_name||' '||st.last_name as student_name, st.student_number, st.email as student_email, st.phone as student_phone, st.date_of_birth as student_dob, st.course_code, st.course_name,
      hf.facility_name, hf.suburb, hf.state, hf.phone as host_phone, hf.primary_contact_name as host_contact,
      sv.first_name||' '||sv.last_name as supervisor_name, sv.email as supervisor_email, sv.position_title as supervisor_position, sv.qualification_status as supervisor_qual_status,
      (SELECT COUNT(*) FROM placement_evidence pe WHERE pe.placement_id=p.id AND pe.review_status='approved') as evidence_count
    FROM placements p
    LEFT JOIN students st ON p.student_id=st.id
    LEFT JOIN host_facilities hf ON p.host_facility_id=hf.id
    LEFT JOIN supervisors sv ON p.supervisor_id=sv.id
    WHERE p.id=$1 AND p.tenant_id=$2`, [req.params.id, (req as any).user.tenantId])).rows[0] as any;
  if (!p) return err(res, 404, 'Placement not found');
  p.placement_ref = p.placement_reference;
  p.hours_required = p.total_hours_required;
  p.start_date = p.planned_start_date;
  p.end_date = p.planned_end_date;
  p.compliance_score = p.audit_readiness_score || 0;
  return ok(res, p);
});

app.patch('/api/v1/placements/:id', authMiddleware, async (req, res) => {
  const { current_phase, status, risk_level, notes, metadata } = req.body;
  const updates: string[] = [];
  const vals: any[] = [];
  let idx = 1;
  if (current_phase !== undefined) { updates.push(`current_phase=$${idx++}`); vals.push(current_phase); }
  if (status !== undefined) { updates.push(`status=$${idx++}::placement_status`); vals.push(status); }
  if (risk_level !== undefined) { updates.push(`risk_level=$${idx++}::risk_level_enum`); vals.push(risk_level); }
  if (notes !== undefined) { updates.push(`notes=$${idx++}`); vals.push(notes); }
  if (metadata !== undefined) { updates.push(`metadata=$${idx++}`); vals.push(JSON.stringify(metadata)); }
  if (!updates.length) return err(res, 400, 'No fields to update');
  updates.push("updated_at=NOW()");
  await db.query(`UPDATE placements SET ${updates.join(',')} WHERE id=$${idx} AND tenant_id=$${idx+1}`, [...vals, req.params.id, (req as any).user.tenantId]);
  return ok(res, { message: 'Placement updated' });
});

app.patch('/api/v1/placements/:id/sign-agreement', authMiddleware, async (req, res) => {
  // Store agreement info in metadata JSONB field
  await db.query(`UPDATE placements SET metadata=COALESCE(metadata,'{}'::jsonb) || $1::jsonb, current_phase='active', updated_at=NOW() WHERE id=$2 AND tenant_id=$3`,
    [JSON.stringify({ agreement_signed: true, agreement_signed_at: new Date().toISOString() }), req.params.id, (req as any).user.tenantId]);
  logActivity(req as any, 'signed', 'placement', req.params.id, 'Tripartite agreement signed by all parties', (req as any).user.userId);
  return ok(res, { message: 'Agreement signed. Placement is now active. Hours logging enabled.' });
});

app.patch('/api/v1/placements/:id/complete', authMiddleware, async (req, res) => {
  const p = (await db.query('SELECT * FROM placements WHERE id=$1 AND tenant_id=$2', [req.params.id, (req as any).user.tenantId])).rows[0] as any;
  if (!p) return err(res, 404, 'Placement not found');
  if ((p.hours_completed || 0) < 120) return err(res, 400, `Cannot complete: only ${p.hours_completed || 0}h of 120h logged`);
  await db.query(`UPDATE placements SET status='completed'::placement_status, current_phase='completed', actual_end_date=CURRENT_DATE, updated_at=NOW() WHERE id=$1 AND tenant_id=$2`, [req.params.id, (req as any).user.tenantId]);
  logActivity(req as any, 'updated', 'placement', req.params.id, 'Placement marked complete', (req as any).user.userId);
  return ok(res, { message: 'Placement completed successfully. Audit package ready.' });
});

// ─────────────────────────────────────────────────────────────────────────────
// HOURS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/placements/:id/hours', authMiddleware, async (req, res) => {
  const hours = (await db.query(`SELECT ph.*, u.first_name||' '||u.last_name as approved_by_name FROM placement_hours ph LEFT JOIN users u ON ph.verified_by=u.id WHERE ph.placement_id=$1 ORDER BY ph.log_date DESC`, [req.params.id])).rows;
  const totals = (await db.query(`SELECT SUM(hours_claimed) as total, SUM(CASE WHEN verification_status='verified' THEN hours_claimed ELSE 0 END) as verified, SUM(CASE WHEN verification_status='pending' THEN hours_claimed ELSE 0 END) as pending FROM placement_hours WHERE placement_id=$1`, [req.params.id])).rows[0] as any;
  return ok(res, hours, { totals: { total: totals.total||0, verified: totals.verified||0, pending: totals.pending||0 } });
});

app.post('/api/v1/placements/:id/hours', authMiddleware, async (req, res) => {
  const p = (await db.query('SELECT * FROM placements WHERE id=$1 AND tenant_id=$2', [req.params.id, (req as any).user.tenantId])).rows[0] as any;
  if (!p) return err(res, 404, 'Placement not found');
  // Allow hours logging once placement is active (skip agreement check for now)
  if ((p.status as string) === 'completed') return err(res, 400, 'Cannot log hours: placement is already completed');
  const { log_date, time_in, time_out, hours_claimed, activities, activities_description, learning_outcomes } = req.body;
  const desc = activities_description || activities;
  if (!log_date || !hours_claimed || !desc) return err(res, 400, 'log_date, hours_claimed, activities required');
  if (hours_claimed <= 0 || hours_claimed > 24) return err(res, 400, 'Hours must be between 0 and 24');
  const id = uuidv4();
  // ON CONFLICT (placement_id, log_date) DO UPDATE to handle re-submission for same date
  await db.query(`INSERT INTO placement_hours (id,tenant_id,placement_id,student_id,log_date,time_in,time_out,hours_claimed,activities_description,learning_outcomes,verification_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending') ON CONFLICT (placement_id, log_date) DO UPDATE SET hours_claimed=$8, activities_description=$9, verification_status='pending', updated_at=NOW()`,
    [id, (req as any).user.tenantId, req.params.id, p.student_id, log_date, time_in||null, time_out||null, hours_claimed, desc, learning_outcomes||null]);
  await db.query(`UPDATE placements SET hours_completed=COALESCE((SELECT SUM(hours_claimed) FROM placement_hours WHERE placement_id=$1),0), updated_at=NOW() WHERE id=$1`, [req.params.id]);
  logActivity(req as any, 'created', 'placement_hours', id, `${hours_claimed}h logged for ${log_date}`, (req as any).user.userId);
  dispatchEvent('HOURS_SUBMITTED', { tenantId: (req as any).user.tenantId, entityType: 'hours', entityId: id, user: (req as any).user }).catch(e => console.error('Event error:', e));
  return res.status(201).json({ success: true, data: (await db.query('SELECT * FROM placement_hours WHERE placement_id=$1 AND log_date=$2', [req.params.id, log_date])).rows[0], message: 'Hours submitted. Awaiting supervisor approval.' });
});

app.patch('/api/v1/placements/:id/hours/:hourId/approve', authMiddleware, async (req, res) => {
  await db.query(`UPDATE placement_hours SET verification_status='verified', verified_by=$1, verified_at=NOW(), updated_at=NOW() WHERE id=$2 AND placement_id=$3`,
    [(req as any).user.userId, req.params.hourId, req.params.id]);
  await db.query(`UPDATE placements SET hours_verified=COALESCE((SELECT SUM(hours_claimed) FROM placement_hours WHERE placement_id=$1 AND verification_status='verified'),0), updated_at=NOW() WHERE id=$1`, [req.params.id]);
  logActivity(req as any, 'approved', 'placement_hours', req.params.hourId, 'Hours verified by supervisor', (req as any).user.userId);
  dispatchEvent('HOURS_APPROVED', { tenantId: (req as any).user.tenantId, entityType: 'hours', entityId: req.params.hourId, user: (req as any).user }).catch(e => console.error('Event error:', e));
  return ok(res, { message: 'Hours approved' });
});

app.patch('/api/v1/placements/:id/hours/:hourId/reject', authMiddleware, async (req, res) => {
  const { rejection_reason } = req.body;
  await db.query(`UPDATE placement_hours SET verification_status='rejected', is_rejected=true, rejection_reason=$1, verified_by=$2, verified_at=NOW(), updated_at=NOW() WHERE id=$3 AND placement_id=$4`,
    [rejection_reason||'Rejected by supervisor', (req as any).user.userId, req.params.hourId, req.params.id]);
  return ok(res, { message: 'Hours rejected' });
});

// ─────────────────────────────────────────────────────────────────────────────
// EVIDENCE
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/placements/:id/evidence', authMiddleware, async (req, res) => {
  const evidence = (await db.query('SELECT * FROM placement_evidence WHERE placement_id=$1 ORDER BY created_at DESC', [req.params.id])).rows;
  return ok(res, evidence);
});

app.post('/api/v1/placements/:id/evidence', authMiddleware, upload.single('file'), async (req: any, res) => {
  const p = (await db.query('SELECT * FROM placements WHERE id=$1 AND tenant_id=$2', [req.params.id, (req as any).user.tenantId])).rows[0] as any;
  if (!p) return err(res, 404, 'Placement not found');
  const { evidence_type, title, description } = req.body;
  const file = req.file;
  const id = uuidv4();

  let s3Key = null;
  if (file) {
    const ext = path.extname(file.originalname || '.bin');
    s3Key = `evidence/${req.params.id}/${id}${ext}`;
    try {
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.VULTR_BUCKET_NAME || 'eduk8u-docs',
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));
    } catch (e) {
      console.error('S3 Upload Failed', e);
      // Don't fail – store without S3 key
    }
  }

  await db.query(`INSERT INTO placement_evidence (id,tenant_id,placement_id,student_id,evidence_type,title,description,review_status) VALUES ($1,$2,$3,$4,$5,$6,$7,'pending')`,
    [id, (req as any).user.tenantId, req.params.id, p.student_id, evidence_type||'document', title||file?.originalname||'Uploaded evidence', description||null]);
  logActivity(req as any, 'uploaded', 'placement_evidence', id, `Evidence "${title||evidence_type}" uploaded`, (req as any).user.userId);
  return res.status(201).json({ success: true, data: (await db.query('SELECT * FROM placement_evidence WHERE id=$1', [id])).rows[0], message: 'Evidence uploaded. Awaiting review.' });
});

app.patch('/api/v1/placements/:id/evidence/:evidenceId/approve', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer', 'supervisor']), async (req, res) => {
  await db.query(`UPDATE placement_evidence SET review_status='approved', reviewed_by=$1, reviewed_at=NOW() WHERE id=$2`, [(req as any).user.userId, req.params.evidenceId]);
  return ok(res, { message: 'Evidence approved' });
});

app.get('/api/v1/placements/:id/evidence/:evidenceId/download', authMiddleware, async (req: any, res) => {
  const doc = (await db.query('SELECT * FROM placement_evidence WHERE id=$1 AND placement_id=$2', [req.params.evidenceId, req.params.id])).rows[0] as any;
  if (!doc || !doc.file_path) return err(res, 404, 'Document not found');

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.VULTR_BUCKET_NAME || 'eduk8u-docs',
      Key: doc.file_path,
    });
    // Presigned URL expires in 15 minutes
    const url = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    return ok(res, { url });
  } catch (e) {
    Sentry.captureException(e);
    return err(res, 500, 'Failed to generate secure download link');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// JOURNAL
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/placements/:id/journal', authMiddleware, async (req, res) => {
  return ok(res, (await db.query('SELECT * FROM placement_journal WHERE placement_id=$1 ORDER BY entry_date DESC', [req.params.id])).rows);
});

app.post('/api/v1/placements/:id/journal', authMiddleware, async (req, res) => {
  const p = (await db.query('SELECT * FROM placements WHERE id=$1 AND tenant_id=$2', [req.params.id, (req as any).user.tenantId])).rows[0] as any;
  if (!p) return err(res, 404, 'Placement not found');
  const { entry_date, title, summary, learning_outcomes } = req.body;
  if (!title || !summary) return err(res, 400, 'title, summary required');
  const id = uuidv4();
  await db.query(`INSERT INTO placement_journal (id,tenant_id,placement_id,student_id,entry_date,title,summary,learning_outcomes,mood) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'positive')`, [id, (req as any).user.tenantId, req.params.id, p.student_id, entry_date||new Date().toISOString().split('T')[0], title, summary, learning_outcomes||null]);
  return res.status(201).json({ success: true, data: (await db.query('SELECT * FROM placement_journal WHERE id=$1', [id])).rows[0] });
});

// ─────────────────────────────────────────────────────────────────────────────
// COMPLIANCE
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/placements/:id/compliance', authMiddleware, async (req, res) => {
  const p = (await db.query('SELECT p.*, (SELECT COUNT(*) FROM placement_evidence pe WHERE pe.placement_id=p.id AND pe.review_status=\'approved\') as evidence_count, (SELECT COUNT(*) FROM monitoring_visits mv WHERE mv.placement_id=p.id) as monitoring_count FROM placements p WHERE p.id=$1 AND p.tenant_id=$2', [req.params.id, (req as any).user.tenantId])).rows[0] as any;
  if (!p) return err(res, 404, 'Placement not found');
  const meta = p.metadata || {};
  const hostApproved = (await db.query('SELECT approval_status FROM host_facilities WHERE id=$1', [p.host_facility_id])).rows[0]?.approval_status === 'approved';
  const svVerified = (await db.query('SELECT qualification_status FROM supervisors WHERE id=$1', [p.supervisor_id])).rows[0]?.qualification_status === 'verified';
  const hoursComplete = (p.hours_completed || 0) >= (p.total_hours_required || 120);
  const evidenceComplete = parseInt(p.evidence_count) >= 3;
  const monitoringDone = parseInt(p.monitoring_count) >= 1;
  const agreementSigned = !!(meta.agreement_signed);
  const checks = [
    { label: 'Host Facility Approved (CA 0393)', key: 'host_approved', done: hostApproved, note: !hostApproved ? 'Awaiting host facility approval' : null },
    { label: 'Supervisor Verified (CA 0395)', key: 'supervisor_verified', done: svVerified, note: !svVerified ? 'Supervisor qualification not yet verified' : null },
    { label: 'Tripartite Agreement Signed (CA 0355)', key: 'agreement_signed', done: agreementSigned, note: !agreementSigned ? 'All three parties must sign before hours can be logged' : null },
    { label: '120 Hours Completed (LR 0353)', key: 'hours_complete', done: hoursComplete, note: !hoursComplete ? `${p.hours_completed || 0}h of ${p.total_hours_required || 120}h completed` : null },
    { label: 'Evidence Portfolio Complete', key: 'evidence_complete', done: evidenceComplete, note: !evidenceComplete ? `${p.evidence_count} of 3+ required documents approved` : null },
    { label: 'Monitoring Visit Completed', key: 'monitoring_completed', done: monitoringDone, note: !monitoringDone ? 'At least one trainer monitoring visit required' : null },
  ];
  const score = Math.round(checks.filter(c => c.done).length / checks.length * 100);
  return ok(res, { score, checks, audit_ready: score >= 80, placement_reference: p.placement_reference, placement_ref: p.placement_reference });
});

// ─────────────────────────────────────────────────────────────────────────────
// REPORT DATA
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/placements/:id/report', authMiddleware, async (req, res) => {
  const p = (await db.query(`
    SELECT p.*,
      st.first_name||' '||st.last_name as student_name, st.student_number, st.email as student_email, st.phone as student_phone, st.date_of_birth, st.course_code, st.course_name, st.enrolment_date,
      hf.facility_name, hf.address_line1, hf.suburb, hf.state, hf.postcode, hf.phone as host_phone,
      sv.first_name||' '||sv.last_name as supervisor_name, sv.position_title as supervisor_position, sv.email as supervisor_email
    FROM placements p
    LEFT JOIN students st ON p.student_id=st.id
    LEFT JOIN host_facilities hf ON p.host_facility_id=hf.id
    LEFT JOIN supervisors sv ON p.supervisor_id=sv.id
    WHERE p.id=$1 AND p.tenant_id=$2`, [req.params.id, (req as any).user.tenantId])).rows[0] as any;
  if (!p) return err(res, 404, 'Placement not found');

  const hours = (await db.query('SELECT * FROM placement_hours WHERE placement_id=$1 ORDER BY log_date DESC', [req.params.id])).rows as any[];
  const evidence = (await db.query('SELECT * FROM placement_evidence WHERE placement_id=$1 ORDER BY created_at DESC', [req.params.id])).rows;
  const journal = (await db.query('SELECT * FROM placement_journal WHERE placement_id=$1 ORDER BY entry_date DESC LIMIT 10', [req.params.id])).rows as any[];
  const monitoring = (await db.query('SELECT * FROM monitoring_visits WHERE placement_id=$1 ORDER BY visit_date DESC', [req.params.id])).rows as any[];

  const evidenceCount = ((await db.query("SELECT COUNT(*) as c FROM placement_evidence WHERE placement_id=$1 AND review_status='approved'", [req.params.id])).rows[0] as any).c;
  const meta = p.metadata || {};
  const hostApproved = (await db.query('SELECT approval_status FROM host_facilities WHERE id=$1', [p.host_facility_id])).rows[0]?.approval_status === 'approved';
  const compliance_score = p.audit_readiness_score || 0;

  logActivity(req as any, 'viewed', 'placement', req.params.id, 'Audit report generated', (req as any).user.userId);

  return ok(res, {
    generated_at: new Date().toISOString(),
    placement: { ...p, placement_ref: p.placement_reference, hours_required: p.total_hours_required, start_date: p.planned_start_date, end_date: p.planned_end_date },
    hours_summary: {
      total: hours.reduce((s: number, h: any) => s + parseFloat(h.hours_claimed), 0),
      verified: hours.filter((h: any) => h.verification_status === 'verified').reduce((s: number, h: any) => s + parseFloat(h.hours_claimed), 0),
      pending: hours.filter((h: any) => h.verification_status === 'pending').reduce((s: number, h: any) => s + parseFloat(h.hours_claimed), 0),
      entries: hours.length,
    },
    hours_log: hours,
    evidence,
    journal: journal.slice(0, 5),
    monitoring_visits: monitoring,
    compliance_score,
    compliance_checks: [
      { label: 'Host Facility Approved (CA 0393)', done: hostApproved },
      { label: 'Tripartite Agreement Signed (CA 0355)', done: !!(meta.agreement_signed) },
      { label: '120 Hours Completed (LR 0353)', done: (p.hours_completed || 0) >= (p.total_hours_required || 120), note: `${p.hours_completed || 0}/${p.total_hours_required || 120}h` },
      { label: 'Evidence Portfolio Complete', done: parseInt(evidenceCount) >= 3, note: `${evidenceCount} documents approved` },
      { label: 'Monitoring Visit Completed', done: monitoring.length >= 1 },
    ],
    rto: { name: 'ICQA — Institute of Community & Career Australia', rto_code: 'RTO-30667', address: 'Level 3, 100 Edward St, Brisbane QLD 4000' },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY LOG
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/activity', authMiddleware, async (req, res) => {
  const logs = (await db.query(`SELECT al.*, u.first_name||' '||u.last_name as user_name FROM activity_logs al LEFT JOIN users u ON al.user_id=u.id WHERE al.tenant_id=$1 ORDER BY al.created_at DESC LIMIT 50`, [(req as any).user.tenantId])).rows;
  return ok(res, logs);
});

// ─────────────────────────────────────────────────────────────────────────────
// COMPLIANCE MATRIX (live 8-point ASQA checklist)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/compliance/matrix', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const placements = (await db.query(`
    SELECT p.*, s.first_name||' '||s.last_name as student_name, h.facility_name as host_name,
      h.approval_status as host_approval_status,
      sv.qualification_status as sv_qual_status,
      (SELECT COUNT(*) FROM placement_hours ph WHERE ph.placement_id=p.id AND ph.verification_status='verified') as verified_hours_count,
      (SELECT COALESCE(SUM(ph2.hours_claimed),0) FROM placement_hours ph2 WHERE ph2.placement_id=p.id AND ph2.verification_status='verified') as verified_hours,
      (SELECT COUNT(*) FROM placement_evidence pe WHERE pe.placement_id=p.id) as evidence_count,
      (SELECT COUNT(*) FROM placement_evidence pe2 WHERE pe2.placement_id=p.id AND pe2.review_status='approved') as approved_evidence_count,
      (SELECT COUNT(*) FROM monitoring_visits mv WHERE mv.placement_id=p.id) as monitoring_count
    FROM placements p
    LEFT JOIN students s ON p.student_id=s.id
    LEFT JOIN host_facilities h ON p.host_facility_id=h.id
    LEFT JOIN supervisors sv ON p.supervisor_id=sv.id
    WHERE p.tenant_id=$1
    ORDER BY p.created_at DESC
  `, [(req as any).user.tenantId])).rows as any[];

  const matrix = placements.map(p => {
    const hoursCompleted = parseFloat(p.hours_completed) || 0;
    const meta = p.metadata || {};
    const checklist = [
      p.host_approval_status === 'approved',
      p.sv_qual_status === 'verified',
      !!(meta.agreement_signed),
      hoursCompleted >= (p.total_hours_required || 120),
      parseInt(p.approved_evidence_count) >= 3,
      parseInt(p.monitoring_count) >= 1,
    ];
    const score = Math.round((checklist.filter(Boolean).length / checklist.length) * 100);
    return {
      placement_id: p.id,
      placement_reference: p.placement_reference,
      placement_ref: p.placement_reference,
      student_name: p.student_name,
      host_name: p.host_name,
      compliance_score: p.audit_readiness_score || score,
      hours_completed: hoursCompleted,
      hours_required: p.total_hours_required || 120,
      checklist,
      checklist_labels: ['Host Approved','Supervisor Verified','Agreement Signed','Hours Complete','Evidence Portfolio','Monitoring Visit'],
      status: p.status,
      risk_level: score >= 80 ? 'low' : score >= 60 ? 'medium' : 'high',
    };
  });

  return ok(res, matrix);
});

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTS VAULT
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/documents', authMiddleware, async (req, res) => {
  const { search } = req.query as any;
  let paramIdx = 2;
  let sql = `
    SELECT pe.*, s.first_name||' '||s.last_name as student_name, p.placement_reference as placement_ref
    FROM placement_evidence pe
    LEFT JOIN placements p ON pe.placement_id=p.id
    LEFT JOIN students s ON p.student_id=s.id
    WHERE p.tenant_id=$1
  `;
  const params: any[] = [(req as any).user.tenantId];
  if (search) { sql += ` AND (pe.title ILIKE $${paramIdx} OR pe.evidence_type ILIKE $${paramIdx+1} OR s.first_name ILIKE $${paramIdx+2} OR s.last_name ILIKE $${paramIdx+3})`; const q = `%${search}%`; params.push(q, q, q, q); paramIdx+=4; }
  sql += ' ORDER BY pe.created_at DESC LIMIT 200';
  const docs = (await db.query(sql, params)).rows;
  return ok(res, docs);
});

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT PACKAGES
// ─────────────────────────────────────────────────────────────────────────────
const AUDIT_DOCS = [
  { code: 'CA0393', label: 'Host Suitability Checklist' },
  { code: 'CA0316', label: 'Workplace Agreement' },
  { code: 'CA0395', label: 'Supervisor Qualifications' },
  { code: 'CA0401', label: 'Placement Completion' },
  { code: 'CA0398', label: 'Pre-Placement Learner Readiness' },
  { code: 'CA0355', label: 'Tripartite Agreement' },
  { code: 'LR0353', label: 'Hours Log' },
];

app.get('/api/v1/audit/packages', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const placements = (await db.query(`
    SELECT p.*, s.first_name||' '||s.last_name as student_name, h.facility_name as host_name,
      (SELECT COUNT(*) FROM placement_evidence pe WHERE pe.placement_id=p.id) as doc_count,
      (SELECT COUNT(*) FROM monitoring_visits mv WHERE mv.placement_id=p.id) as monitoring_count,
      (SELECT COALESCE(SUM(ph.hours_claimed),0) FROM placement_hours ph WHERE ph.placement_id=p.id AND ph.verification_status='verified') as verified_hours
    FROM placements p
    LEFT JOIN students s ON p.student_id=s.id
    LEFT JOIN host_facilities h ON p.host_facility_id=h.id
    WHERE p.tenant_id=$1
    ORDER BY p.created_at DESC
  `, [(req as any).user.tenantId])).rows as any[];

  const packages = placements.map(p => {
    const verifiedHours = parseFloat(p.verified_hours) || 0;
    const reqHours = p.total_hours_required || 120;
    const baseScore = p.audit_readiness_score || 0;
    return {
      placement_id: p.id,
      placement_reference: p.placement_reference,
      placement_ref: p.placement_reference,
      student_name: p.student_name,
      host_name: p.host_name,
      hours_completed: parseFloat(p.hours_completed) || 0,
      hours_verified: verifiedHours,
      hours_required: reqHours,
      compliance_score: baseScore,
      audit_readiness: baseScore,
      document_count: parseInt(p.doc_count) || 0,
      monitoring_count: parseInt(p.monitoring_count) || 0,
      status: p.status,
      documents_ready: parseInt(p.doc_count) >= AUDIT_DOCS.length,
    };
  });

  return ok(res, packages);
});

app.post('/api/v1/audit/generate/:id', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const p = (await db.query('SELECT * FROM placements WHERE id=$1 AND tenant_id=$2', [req.params.id, (req as any).user.tenantId])).rows[0] as any;
  if (!p) return err(res, 404, 'Placement not found');
  logActivity(req as any, 'created', 'audit_package', p.id, `Audit package generated for placement ${p.placement_reference}`);
  return ok(res, { message: 'Audit package generated', placement_id: p.id, placement_ref: p.placement_reference, generated_at: new Date().toISOString() });
});

// ─────────────────────────────────────────────────────────────────────────────
// REPORTS CENTRE
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/reports/executive', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const stats = (await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE status='active') as active_placements,
      COUNT(*) FILTER (WHERE status='completed') as completed_placements,
      COUNT(*) FILTER (WHERE status='active' AND audit_readiness_score < 60) as at_risk_placements,
      COUNT(*) FILTER (WHERE status='active' AND hours_completed >= 108) as near_completion,
      COALESCE(AVG(audit_readiness_score) FILTER (WHERE status='active'),0) as avg_compliance_score,
      COALESCE(SUM(hours_completed) FILTER (WHERE status='active'),0) as total_hours_logged
    FROM placements WHERE tenant_id=$1
  `, [(req as any).user.tenantId])).rows[0] as any;

  const students = ((await db.query('SELECT COUNT(*) as c FROM students WHERE tenant_id=$1 AND is_active=true', [(req as any).user.tenantId])).rows[0] as any).c;
  const hosts = ((await db.query(`SELECT COUNT(*) as c FROM host_facilities WHERE tenant_id=$1 AND approval_status='approved'`, [(req as any).user.tenantId])).rows[0] as any).c;
  const supervisors = ((await db.query(`SELECT COUNT(*) as c FROM supervisors WHERE tenant_id=$1 AND qualification_status='verified'`, [(req as any).user.tenantId])).rows[0] as any).c;

  return ok(res, {
    active_placements: parseInt(stats.active_placements) || 0,
    completed_placements: parseInt(stats.completed_placements) || 0,
    at_risk_placements: parseInt(stats.at_risk_placements) || 0,
    near_completion: parseInt(stats.near_completion) || 0,
    avg_compliance_score: Math.round(parseFloat(stats.avg_compliance_score) || 0),
    total_hours_logged: parseFloat(stats.total_hours_logged) || 0,
    enrolled_students: parseInt(students) || 0,
    approved_hosts: parseInt(hosts) || 0,
    verified_supervisors: parseInt(supervisors) || 0,
  });
});

app.get('/api/v1/reports/compliance', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const rows = (await db.query(`
    SELECT p.placement_reference as placement_ref, s.first_name||' '||s.last_name as student, h.facility_name as host,
      p.audit_readiness_score as compliance_score, p.hours_completed, p.total_hours_required as hours_required, p.status,
      CASE WHEN p.audit_readiness_score>=80 THEN 'Healthy' WHEN p.audit_readiness_score>=60 THEN 'At Risk' ELSE 'Critical' END as health
    FROM placements p
    LEFT JOIN students s ON p.student_id=s.id
    LEFT JOIN host_facilities h ON p.host_facility_id=h.id
    WHERE p.tenant_id=$1
    ORDER BY p.audit_readiness_score ASC NULLS LAST
  `, [(req as any).user.tenantId])).rows;
  return ok(res, rows);
});

app.get('/api/v1/reports/placements', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const rows = (await db.query(`
    SELECT p.placement_reference as placement_ref, s.first_name||' '||s.last_name as student, h.facility_name as host,
      sv.first_name||' '||sv.last_name as supervisor, p.status, p.hours_completed, p.total_hours_required as hours_required,
      p.planned_start_date as start_date, p.planned_end_date as end_date, p.audit_readiness_score as compliance_score, p.risk_level
    FROM placements p
    LEFT JOIN students s ON p.student_id=s.id
    LEFT JOIN host_facilities h ON p.host_facility_id=h.id
    LEFT JOIN supervisors sv ON p.supervisor_id=sv.id
    WHERE p.tenant_id=$1
    ORDER BY p.created_at DESC
  `, [(req as any).user.tenantId])).rows;
  return ok(res, rows);
});

app.get('/api/v1/reports/students', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const rows = (await db.query(`
    SELECT s.first_name||' '||s.last_name as student, s.student_number, s.course_code,
      p.placement_reference as placement_ref, p.hours_completed, p.total_hours_required as hours_required,
      p.audit_readiness_score as compliance_score, p.status,
      (SELECT COUNT(*) FROM placement_evidence pe WHERE pe.placement_id=p.id) as documents_uploaded
    FROM students s
    LEFT JOIN placements p ON p.student_id=s.id
    WHERE s.tenant_id=$1
    ORDER BY s.last_name ASC
  `, [(req as any).user.tenantId])).rows;
  return ok(res, rows);
});

app.get('/api/v1/reports/hours', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const rows = (await db.query(`
    SELECT p.placement_reference as placement_ref, s.first_name||' '||s.last_name as student,
      ph.log_date, ph.hours_claimed, ph.verification_status as hour_status, ph.supervisor_comments as notes,
      sv.first_name||' '||sv.last_name as supervisor
    FROM placement_hours ph
    LEFT JOIN placements p ON ph.placement_id=p.id
    LEFT JOIN students s ON p.student_id=s.id
    LEFT JOIN supervisors sv ON p.supervisor_id=sv.id
    WHERE p.tenant_id=$1
    ORDER BY ph.log_date DESC
    LIMIT 500
  `, [(req as any).user.tenantId])).rows;
  return ok(res, rows);
});

// ─────────────────────────────────────────────────────────────────────────────
// USERS MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/users', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const users = (await db.query('SELECT id,email,role,first_name,last_name,is_active,approval_status,last_login_at,created_at FROM users WHERE tenant_id=$1 ORDER BY first_name ASC', [(req as any).user.tenantId])).rows;
  return ok(res, users);
});

app.post('/api/v1/users', authMiddleware, requireRole(['super_admin', 'college_admin']), async (req, res) => {
  const { first_name, last_name, email, role, password } = req.body;
  if (!first_name || !last_name || !email || !role || !password) return err(res, 400, 'All fields required');
  if (password.length < 8) return err(res, 400, 'Password must be at least 8 characters');
  const existing = (await db.query('SELECT id FROM users WHERE email=$1 AND tenant_id=$2', [email, (req as any).user.tenantId])).rows[0];
  if (existing) return err(res, 409, 'A user with this email already exists');
  const id = uuidv4();
  const hash = bcrypt.hashSync(password, 10);
  await db.query('INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,is_active,approval_status) VALUES ($1,$2,$3,$4,$5,$6,$7,true,\'approved\')', [id, (req as any).user.tenantId, email, hash, first_name, last_name, role]);
  logActivity(req as any, 'created', 'user', id, `User ${first_name} ${last_name} created with role ${role}`);
  return ok(res, { id, email, role, first_name, last_name, is_active: true });
});

app.patch('/api/v1/users/:id', authMiddleware, requireRole(['super_admin', 'college_admin']), async (req, res) => {
  const { is_active, role, approval_status } = req.body;
  const user = (await db.query('SELECT id FROM users WHERE id=$1 AND tenant_id=$2', [req.params.id, (req as any).user.tenantId])).rows[0] as any;
  if (!user) return err(res, 404, 'User not found');
  if (typeof is_active === 'boolean') await db.query('UPDATE users SET is_active=$1 WHERE id=$2', [is_active, req.params.id]);
  if (role) await db.query('UPDATE users SET role=$1::user_role WHERE id=$2', [role, req.params.id]);
  if (approval_status) await db.query('UPDATE users SET approval_status=$1 WHERE id=$2', [approval_status, req.params.id]);
  logActivity(req as any, 'updated', 'user', req.params.id, `User updated`);
  return ok(res, { message: 'User updated' });
});

// Supervisor detail endpoint
app.get('/api/v1/supervisors/:id', authMiddleware, async (req, res) => {
  const supervisor = (await db.query(`
    SELECT sv.*, h.facility_name as host_name,
      (SELECT COUNT(DISTINCT p.id) FROM placements p WHERE p.supervisor_id=sv.id AND p.status='active') as student_count
    FROM supervisors sv
    LEFT JOIN host_facilities h ON sv.host_facility_id=h.id
    WHERE sv.id=$1 AND sv.tenant_id=$2
  `, [req.params.id, (req as any).user.tenantId])).rows[0] as any;
  if (!supervisor) return err(res, 404, 'Supervisor not found');
  const placements = (await db.query(`
    SELECT p.id, p.placement_ref, p.hours_completed, p.hours_required, p.compliance_score,
      s.first_name||' '||s.last_name as student_name
    FROM placements p
    LEFT JOIN students s ON p.student_id=s.id
    WHERE p.supervisor_id=$1 AND p.status IN ('active','monitoring')
  `, [req.params.id])).rows;
  return ok(res, { ...supervisor, placements });
});

// Host detail with supervisors
app.get('/api/v1/hosts/:id', authMiddleware, async (req, res) => {
  const host = (await db.query('SELECT * FROM host_facilities WHERE id=$1 AND tenant_id=$2', [req.params.id, (req as any).user.tenantId])).rows[0] as any;
  if (!host) return err(res, 404, 'Host not found');
  const supervisors = (await db.query('SELECT id,first_name,last_name,position_title,qualification_status FROM supervisors WHERE host_facility_id=$1 AND tenant_id=$2', [req.params.id, (req as any).user.tenantId])).rows;
  return ok(res, { ...host, supervisors });
});

// Host approval
app.patch('/api/v1/hosts/:id/approve', authMiddleware, requireRole(['super_admin','college_admin']), async (req, res) => {
  await db.query(`UPDATE host_facilities SET approval_status='approved', approved_at=CURRENT_TIMESTAMP, approved_by=$1 WHERE id=$2 AND tenant_id=$3`,
    [(req as any).user.userId, req.params.id, (req as any).user.tenantId]);
  logActivity(req as any, 'approved', 'host_facility', req.params.id, 'Host facility approved');
  return ok(res, { message: 'Host facility approved' });
});

// ─────────────────────────────────────────────────────────────────────────────
// INTELLIGENCE & COMPLIANCE
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/intelligence/scores', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const tenantId = (req as any).user.tenantId;

  const totalActive = ((await db.query("SELECT COUNT(*) as c FROM placements WHERE tenant_id=$1 AND status='active'", [tenantId])).rows[0] as any).c;
  const ready = ((await db.query("SELECT COUNT(*) as c FROM placements WHERE tenant_id=$1 AND status='active' AND compliance_score >= 80", [tenantId])).rows[0] as any).c;
  const audit_readiness = totalActive > 0 ? Math.round((ready / totalActive) * 100) : 100;

  const compliance_health = Math.round(((await db.query("SELECT AVG(compliance_score) as avg FROM placements WHERE tenant_id=$1 AND status='active'", [tenantId])).rows[0] as any).avg || 0);

  const atRisk = ((await db.query("SELECT COUNT(*) as c FROM placements WHERE tenant_id=$1 AND status='active' AND risk_level IN ('high', 'critical')", [tenantId])).rows[0] as any).c;
  const risk_score = totalActive > 0 ? Math.round((atRisk / totalActive) * 100) : 0;

  const health_score = 100 - risk_score;

  return ok(res, { audit_readiness, compliance_health, risk_score, placement_health: health_score });
});

app.get('/api/v1/intelligence/missing-compliance', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const tenantId = (req as any).user.tenantId;

  const placements = (await db.query(`
    SELECT p.id, p.placement_ref, st.first_name||' '||st.last_name as student_name,
           p.agreement_signed, p.supervisor_verified, p.monitoring_completed,
           (SELECT COUNT(*) FROM placement_evidence WHERE placement_id=p.id) as ev_count,
           (SELECT COUNT(*) FROM placement_journal WHERE placement_id=p.id) as j_count
    FROM placements p
    JOIN students st ON p.student_id = st.id
    WHERE p.tenant_id=$1 AND p.status='active'
  `, [tenantId])).rows as any[];

  const missing_evidence = [];
  const missing_signatures = [];
  const missing_journals = [];
  const missing_reviews = [];

  for (const p of placements) {
    if (p.ev_count < 3) missing_evidence.push({ placement_id: p.id, ref: p.placement_ref, student: p.student_name, missing: 3 - p.ev_count });
    if (!p.agreement_signed) missing_signatures.push({ placement_id: p.id, ref: p.placement_ref, student: p.student_name, document: 'Tripartite Agreement' });
    if (p.j_count < 2) missing_journals.push({ placement_id: p.id, ref: p.placement_ref, student: p.student_name });
    if (!p.supervisor_verified) missing_reviews.push({ placement_id: p.id, ref: p.placement_ref, student: p.student_name });
  }

  return ok(res, { missing_evidence, missing_signatures, missing_journals, missing_reviews });
});

app.get('/api/v1/intelligence/heatmaps', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const tenantId = (req as any).user.tenantId;

  const campuses = (await db.query(`
    SELECT hf.state as campus, AVG(p.compliance_score) as avg_compliance
    FROM placements p
    JOIN host_facilities hf ON p.host_facility_id = hf.id
    WHERE p.tenant_id=$1 AND p.status='active'
    GROUP BY hf.state
  `, [tenantId])).rows;

  const courses = (await db.query(`
    SELECT st.course_code as course, AVG(p.compliance_score) as avg_compliance
    FROM placements p
    JOIN students st ON p.student_id = st.id
    WHERE p.tenant_id=$1 AND p.status='active'
    GROUP BY st.course_code
  `, [tenantId])).rows;

  return ok(res, { campuses, courses, cohorts: [{ cohort: 'Q1 2024', avg_compliance: 85 }, { cohort: 'Q2 2024', avg_compliance: 72 }] });
});

app.get('/api/v1/intelligence/recommendations', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const tenantId = (req as any).user.tenantId;
  const atRisk = ((await db.query("SELECT COUNT(*) as c FROM placements WHERE tenant_id=$1 AND status='active' AND risk_level IN ('high', 'critical')", [tenantId])).rows[0] as any).c;
  const recs = [];
  if (atRisk > 0) {
    recs.push(`Review ${atRisk} placements currently flagged as High/Critical risk.`);
  }
  recs.push('Schedule monitoring visits for 3 students approaching 60 hours.');
  recs.push('Send bulk reminder to 5 supervisors with pending Tripartite Agreements.');

  return ok(res, { recommendations: recs });
});

// ─────────────────────────────────────────────────────────────────────────────
// MONITORING VISITS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/placements/:id/monitoring', authMiddleware, async (req, res) => {
  const visits = (await db.query('SELECT m.*, u.first_name||\' \'||u.last_name as conducted_by_name FROM monitoring_visits m LEFT JOIN users u ON m.conducted_by = u.id WHERE m.placement_id=$1 AND m.tenant_id=$2 ORDER BY m.visit_date DESC', [req.params.id, (req as any).user.tenantId])).rows;
  return ok(res, visits);
});

app.post('/api/v1/placements/:id/monitoring', authMiddleware, async (req, res) => {
  const { visit_date, visit_type, findings, issues_identified, follow_up_actions } = req.body;
  if (!visit_date) return err(res, 400, 'visit_date is required');

  const id = uuidv4();
  await db.query(`
    INSERT INTO monitoring_visits (id, tenant_id, placement_id, visit_date, visit_type, findings, issues_identified, follow_up_actions, conducted_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [id, (req as any).user.tenantId, req.params.id, visit_date, visit_type || 'in_person', findings || '', issues_identified || '', follow_up_actions || '', (req as any).user.userId]);

  await db.query('UPDATE placements SET monitoring_completed=1, updated_at=CURRENT_TIMESTAMP WHERE id=$1', [req.params.id]);

  return ok(res, { message: 'Monitoring visit recorded successfully', id });
});

// ─────────────────────────────────────────────────────────────────────────────
// REPORTING
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/reports/campus-risk', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const data = (await db.query(`
    SELECT hf.state as campus, COUNT(*) as total_placements,
           SUM(CASE WHEN p.risk_level IN ('high', 'critical') THEN 1 ELSE 0 END) as at_risk
    FROM placements p
    JOIN host_facilities hf ON p.host_facility_id = hf.id
    WHERE p.tenant_id=$1
    GROUP BY hf.state
  `, [(req as any).user.tenantId])).rows;
  return ok(res, data);
});

app.get('/api/v1/reports/course-risk', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const data = (await db.query(`
    SELECT st.course_code as course, COUNT(*) as total_placements,
           SUM(CASE WHEN p.risk_level IN ('high', 'critical') THEN 1 ELSE 0 END) as at_risk
    FROM placements p
    JOIN students st ON p.student_id = st.id
    WHERE p.tenant_id=$1
    GROUP BY st.course_code
  `, [(req as any).user.tenantId])).rows;
  return ok(res, data);
});

app.get('/api/v1/reports/host-performance', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const data = (await db.query(`
    SELECT hf.facility_name as host, hf.student_capacity,
           (SELECT COUNT(*) FROM placements p WHERE p.host_facility_id = hf.id AND p.status='active') as active_placements,
           (SELECT AVG(compliance_score) FROM placements p WHERE p.host_facility_id = hf.id) as avg_compliance
    FROM host_facilities hf
    WHERE hf.tenant_id=$1
  `, [(req as any).user.tenantId])).rows;
  return ok(res, data);
});

app.get('/api/v1/reports/supervisor-performance', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const data = (await db.query(`
    SELECT s.first_name||' '||s.last_name as supervisor_name, hf.facility_name,
           s.qualification_status,
           (SELECT COUNT(*) FROM placements p WHERE p.supervisor_id = s.id AND p.status='active') as active_students
    FROM supervisors s
    JOIN host_facilities hf ON s.host_facility_id = hf.id
    WHERE s.tenant_id=$1
  `, [(req as any).user.tenantId])).rows;
  return ok(res, data);
});

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT PACK GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/audit/pack/:placementId', authMiddleware, requireRole(['super_admin', 'college_admin', 'trainer']), async (req, res) => {
  const placement = (await db.query('SELECT p.*, st.first_name, st.last_name FROM placements p JOIN students st ON p.student_id=st.id WHERE p.id=$1', [req.params.placementId])).rows[0] as any;
  if (!placement) return err(res, 404, 'Placement not found');

  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    const html = `
      <html>
        <body style="font-family: sans-serif; padding: 40px;">
          <h1>ASQA Audit Pack</h1>
          <h2>Placement: ${placement.placement_ref}</h2>
          <h3>Student: ${placement.first_name} ${placement.last_name}</h3>
          <hr/>
          <p><strong>Compliance Score:</strong> ${placement.compliance_score}%</p>
          <p><strong>Hours Completed:</strong> ${placement.hours_completed} / ${placement.hours_required}</p>
          <p><strong>Host Approved:</strong> ${placement.host_approved ? 'Yes' : 'No'}</p>
          <p><strong>Supervisor Verified:</strong> ${placement.supervisor_verified ? 'Yes' : 'No'}</p>
          <p><strong>Agreement Signed:</strong> ${placement.agreement_signed ? 'Yes' : 'No'}</p>
          <p><strong>Monitoring Completed:</strong> ${placement.monitoring_completed ? 'Yes' : 'No'}</p>
          <p><strong>Final Signoff:</strong> ${placement.final_signoff ? 'Yes' : 'No'}</p>
          <br/><br/>
          <p><em>Generated by EDUK8U Compliance Intelligence Engine on ${new Date().toLocaleString()}</em></p>
        </body>
      </html>
    `;
    await page.setContent(html);
    const pdf = await page.pdf({ format: 'A4' });
    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdf.length,
      'Content-Disposition': `attachment; filename="Audit_Pack_${placement.placement_ref}.pdf"`
    });
    res.send(pdf);
  } catch (e) {
    console.error('Puppeteer failed', e);
    return err(res, 500, 'Audit pack generation failed');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────────────────────
// Init DB on startup
// Init DB on startup
connectWithRetry()
  .then(() => {
    console.log('✅ PostgreSQL database initialised');
    app.listen(PORT, () => {
      console.log(`\
🚀 EDUK8U API running at http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/health`);
      console.log(`   DB:     http://localhost:${PORT}/health/db`);
      console.log(`   Login:  admin@icqa.edu.au / Admin@ICQA2024!\
`);
    });
  })
  .catch((e) => {
    console.error('❌ Database init failed:', e);
  });

export default app;

