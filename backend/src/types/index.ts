import { Request } from 'express';

// ============================================================
// Roles & Auth
// ============================================================

/** All user roles supported by the platform */
export type UserRole =
  | 'super_admin'
  | 'college_admin'
  | 'trainer'
  | 'student'
  | 'supervisor'
  | 'host_manager'
  | 'auditor';

/** Payload stored inside JWT tokens */
export interface JWTPayload {
  userId: string;
  tenantId: string | null;
  role: UserRole;
  email: string;
  iat?: number;
  exp?: number;
}

/** Express Request extended with auth context */
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  tenantId?: string;
}

// ============================================================
// API Response contracts
// ============================================================

/** Standard wrapper for every API response */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: PaginationMeta;
}

/** Pagination metadata returned in list endpoints */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Parsed query params for list/search endpoints */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// ============================================================
// Database entity types
// ============================================================

/** Tenant (college/institution) row */
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  contact_email: string;
  contact_phone: string | null;
  address: string | null;
  logo_url: string | null;
  is_active: boolean;
  settings: Record<string, unknown>;
  subscription_tier: 'starter' | 'professional' | 'enterprise';
  created_at: Date;
  updated_at: Date;
}

/** Platform user row */
export interface User {
  id: string;
  tenant_id: string | null;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  is_email_verified: boolean;
  failed_login_attempts: number;
  locked_until: Date | null;
  last_login_at: Date | null;
  profile_image_url: string | null;
  phone: string | null;
  created_at: Date;
  updated_at: Date;
}

/** Safe user object (no password hash) */
export type SafeUser = Omit<User, 'password_hash'>;

/** Refresh token row */
export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

/** Password reset token row */
export interface PasswordResetToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

/** Email verification token row */
export interface EmailVerificationToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

/** Student profile row */
export interface Student {
  id: string;
  user_id: string;
  tenant_id: string;
  student_number: string;
  date_of_birth: Date | null;
  gender: string | null;
  nationality: string | null;
  programme: string;
  cohort_year: number;
  course_level: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  wwc_number: string | null;
  wwc_expiry: Date | null;
  ndis_clearance: boolean;
  ndis_clearance_date: Date | null;
  additional_needs: string | null;
  created_at: Date;
  updated_at: Date;
}

/** Host facility (employer) row */
export interface HostFacility {
  id: string;
  tenant_id: string;
  name: string;
  abn: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  address: string;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  sector: string | null;
  facility_type: string | null;
  is_active: boolean;
  agreement_on_file: boolean;
  agreement_expiry: Date | null;
  risk_rating: 'low' | 'medium' | 'high' | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

/** Supervisor row */
export interface Supervisor {
  id: string;
  user_id: string | null;
  tenant_id: string;
  host_facility_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  position: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/** Placement status values */
export type PlacementStatus =
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'at_risk';

/** Placement row */
export interface Placement {
  id: string;
  reference: string;
  tenant_id: string;
  student_id: string;
  host_facility_id: string;
  supervisor_id: string | null;
  trainer_id: string | null;
  status: PlacementStatus;
  start_date: Date;
  end_date: Date;
  required_hours: number;
  completed_hours: number;
  unit_of_competency: string | null;
  objectives: string | null;
  risk_level: 'low' | 'medium' | 'high';
  risk_notes: string | null;
  orientation_completed: boolean;
  orientation_date: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

/** Placement hours log row */
export interface PlacementHours {
  id: string;
  placement_id: string;
  student_id: string;
  date: Date;
  hours_worked: number;
  tasks_performed: string | null;
  student_signature: boolean;
  supervisor_verified: boolean;
  supervisor_id: string | null;
  supervisor_verified_at: Date | null;
  supervisor_comments: string | null;
  created_at: Date;
  updated_at: Date;
}

/** Journal entry row */
export interface JournalEntry {
  id: string;
  placement_id: string;
  student_id: string;
  entry_date: Date;
  content: string;
  mood_rating: number | null;
  skills_demonstrated: string[];
  is_flagged: boolean;
  trainer_reviewed: boolean;
  trainer_reviewed_at: Date | null;
  trainer_feedback: string | null;
  created_at: Date;
  updated_at: Date;
}

/** Evidence / observation record row */
export interface Evidence {
  id: string;
  placement_id: string;
  student_id: string;
  supervisor_id: string | null;
  observation_type: string;
  description: string;
  rating: number | null;
  unit_of_competency: string | null;
  performance_criteria: string | null;
  observed_at: Date;
  created_at: Date;
  updated_at: Date;
}

/** Document type categories */
export type DocumentCategory =
  | 'placement_agreement'
  | 'student_id'
  | 'wwc_check'
  | 'ndis_clearance'
  | 'induction_checklist'
  | 'risk_assessment'
  | 'insurance'
  | 'journal_evidence'
  | 'supervisor_report'
  | 'other';

/** Document row */
export interface Document {
  id: string;
  tenant_id: string;
  placement_id: string | null;
  student_id: string | null;
  uploaded_by: string;
  category: DocumentCategory;
  file_name: string;
  storage_key: string;
  mime_type: string;
  file_size_bytes: number;
  description: string | null;
  expiry_date: Date | null;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/** Compliance check row */
export interface ComplianceCheck {
  id: string;
  tenant_id: string;
  placement_id: string;
  check_type: string;
  status: 'compliant' | 'non_compliant' | 'pending' | 'not_applicable';
  checked_at: Date | null;
  checked_by: string | null;
  notes: string | null;
  due_date: Date | null;
  created_at: Date;
  updated_at: Date;
}

/** Notification row */
export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  read_at: Date | null;
  action_url: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
}

/** Activity log row */
export interface ActivityLog {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

// ============================================================
// Service / DTO types
// ============================================================

/** Login request payload */
export interface LoginRequest {
  email: string;
  password: string;
  tenantSlug?: string;
}

/** Token pair returned after successful auth */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** Auth service login result */
export interface LoginResult {
  tokens: TokenPair;
  user: SafeUser;
}

/** Admin dashboard statistics */
export interface AdminDashboardStats {
  totalStudents: number;
  activePlacements: number;
  completedPlacements: number;
  atRiskPlacements: number;
  auditReadinessPercentage: number;
  missingDocuments: number;
  missingAgreements: number;
  missingSupervisorVerifications: number;
  pendingHourVerifications: number;
  recentActivity: ActivityLog[];
  placementsByStatus: Record<string, number>;
  riskByLevel: Record<string, number>;
}

/** File upload result from storage layer */
export interface StorageUploadResult {
  key: string;
  url: string;
  bucket: string;
  size: number;
  mimeType: string;
}
