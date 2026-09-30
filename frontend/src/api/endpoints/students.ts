import apiClient from '@/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  Student,
  PlacementReadiness,
  StudentFilters,
} from '@/types';

/**
 * Fetch a paginated list of students.
 */
export async function listStudents(
  filters: StudentFilters = {},
): Promise<PaginatedResponse<Student>> {
  const { data } = await apiClient.get<PaginatedResponse<Student>>('/students', {
    params: filters,
  });
  return data;
}

/**
 * Fetch a single student by ID.
 */
export async function getStudent(id: string): Promise<Student> {
  const { data } = await apiClient.get<ApiResponse<Student>>(`/students/${id}`);
  return data.data;
}

/**
 * Create a new student.
 */
export async function createStudent(
  payload: Record<string, unknown>,
): Promise<Student> {
  const { data } = await apiClient.post<ApiResponse<Student>>('/students', payload);
  return data.data;
}

/**
 * Update a student's details.
 */
export async function updateStudent(
  id: string,
  payload: Record<string, unknown>,
): Promise<Student> {
  const { data } = await apiClient.patch<ApiResponse<Student>>(
    `/students/${id}`,
    payload,
  );
  return data.data;
}

/**
 * Delete a student record.
 */
export async function deleteStudent(id: string): Promise<void> {
  await apiClient.delete(`/students/${id}`);
}

/**
 * Fetch a student's placement readiness checklist.
 */
export async function getStudentReadiness(id: string): Promise<PlacementReadiness> {
  const { data } = await apiClient.get<ApiResponse<PlacementReadiness>>(
    `/students/${id}/readiness`,
  );
  return data.data;
}

/**
 * Update a student's placement readiness checklist.
 */
export async function updateStudentReadiness(
  id: string,
  payload: Partial<PlacementReadiness>,
): Promise<PlacementReadiness> {
  const { data } = await apiClient.patch<ApiResponse<PlacementReadiness>>(
    `/students/${id}/readiness`,
    payload,
  );
  return data.data;
}
