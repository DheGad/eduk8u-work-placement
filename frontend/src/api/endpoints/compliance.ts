import apiClient from '@/api/client';
import type { ApiResponse, ComplianceSnapshot, AuditReadiness } from '@/types';

export interface ComplianceDashboard {
  overall_score: number;
  total_placements: number;
  compliant_placements: number;
  non_compliant_placements: number;
  audit_readiness: AuditReadiness;
  snapshots: ComplianceSnapshot[];
  missing_summary: {
    missing_documents: number;
    missing_agreements: number;
    unverified_hours: number;
    unbriefed_supervisors: number;
    unsigned_tripartites: number;
  };
}

export interface MissingComplianceItem {
  placement_id: string;
  placement_number: string;
  student_name: string;
  host_name: string;
  item_type: string;
  item_description: string;
  due_date: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Fetch the tenant-level compliance dashboard.
 */
export async function getComplianceDashboard(): Promise<ComplianceDashboard> {
  const { data } = await apiClient.get<ApiResponse<ComplianceDashboard>>(
    '/compliance/dashboard',
  );
  return data.data;
}

/**
 * Fetch overall audit readiness score and breakdown.
 */
export async function getAuditReadiness(): Promise<AuditReadiness> {
  const { data } = await apiClient.get<ApiResponse<AuditReadiness>>(
    '/compliance/audit-readiness',
  );
  return data.data;
}

/**
 * Fetch a list of all missing compliance items across placements.
 */
export async function getMissingItems(): Promise<MissingComplianceItem[]> {
  const { data } = await apiClient.get<ApiResponse<MissingComplianceItem[]>>(
    '/compliance/missing-items',
  );
  return data.data;
}

/**
 * Fetch the compliance snapshot for a specific placement.
 */
export async function getPlacementComplianceSnapshot(
  placementId: string,
): Promise<ComplianceSnapshot> {
  const { data } = await apiClient.get<ApiResponse<ComplianceSnapshot>>(
    `/compliance/placements/${placementId}`,
  );
  return data.data;
}

/**
 * Trigger a fresh compliance score calculation for a placement.
 */
export async function recalculateComplianceScore(
  placementId: string,
): Promise<ComplianceSnapshot> {
  const { data } = await apiClient.post<ApiResponse<ComplianceSnapshot>>(
    `/compliance/placements/${placementId}/recalculate`,
  );
  return data.data;
}
