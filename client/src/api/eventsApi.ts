import api, { cachedGet, invalidateCacheFor } from './apiClient';
import { Event, EventCategory as FrontendCategory } from '@/types';

export type ApiEventCategory = 'sports' | 'arts' | 'academics' | 'cultural' | 'tech' | 'social';

export interface EventFromApi {
  id: number;
  title: string;
  description: string;
  category: ApiEventCategory;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  location: string;
  capacity: number;
  registered_count: number;
  created_by: number;
  created_at: string;
  is_active: boolean;
}

export interface CreateEventPayload {
  title: string;
  description: string;
  category: ApiEventCategory;
  date: string;
  time: string;
  location: string;
  capacity: number;
  is_active?: boolean;
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {}

// Map API category (lowercase) to frontend category (Title Case)
const categoryApiToFrontend: Record<ApiEventCategory, FrontendCategory> = {
  sports: 'Sports',
  arts: 'Arts',
  academics: 'Academic',
  cultural: 'Cultural',
  tech: 'Tech',
  social: 'Social',
};

// Map frontend category to API category
const categoryFrontendToApi: Record<FrontendCategory, ApiEventCategory> = {
  Sports: 'sports',
  Arts: 'arts',
  Academic: 'academics',
  Cultural: 'cultural',
  Tech: 'tech',
  Social: 'social',
};

// Convert API response to frontend Event type
export function mapEventFromApi(e: EventFromApi): Event {
  return {
    id: String(e.id),
    title: e.title,
    description: e.description,
    category: categoryApiToFrontend[e.category] || 'Academic',
    date: e.date,
    time: e.time.slice(0, 5), // HH:MM:SS -> HH:MM
    location: e.location,
    capacity: e.capacity,
    registeredCount: e.registered_count,
    createdBy: e.created_by,
    createdAt: e.created_at,
    isActive: e.is_active,
  };
}

// Convert frontend form data to API payload
export function mapEventToApi(data: { title: string; description: string; category: FrontendCategory; date: string; time: string; location: string; capacity: number; isActive?: boolean }): CreateEventPayload {
  return {
    title: data.title,
    description: data.description,
    category: categoryFrontendToApi[data.category],
    date: data.date,
    time: data.time,
    location: data.location,
    capacity: data.capacity,
    is_active: data.isActive,
  };
}

export async function fetchEvents(): Promise<EventFromApi[]> {
  return cachedGet<EventFromApi[]>('events/', undefined, 30);
}

export async function fetchEvent(id: number): Promise<EventFromApi> {
  return cachedGet<EventFromApi>(`events/${id}/`, undefined, 30);
}

export async function createEvent(data: CreateEventPayload): Promise<EventFromApi> {
  invalidateCacheFor('events/');
  const response = await api.post<EventFromApi>('events/', data);
  return response.data;
}

export async function updateEvent(id: number, data: UpdateEventPayload): Promise<EventFromApi> {
  invalidateCacheFor('events/');
  invalidateCacheFor(`events/${id}/`);
  const response = await api.patch<EventFromApi>(`events/${id}/`, data);
  return response.data;
}

export async function deleteEvent(id: number): Promise<void> {
  invalidateCacheFor('events/');
  invalidateCacheFor(`events/${id}/`);
  await api.delete(`events/${id}/`);
}

export default {
  fetchEvents,
  fetchEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  mapEventFromApi,
  mapEventToApi,
};
