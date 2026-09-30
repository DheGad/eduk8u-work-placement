import apiClient from '@/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  Supervisor,
  SupervisorQualification,
  SupervisorBriefing,
  SupervisorFilters,
} from '@/types';

/**
 * Fetch a paginated list of supervisors.
 */
export async function listSupervisors(
  filters: SupervisorFilters = {},
): Promise<PaginatedResponse<Supervisor>> {
  const { data } = await apiClient.get<PaginatedResponse<Supervisor>>(
    '/supervisors',
    { params: filters },
  );
  return data;
}

/**
 * Fetch a single supervisor by ID.
 */
export async function getSupervisor(id: string): Promise<Supervisor> {
  const { data } = await apiClient.get<ApiResponse<Supervisor>>(
    `/supervisors/${id}`,
  );
  return data.data;
}

/**
 * Create a new supervisor.
 */
export async function createSupervisor(
  payload: Record<string, unknown>,
): Promise<Supervisor> {
  const { data } = await apiClient.post<ApiResponse<Supervisor>>(
    '/supervisors',
    payload,
  );
  return data.data;
}

/**
 * Update a supervisor's details.
 */
export async function updateSupervisor(
  id: string,
  payload: Record<string, unknown>,
): Promise<Supervisor> {
  const { data } = await apiClient.patch<ApiResponse<Supervisor>>(
    `/supervisors/${id}`,
    payload,
  );
  return data.data;
}

/**
 * Fetch all qualifications for a supervisor.
 */
export async function getSupervisorQualifications(
  supervisorId: string,
): Promise<SupervisorQualification[]> {
  const { data } = await apiClient.get<ApiResponse<SupervisorQualification[]>>(
    `/supervisors/${supervisorId}/qualifications`,
  );
  return data.data;
}

/**
 * Add a qualification to a supervisor.
 */
export async function addSupervisorQualification(
  supervisorId: string,
  payload: Record<string, unknown>,
): Promise<SupervisorQualification> {
  const { data } = await apiClient.post<ApiResponse<SupervisorQualification>>(
    `/supervisors/${supervisorId}/qualifications`,
    payload,
  );
  return data.data;
}

/**
 * Fetch the briefing record for a supervisor.
 */
export async function getSupervisorBriefing(
  supervisorId: string,
): Promise<SupervisorBriefing> {
  const { data } = await apiClient.get<ApiResponse<SupervisorBriefing>>(
    `/supervisors/${supervisorId}/briefing`,
  );
  return data.data;
}

/**
 * Record that a supervisor has been briefed.
 */
export async function createSupervisorBriefing(
  supervisorId: string,
  payload: Record<string, unknown>,
): Promise<SupervisorBriefing> {
  const { data } = await apiClient.post<ApiResponse<SupervisorBriefing>>(
    `/supervisors/${supervisorId}/briefing`,
    payload,
  );
  return data.data;
}
