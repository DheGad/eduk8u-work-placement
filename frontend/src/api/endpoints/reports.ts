import apiClient from '@/api/client';
import type { ApiResponse, AuditLog, AuditLogFilters, PaginatedResponse } from '@/types';

export interface StudentReport {
  student_id: string;
  student_name: string;
  student_number: string;
  course_name: string;
  placements: Array<{
    placement_number: string;
    host_name: string;
    status: string;
    hours_logged: number;
    hours_verified: number;
    hours_required: number;
    compliance_score: number;
    start_date: string;
    end_date: string;
  }>;
  total_hours_logged: number;
  total_hours_required: number;
  readiness_score: number;
  generated_at: string;
}

export interface PlacementReport {
  summary: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
    at_risk: number;
  };
  by_host: Array<{ host_name: string; count: number }>;
  by_course: Array<{ course_name: string; count: number }>;
  hours_summary: {
    total_logged: number;
    total_verified: number;
    total_required: number;
    completion_rate: number;
  };
  compliance_summary: {
    avg_score: number;
    audit_ready: number;
    needs_attention: number;
  };
  generated_at: string;
}

/**
 * Generate a detailed student placement report.
 */
export async function getStudentReport(studentId: string): Promise<StudentReport> {
  const { data } = await apiClient.get<ApiResponse<StudentReport>>(
    `/reports/students/${studentId}`,
  );
  return data.data;
}

/**
 * Generate the tenant-level placement summary report.
 */
export async function getPlacementReport(filters?: {
  start_date?: string;
  end_date?: string;
  host_id?: string;
  trainer_id?: string;
}): Promise<PlacementReport> {
  const { data } = await apiClient.get<ApiResponse<PlacementReport>>(
    '/reports/placements',
    { params: filters },
  );
  return data.data;
}

/**
 * Export a report in the specified format (csv, pdf, xlsx).
 * Returns a Blob to be downloaded.
 */
export async function exportReport(
  reportType: 'students' | 'placements' | 'compliance' | 'audit',
  format: 'csv' | 'pdf' | 'xlsx',
  filters?: Record<string, unknown>,
): Promise<Blob> {
  const response = await apiClient.get(`/reports/export/${reportType}`, {
    params: { format, ...filters },
    responseType: 'blob',
  });
  return response.data as Blob;
}

/**
 * Fetch paginated audit log entries.
 */
export async function getAuditLogs(
  filters: AuditLogFilters = {},
): Promise<PaginatedResponse<AuditLog>> {
  const { data } = await apiClient.get<PaginatedResponse<AuditLog>>(
    '/audit-logs',
    { params: filters },
  );
  return data;
}
