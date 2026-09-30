import apiClient from '@/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  Placement,
  PlacementHours,
  PlacementJournal,
  PlacementEvidence,
  PlacementCompetency,
  TripartiteAgreement,
  PlacementFilters,
} from '@/types';

/**
 * Fetch a paginated list of placements.
 */
export async function listPlacements(
  filters: PlacementFilters = {},
): Promise<PaginatedResponse<Placement>> {
  const { data } = await apiClient.get<PaginatedResponse<Placement>>(
    '/placements',
    { params: filters },
  );
  return data;
}

/**
 * Fetch a single placement by ID.
 */
export async function getPlacement(id: string): Promise<Placement> {
  const { data } = await apiClient.get<ApiResponse<Placement>>(
    `/placements/${id}`,
  );
  return data.data;
}

/**
 * Create a new placement.
 */
export async function createPlacement(
  payload: Record<string, unknown>,
): Promise<Placement> {
  const { data } = await apiClient.post<ApiResponse<Placement>>(
    '/placements',
    payload,
  );
  return data.data;
}

/**
 * Update a placement.
 */
export async function updatePlacement(
  id: string,
  payload: Record<string, unknown>,
): Promise<Placement> {
  const { data } = await apiClient.patch<ApiResponse<Placement>>(
    `/placements/${id}`,
    payload,
  );
  return data.data;
}

// --- Hours ---

/**
 * Fetch all hours logs for a placement.
 */
export async function getPlacementHours(
  placementId: string,
): Promise<PlacementHours[]> {
  const { data } = await apiClient.get<ApiResponse<PlacementHours[]>>(
    `/placements/${placementId}/hours`,
  );
  return data.data;
}

/**
 * Log new hours for a placement.
 */
export async function logHours(
  placementId: string,
  payload: Record<string, unknown>,
): Promise<PlacementHours> {
  const { data } = await apiClient.post<ApiResponse<PlacementHours>>(
    `/placements/${placementId}/hours`,
    payload,
  );
  return data.data;
}

/**
 * Verify (or reject) a hours log entry.
 */
export async function verifyHours(
  placementId: string,
  hoursId: string,
  payload: { is_verified: boolean; rejection_reason?: string },
): Promise<PlacementHours> {
  const { data } = await apiClient.patch<ApiResponse<PlacementHours>>(
    `/placements/${placementId}/hours/${hoursId}/verify`,
    payload,
  );
  return data.data;
}

// --- Journal ---

/**
 * Fetch all journal entries for a placement.
 */
export async function getPlacementJournal(
  placementId: string,
): Promise<PlacementJournal[]> {
  const { data } = await apiClient.get<ApiResponse<PlacementJournal[]>>(
    `/placements/${placementId}/journal`,
  );
  return data.data;
}

/**
 * Add a new journal entry.
 */
export async function addJournalEntry(
  placementId: string,
  payload: Record<string, unknown>,
): Promise<PlacementJournal> {
  const { data } = await apiClient.post<ApiResponse<PlacementJournal>>(
    `/placements/${placementId}/journal`,
    payload,
  );
  return data.data;
}

// --- Evidence ---

/**
 * Fetch all evidence records for a placement.
 */
export async function getPlacementEvidence(
  placementId: string,
): Promise<PlacementEvidence[]> {
  const { data } = await apiClient.get<ApiResponse<PlacementEvidence[]>>(
    `/placements/${placementId}/evidence`,
  );
  return data.data;
}

/**
 * Upload evidence (multipart/form-data).
 */
export async function uploadEvidence(
  placementId: string,
  formData: FormData,
): Promise<PlacementEvidence> {
  const { data } = await apiClient.post<ApiResponse<PlacementEvidence>>(
    `/placements/${placementId}/evidence`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.data;
}

// --- Competencies ---

/**
 * Fetch all competencies for a placement.
 */
export async function getPlacementCompetencies(
  placementId: string,
): Promise<PlacementCompetency[]> {
  const { data } = await apiClient.get<ApiResponse<PlacementCompetency[]>>(
    `/placements/${placementId}/competencies`,
  );
  return data.data;
}

/**
 * Sign off a competency as achieved.
 */
export async function signoffCompetency(
  placementId: string,
  competencyId: string,
  payload: { signature: string; signoff_method: string; notes?: string },
): Promise<PlacementCompetency> {
  const { data } = await apiClient.patch<ApiResponse<PlacementCompetency>>(
    `/placements/${placementId}/competencies/${competencyId}/signoff`,
    payload,
  );
  return data.data;
}

// --- Tripartite Agreement ---

/**
 * Fetch the tripartite agreement for a placement.
 */
export async function getTripartiteAgreement(
  placementId: string,
): Promise<TripartiteAgreement> {
  const { data } = await apiClient.get<ApiResponse<TripartiteAgreement>>(
    `/placements/${placementId}/tripartite`,
  );
  return data.data;
}

/**
 * Submit a signature on the tripartite agreement.
 */
export async function signTripartiteAgreement(
  placementId: string,
  payload: { signature: string; role: 'student' | 'host' | 'trainer' },
): Promise<TripartiteAgreement> {
  const { data } = await apiClient.post<ApiResponse<TripartiteAgreement>>(
    `/placements/${placementId}/tripartite/sign`,
    payload,
  );
  return data.data;
}
