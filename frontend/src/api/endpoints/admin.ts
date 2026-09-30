import apiClient from '@/api/client';
import type { ApiResponse, DashboardStats, RecentActivity, AuditReadiness } from '@/types';

export interface PlacementStatusChartData {
  status: string;
  count: number;
  color: string;
}

export interface RiskBreakdown {
  risk_level: string;
  count: number;
  percentage: number;
}

export interface AtRiskPlacement {
  id: string;
  placement_number: string;
  student_name: string;
  host_name: string;
  risk_level: string;
  compliance_score: number;
  missing_items_count: number;
  planned_end_date: string;
  hours_completed: number;
  hours_required: number;
}

export interface WeeklyHoursDataPoint {
  day: string;
  this_week: number;
  last_month: number;
}

export interface ComplianceDistribution {
  range: string;
  label: string;
  count: number;
  color: string;
}

export interface UpcomingMilestone {
  id: string;
  placement_number: string;
  student_name: string;
  host_name: string;
  milestone_type: 'hours_25' | 'hours_50' | 'hours_75' | 'hours_90' | 'hours_100' | 'agreement_expiry' | 'placement_end';
  milestone_label: string;
  target_date: string;
  hours_current: number;
  hours_required: number;
}

export interface QuickStats {
  hours_logged_today: number;
  journal_entries_this_week: number;
  evidence_uploaded_this_week: number;
  monitoring_visits_this_week: number;
}

export interface ActionItem {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  count: number;
  action_url: string;
}

/**
 * Fetch the high-level admin dashboard statistics.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<ApiResponse<DashboardStats>>(
    '/admin/dashboard/stats',
  );
  return data.data;
}

/**
 * Fetch placement status breakdown for charts.
 */
export async function getPlacementStatusChart(): Promise<PlacementStatusChartData[]> {
  const { data } = await apiClient.get<ApiResponse<PlacementStatusChartData[]>>(
    '/admin/dashboard/placement-status',
  );
  return data.data;
}

/**
 * Fetch risk level breakdown across active placements.
 */
export async function getRiskBreakdown(): Promise<RiskBreakdown[]> {
  const { data } = await apiClient.get<ApiResponse<RiskBreakdown[]>>(
    '/admin/dashboard/risk-breakdown',
  );
  return data.data;
}

/**
 * Fetch the at-risk placements requiring immediate action.
 */
export async function getAtRiskPlacements(): Promise<AtRiskPlacement[]> {
  const { data } = await apiClient.get<ApiResponse<AtRiskPlacement[]>>(
    '/admin/dashboard/at-risk',
  );
  return data.data;
}

/**
 * Fetch action items queue for the admin.
 */
export async function getActionItems(): Promise<ActionItem[]> {
  const { data } = await apiClient.get<ApiResponse<ActionItem[]>>(
    '/admin/dashboard/action-items',
  );
  return data.data;
}

/**
 * Fetch recent activity log entries.
 */
export async function getRecentActivity(limit = 10): Promise<RecentActivity[]> {
  const { data } = await apiClient.get<ApiResponse<RecentActivity[]>>(
    '/admin/dashboard/recent-activity',
    { params: { limit } },
  );
  return data.data;
}

/**
 * Fetch weekly hours data for the trend chart.
 */
export async function getWeeklyHoursChart(): Promise<WeeklyHoursDataPoint[]> {
  const { data } = await apiClient.get<ApiResponse<WeeklyHoursDataPoint[]>>(
    '/admin/dashboard/weekly-hours',
  );
  return data.data;
}

/**
 * Fetch compliance score distribution for the donut chart.
 */
export async function getComplianceDistribution(): Promise<ComplianceDistribution[]> {
  const { data } = await apiClient.get<ApiResponse<ComplianceDistribution[]>>(
    '/admin/dashboard/compliance-distribution',
  );
  return data.data;
}

/**
 * Fetch upcoming milestones for placements.
 */
export async function getUpcomingMilestones(): Promise<UpcomingMilestone[]> {
  const { data } = await apiClient.get<ApiResponse<UpcomingMilestone[]>>(
    '/admin/dashboard/upcoming-milestones',
  );
  return data.data;
}

/**
 * Fetch quick stats for the bottom stats row.
 */
export async function getQuickStats(): Promise<QuickStats> {
  const { data } = await apiClient.get<ApiResponse<QuickStats>>(
    '/admin/dashboard/quick-stats',
  );
  return data.data;
}

/**
 * Fetch overall audit readiness data.
 */
export async function getAuditReadiness(): Promise<{score: number, ready_count: number, total_active: number}> {
  const { data } = await apiClient.get<ApiResponse<{score: number, ready_count: number, total_active: number}>>(
    '/admin/dashboard/audit-readiness',
  );
  return data.data;
}

/**
 * Fetch compliance alerts for the Executive Command Centre.
 */
export async function getComplianceAlerts(): Promise<any[]> {
  const { data } = await apiClient.get<ApiResponse<any[]>>(
    '/admin/dashboard/compliance-alerts',
  );
  return data.data;
}
