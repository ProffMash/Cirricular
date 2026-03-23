import api, { cachedGet, invalidateCacheFor } from './apiClient';
import { Registration } from '@/types';

export type RegistrationStatus = 'confirmed' | 'cancelled';

export interface RegistrationFromApi {
  id: number;
  user: number;
  event: number;
  registered_at: string;
  status: RegistrationStatus;
}

export interface CreateRegistrationPayload {
  event: number;
  user?: number; // Optional - backend will use authenticated user if not provided
}

export interface UpdateRegistrationPayload {
  status?: RegistrationStatus;
}

// Convert API response to frontend Registration type
export function mapRegistrationFromApi(r: RegistrationFromApi): Registration {
  return {
    id: String(r.id),
    userId: String(r.user),
    eventId: String(r.event),
    registeredAt: r.registered_at,
    status: r.status,
  };
}

export async function fetchRegistrations(): Promise<Registration[]> {
  const data = await cachedGet<RegistrationFromApi[]>('registrations/', undefined, 30);
  return data.map(mapRegistrationFromApi);
}

export async function fetchRegistration(id: number): Promise<Registration> {
  const data = await cachedGet<RegistrationFromApi>(`registrations/${id}/`, undefined, 30);
  return mapRegistrationFromApi(data);
}

export async function createRegistration(payload: CreateRegistrationPayload): Promise<Registration> {
  invalidateCacheFor('registrations/');
  const response = await api.post<RegistrationFromApi>('registrations/', payload);
  return mapRegistrationFromApi(response.data);
}

export async function updateRegistration(id: number, payload: UpdateRegistrationPayload): Promise<Registration> {
  invalidateCacheFor('registrations/');
  invalidateCacheFor(`registrations/${id}/`);
  const response = await api.patch<RegistrationFromApi>(`registrations/${id}/`, payload);
  return mapRegistrationFromApi(response.data);
}

export async function deleteRegistration(id: number): Promise<void> {
  invalidateCacheFor('registrations/');
  invalidateCacheFor(`registrations/${id}/`);
  await api.delete(`registrations/${id}/`);
}

// Cancel a registration (updates status to 'cancelled')
export async function cancelRegistration(id: number): Promise<Registration> {
  return updateRegistration(id, { status: 'cancelled' });
}

// Admin-only deregistration endpoint
export async function adminDeregisterRegistration(id: number): Promise<Registration> {
  invalidateCacheFor('registrations/');
  invalidateCacheFor(`registrations/${id}/`);
  const response = await api.post<RegistrationFromApi>(`registrations/${id}/deregister/`);
  return mapRegistrationFromApi(response.data);
}

export default {
  fetchRegistrations,
  fetchRegistration,
  createRegistration,
  updateRegistration,
  deleteRegistration,
  cancelRegistration,
  adminDeregisterRegistration,
  mapRegistrationFromApi,
};
