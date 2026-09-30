/**
 * TypeScript types for EDUK8U Work Placement Intelligence Platform.
 * All types match the backend API contract exactly.
 */

/* =========================================
   ENUMS & LITERALS
   ========================================= */

export type UserRole =
  | 'super_admin'
  | 'college_admin'
  | 'trainer'
  | 'student'
  | 'supervisor'
  | 'host_contact'
  | 'host_manager';

export type PlacementStatus =
  | 'pending'
  | 'approved'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'at_risk'
  | 'suspended';

export type RiskLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export type ComplianceStatus = 'compliant' | 'non_compliant' | 'pending' | 'expired';

export type DocumentType =
  | 'placement_agreement'
  | 'insurance_certificate'
  | 'supervisor_qualification'
  | 'ohsw_induction'
  | 'student_id'
  | 'wwcc'
  | 'police_check'
  | 'first_aid_certificate'
  | 'other';

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired';

export type EvidenceType = 'image' | 'document' | 'video' | 'link' | 'other';

export type JournalVisibility = 'student_only' | 'trainer_visible' | 'all';

export type NotificationType =
  | 'placement_created'
  | 'hours_logged'
  | 'hours_verified'
  | 'document_uploaded'
  | 'signature_required'
  | 'compliance_alert'
  | 'risk_flag'
  | 'deadline_reminder'
  | 'supervisor_briefed'
  | 'system';

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'SIGN'
  | 'VERIFY'
  | 'APPROVE'
  | 'REJECT';

/* =========================================
   CORE ENTITIES
   ========================================= */

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  abn: string | null;
  rto_code: string | null;
  asqa_registered: boolean;
  address: string | null;
  city: string | null;
  state: string | null;
  postcode: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  primary_color: string | null;
  max_students: number;
  max_placements: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  email_verified: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  tenant?: Tenant;
}

export interface Student {
  id: string;
  tenant_id: string;
  user_id: string;
  student_number: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  course_name: string;
  course_code: string | null;
  enrolment_date: string | null;
  expected_completion: string | null;
  total_placement_hours_required: number;
  total_hours_completed: number;
  placement_readiness_score: number;
  is_placement_ready: boolean;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  ndis_clearance: boolean;
  wwcc_number: string | null;
  wwcc_expiry: string | null;
  police_check_date: string | null;
  first_aid_expiry: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
  readiness?: PlacementReadiness;
  active_placement?: Placement | null;
}

export interface PlacementReadiness {
  id: string;
  student_id: string;
  has_completed_orientation: boolean;
  has_submitted_resume: boolean;
  has_wwcc: boolean;
  has_police_check: boolean;
  has_first_aid: boolean;
  has_ohsw_training: boolean;
  has_mandatory_reporting: boolean;
  has_signed_code_of_conduct: boolean;
  has_insurance_confirmation: boolean;
  has_ndis_clearance: boolean;
  trainer_approved: boolean;
  trainer_approved_at: string | null;
  trainer_approved_by: string | null;
  notes: string | null;
  readiness_percentage: number;
  updated_at: string;
}

export interface HostFacility {
  id: string;
  tenant_id: string;
  facility_name: string;
  contact?: string;
  trading_name: string | null;
  abn: string | null;
  facility_type: string | null;
  accreditation_body: string | null;
  accreditation_number: string | null;
  accreditation_expiry: string | null;
  address: string;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  primary_contact_name: string | null;
  primary_contact_role: string | null;
  primary_contact_phone: string | null;
  primary_contact_email: string | null;
  max_students_capacity: number;
  is_active: boolean;
  is_approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  checklist?: HostChecklist;
  insurance?: HostInsurance[];
  active_placements_count?: number;
}

export interface HostChecklist {
  id: string;
  host_id: string;
  adequate_supervision: boolean;
  appropriate_facilities: boolean;
  insurance_verified: boolean;
  ohsw_policy_provided: boolean;
  orientation_provided: boolean;
  emergency_procedures_shared: boolean;
  grievance_procedure_shared: boolean;
  agreement_signed: boolean;
  signed_by: string | null;
  signed_at: string | null;
  notes: string | null;
  checklist_score: number;
  updated_at: string;
}

export interface HostInsurance {
  id: string;
  host_id: string;
  insurance_type: string;
  provider: string | null;
  policy_number: string | null;
  coverage_amount: number | null;
  valid_from: string | null;
  valid_to: string | null;
  document_url: string | null;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
}

export interface HostAgreement {
  id: string;
  host_id: string;
  placement_id: string | null;
  agreement_type: string;
  document_url: string | null;
  signed_by_host: boolean;
  host_signature_date: string | null;
  signed_by_rto: boolean;
  rto_signature_date: string | null;
  valid_from: string | null;
  valid_to: string | null;
  created_at: string;
}

export interface Supervisor {
  id: string;
  tenant_id: string;
  host_id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  job_title: string | null;
  position?: string;
  department: string | null;
  is_active: boolean;
  is_briefed: boolean;
  briefed_at: string | null;
  briefed_by: string | null;
  created_at: string;
  updated_at: string;
  host?: HostFacility;
  qualifications?: SupervisorQualification[];
  briefing?: SupervisorBriefing;
}

export interface SupervisorQualification {
  id: string;
  supervisor_id: string;
  qualification_name: string;
  issuing_body: string | null;
  qualification_number: string | null;
  issued_date: string | null;
  expiry_date: string | null;
  document_url: string | null;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
}

export interface SupervisorBriefing {
  id: string;
  supervisor_id: string;
  briefed_by: string;
  briefed_at: string;
  briefing_method: string;
  topics_covered: string[];
  notes: string | null;
  signed_by_supervisor: boolean;
  supervisor_signature_date: string | null;
  created_at: string;
}

export interface Placement {
  id: string;
  tenant_id: string;
  student_id: string;
  host_id: string;
  supervisor_id: string | null;
  trainer_id: string | null;
  placement_number: string;
  placement_ref?: string;
  status: PlacementStatus;
  risk_level: RiskLevel;
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date: string | null;
  actual_end_date: string | null;
  start_date?: string;
  end_date?: string;
  total_hours_required: number;
  hours_required?: number;
  total_hours_logged: number;
  hours_completed?: number;
  total_hours_verified: number;
  compliance_score?: number;
  current_phase?: string;
  phase_label?: string;
  host_approved?: boolean;
  supervisor_verified?: boolean;
  objectives: string | null;
  special_requirements: string | null;
  notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  student?: Student;
  host?: HostFacility;
  supervisor?: Supervisor;
  trainer?: User;
  hours?: PlacementHours[];
  competencies?: PlacementCompetency[];
  compliance?: ComplianceSnapshot;
  risk_flags?: RiskFlag[];
}

export interface PlacementHours {
  id: string;
  placement_id: string;
  student_id: string;
  log_date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  hours_worked: number;
  activity_description: string;
  location: string | null;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  supervisor_signature: string | null;
  hours_claimed?: number;
  status?: string;
  activities?: string;
  created_at: string;
  updated_at: string;
  supervisor?: Supervisor;
  verifier?: User;
}

export interface PlacementJournal {
  id: string;
  placement_id: string;
  student_id: string;
  entry_date: string;
  content: string;
  reflections: string | null;
  visibility: JournalVisibility;
  trainer_comment: string | null;
  trainer_commented_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlacementEvidence {
  id: string;
  placement_id: string;
  student_id: string;
  title: string;
  description: string | null;
  evidence_type: EvidenceType;
  file_url: string | null;
  external_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  competency_ids: string[];
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  document_name?: string;
  document_type?: string;
  form_code?: string;
  status?: string;
  created_at: string;
}

export interface PlacementCompetency {
  id: string;
  placement_id: string;
  competency_code: string;
  competency_name: string;
  competency_description: string | null;
  unit_code: string | null;
  is_achieved: boolean;
  achieved_at: string | null;
  signed_off_by: string | null;
  signoff_method: string | null;
  supervisor_signature: string | null;
  trainer_signature: string | null;
  evidence_ids: string[];
  notes: string | null;
  created_at: string;
}

export interface TripartiteAgreement {
  id: string;
  placement_id: string;
  student_id: string;
  host_id: string;
  supervisor_id: string | null;
  trainer_id: string | null;
  agreement_content: string | null;
  document_url: string | null;
  student_signed: boolean;
  student_signature: string | null;
  student_signed_at: string | null;
  host_signed: boolean;
  host_signature: string | null;
  host_signed_at: string | null;
  trainer_signed: boolean;
  trainer_signature: string | null;
  trainer_signed_at: string | null;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  tenant_id: string;
  entity_type: string;
  entity_id: string;
  document_type: DocumentType;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  expiry_date: string | null;
  is_expired: boolean;
  tags: string[];
  created_at: string;
  uploader?: User;
}

export interface ComplianceSnapshot {
  id: string;
  placement_id: string;
  snapshot_date: string;
  overall_score: number;
  risk_level: RiskLevel;
  hours_logged_score: number;
  documentation_score: number;
  supervisor_engagement_score: number;
  student_engagement_score: number;
  host_compliance_score: number;
  missing_items: string[];
  flags: string[];
  notes: string | null;
  created_at: string;
}

export interface RiskFlag {
  id: string;
  placement_id: string;
  flag_type: string;
  severity: RiskLevel;
  title: string;
  description: string;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  user?: User;
}

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  action_url: string | null;
  action_label: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

/* =========================================
   DASHBOARD / ANALYTICS
   ========================================= */

export interface DashboardStats {
  total_students: number;
  active_placements: number;
  completed_placements: number;
  at_risk_placements: number;
  pending_placements: number;
  total_hosts: number;
  approved_hosts: number;
  total_supervisors: number;
  briefed_supervisors: number;
  total_hours_logged: number;
  total_hours_verified: number;
  avg_compliance_score: number;
  audit_readiness_score: number;
  missing_documents_count: number;
  missing_agreements_count: number;
  unverified_hours_count: number;
  students_with_no_placement: number;
  placements_ending_this_week: number;
  placements_ending_this_month: number;
  avg_compliance?: number;
  near_completion?: number;
  missing_documents?: number;
}

export interface AuditReadiness {
  overall_score: number;
  risk_level: RiskLevel;
  category_scores: {
    student_documentation: number;
    host_compliance: number;
    supervisor_qualifications: number;
    hours_verification: number;
    agreements_signed: number;
    competency_signoff: number;
  };
  critical_issues: string[];
  warnings: string[];
  recommendations: string[];
  last_assessed_at: string;
}

export interface PlacementStatusBreakdown {
  status: PlacementStatus;
  count: number;
  percentage: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  actor: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
}

export interface ActionItem {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  action_url: string;
  due_date: string | null;
  count: number;
}

/* =========================================
   API RESPONSE TYPES
   ========================================= */

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

/* =========================================
   FORM / INPUT TYPES
   ========================================= */

export interface LoginFormValues {
  email: string;
  password: string;
  remember_me: boolean;
}

export interface ForgotPasswordFormValues {
  email: string;
}

export interface ResetPasswordFormValues {
  token: string;
  password: string;
  password_confirmation: string;
}

export interface CreateStudentFormValues {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  student_number: string;
  course_name: string;
  course_code?: string;
  enrolment_date?: string;
  expected_completion?: string;
  total_placement_hours_required: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
}

export interface CreateHostFormValues {
  facility_name: string;
  trading_name?: string;
  abn?: string;
  facility_type?: string;
  accreditation_body?: string;
  accreditation_number?: string;
  accreditation_expiry?: string;
  address: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  phone?: string;
  email?: string;
  website?: string;
  primary_contact_name?: string;
  primary_contact_role?: string;
  primary_contact_phone?: string;
  primary_contact_email?: string;
  max_students_capacity: number;
}

export interface CreateSupervisorFormValues {
  host_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  job_title?: string;
  department?: string;
}

export interface CreatePlacementFormValues {
  student_id: string;
  host_id: string;
  supervisor_id?: string;
  trainer_id?: string;
  planned_start_date: string;
  planned_end_date: string;
  total_hours_required: number;
  objectives?: string;
  special_requirements?: string;
  notes?: string;
}

export interface LogHoursFormValues {
  log_date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  activity_description: string;
  location?: string;
}

export interface AddJournalFormValues {
  entry_date: string;
  content: string;
  reflections?: string;
  visibility: JournalVisibility;
}

/* =========================================
   QUERY / FILTER TYPES
   ========================================= */

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface StudentFilters extends PaginationParams {
  search?: string;
  course_name?: string;
  is_placement_ready?: boolean;
  has_active_placement?: boolean;
}

export interface HostFilters extends PaginationParams {
  search?: string;
  state?: string;
  facility_type?: string;
  is_approved?: boolean;
  is_active?: boolean;
}

export interface PlacementFilters extends PaginationParams {
  search?: string;
  status?: PlacementStatus;
  phase?: string;
  risk?: string;
  risk_level?: RiskLevel;
  host_id?: string;
  student_id?: string;
  trainer_id?: string;
  start_date_from?: string;
  start_date_to?: string;
}

export interface SupervisorFilters extends PaginationParams {
  search?: string;
  host_id?: string;
  is_briefed?: boolean;
  is_active?: boolean;
}

export interface AuditLogFilters extends PaginationParams {
  user_id?: string;
  entity_type?: string;
  action?: AuditAction;
  date_from?: string;
  date_to?: string;
}

export interface NotificationFilters extends PaginationParams {
  is_read?: boolean;
  notification_type?: NotificationType;
}
