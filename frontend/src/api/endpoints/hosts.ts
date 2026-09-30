import apiClient from '@/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  HostFacility,
  HostChecklist,
  HostInsurance,
  HostAgreement,
  HostFilters,
} from '@/types';

/**
 * Fetch a paginated list of host facilities.
 */
export async function listHosts(
  filters: HostFilters = {},
): Promise<PaginatedResponse<HostFacility>> {
  const { data } = await apiClient.get<PaginatedResponse<HostFacility>>('/hosts', {
    params: filters,
  });
  return data;
}

/**
 * Fetch a single host facility by ID.
 */
export async function getHost(id: string): Promise<HostFacility> {
  const { data } = await apiClient.get<ApiResponse<HostFacility>>(`/hosts/${id}`);
  return data.data;
}

/**
 * Create a new host facility.
 */
export async function createHost(
  payload: Record<string, unknown>,
): Promise<HostFacility> {
  const { data } = await apiClient.post<ApiResponse<HostFacility>>('/hosts', payload);
  return data.data;
}

/**
 * Update a host facility.
 */
export async function updateHost(
  id: string,
  payload: Record<string, unknown>,
): Promise<HostFacility> {
  const { data } = await apiClient.patch<ApiResponse<HostFacility>>(
    `/hosts/${id}`,
    payload,
  );
  return data.data;
}

/**
 * Fetch the compliance checklist for a host facility.
 */
export async function getHostChecklist(hostId: string): Promise<HostChecklist> {
  const { data } = await apiClient.get<ApiResponse<HostChecklist>>(
    `/hosts/${hostId}/checklist`,
  );
  return data.data;
}

/**
 * Update the compliance checklist for a host facility.
 */
export async function updateHostChecklist(
  hostId: string,
  payload: Partial<HostChecklist>,
): Promise<HostChecklist> {
  const { data } = await apiClient.patch<ApiResponse<HostChecklist>>(
    `/hosts/${hostId}/checklist`,
    payload,
  );
  return data.data;
}

/**
 * Fetch all insurance records for a host.
 */
export async function getHostInsurance(hostId: string): Promise<HostInsurance[]> {
  const { data } = await apiClient.get<ApiResponse<HostInsurance[]>>(
    `/hosts/${hostId}/insurance`,
  );
  return data.data;
}

/**
 * Add an insurance record for a host.
 */
export async function createHostInsurance(
  hostId: string,
  payload: Record<string, unknown>,
): Promise<HostInsurance> {
  const { data } = await apiClient.post<ApiResponse<HostInsurance>>(
    `/hosts/${hostId}/insurance`,
    payload,
  );
  return data.data;
}

/**
 * Fetch all agreements for a host.
 */
export async function getHostAgreements(hostId: string): Promise<HostAgreement[]> {
  const { data } = await apiClient.get<ApiResponse<HostAgreement[]>>(
    `/hosts/${hostId}/agreements`,
  );
  return data.data;
}
