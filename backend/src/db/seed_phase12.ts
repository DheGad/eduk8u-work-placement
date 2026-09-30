import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const dbPath = path.resolve(__dirname, '../../eduk8u.db');
const db = new Database(dbPath);

console.log('--- Phase 12 Data Seeding ---');

const generateId = () => crypto.randomUUID();
const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);

try {
  db.exec('BEGIN TRANSACTION');

  // 1. Create ICQA Tenant
  const tenantId = generateId();
  db.prepare(`
    INSERT INTO tenants (id, name, slug, is_active, settings)
    VALUES (?, 'ICQA Demonstration College', 'icqa-demo', 1, ?)
  `).run(tenantId, JSON.stringify({
    primaryColor: '#4f46e5',
    logoUrl: 'https://icqa.edu.au/wp-content/uploads/2021/10/ICQA-Logo.png'
  }));
  console.log(`Created ICQA Tenant: ${tenantId}`);

  // 2. Create Realistic Users
  const roles = [
    { email: 'super@eduk8u.com', first: 'Admin', last: 'Super', role: 'super_admin', tid: null },
    { email: 'admin@icqa.edu.au', first: 'College', last: 'Admin', role: 'college_admin', tid: tenantId },
    { email: 'trainer@icqa.edu.au', first: 'Tom', last: 'Trainer', role: 'trainer', tid: tenantId },
    { email: 'host@bluecare.com', first: 'Helen', last: 'Host', role: 'host_manager', tid: tenantId },
    { email: 'supervisor@bluecare.com', first: 'Sarah', last: 'Supervisor', role: 'supervisor', tid: tenantId },
    { email: 'student@icqa.edu.au', first: 'Sam', last: 'Student', role: 'student', tid: tenantId }
  ];

  const userIds: Record<string, string> = {};

  const insertUser = db.prepare(`
    INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);

  for (const r of roles) {
    const id = generateId();
    userIds[r.role] = id;
    insertUser.run(id, r.tid, r.email, defaultPasswordHash, r.first, r.last, r.role);
  }

  // 3. Create 3 Hosts
  const insertHost = db.prepare(`
    INSERT INTO host_facilities (id, tenant_id, facility_name, is_active, approval_status)
    VALUES (?, ?, ?, 1, 'approved')
  `);
  const hosts = [
    { id: generateId(), name: 'BlueCare Respite Centre' },
    { id: generateId(), name: 'Opal Aged Care' },
    { id: generateId(), name: 'Mercy Health' }
  ];
  for (const h of hosts) {
    insertHost.run(h.id, tenantId, h.name);
  }

  // 4. Create 5 Supervisors (assigned to Hosts)
  const insertSupervisor = db.prepare(`
    INSERT INTO supervisors (id, tenant_id, host_facility_id, user_id, first_name, last_name, email, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);
  const supervisors = [];
  for (let i = 0; i < 5; i++) {
    const sId = generateId();
    const isFirst = i === 0; // Use our seeded supervisor user for the first one
    const hostId = hosts[i % hosts.length].id;
    const userId = isFirst ? userIds['supervisor'] : null;
    const email = isFirst ? 'supervisor@bluecare.com' : `sup${i}@example.com`;
    insertSupervisor.run(sId, tenantId, hostId, userId, `Sup${i}`, `Last${i}`, email);
    supervisors.push(sId);
  }

  // 5. Create 45 Students total, 10 deep profiles
  const insertStudentUser = db.prepare(`
    INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 'student', 1)
  `);
  const insertStudent = db.prepare(`
    INSERT INTO students (id, tenant_id, user_id, student_number, first_name, last_name, email, course_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'CHC33015 Certificate III in Individual Support')
  `);
  
  const students = [];
  for (let i = 0; i < 45; i++) {
    const uId = i === 0 ? userIds['student'] : generateId(); // Use our seeded student user for the first one
    const sId = generateId();
    const fName = i === 0 ? 'Sam' : `StudentFirst${i}`;
    const lName = i === 0 ? 'Student' : `StudentLast${i}`;
    const sEmail = i === 0 ? 'student@icqa.edu.au' : `student${i}@icqa.edu.au`;
    
    if (i !== 0) {
      insertStudentUser.run(uId, tenantId, sEmail, defaultPasswordHash, fName, lName);
    }
    
    insertStudent.run(sId, tenantId, uId, `ICQA${1000 + i}`, fName, lName, sEmail);
    students.push(sId);
  }

  // 6. Create 12 Placements (3 complete, 5 active, 2 pending, 2 risk)
  const insertPlacement = db.prepare(`
    INSERT INTO placements (id, tenant_id, student_id, host_facility_id, supervisor_id, trainer_id, placement_ref, status, risk_level, hours_required)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 120)
  `);
  
  const placementConfigs = [
    { status: 'completed', risk: 'none', count: 3 },
    { status: 'active', risk: 'none', count: 5 },
    { status: 'pending', risk: 'none', count: 2 },
    { status: 'active', risk: 'high', count: 2 }
  ];
  
  let placementCounter = 0;
  for (const config of placementConfigs) {
    for (let c = 0; c < config.count; c++) {
      const pId = generateId();
      insertPlacement.run(
        pId, 
        tenantId, 
        students[placementCounter], 
        hosts[placementCounter % hosts.length].id, 
        supervisors[placementCounter % supervisors.length], 
        userIds['trainer'], 
        `P${2000 + placementCounter}`, 
        config.status, 
        config.risk
      );
      placementCounter++;
    }
  }

  db.exec('COMMIT');
  console.log('Successfully seeded database for Phase 12.');
} catch (e) {
  db.exec('ROLLBACK');
  console.error('Error seeding database:', e);
} finally {
  db.close();
}
