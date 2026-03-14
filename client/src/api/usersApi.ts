import api, { cachedGet, invalidateCacheFor } from './apiClient';
import { User } from '@/types';

export interface UserFromApi {
  id: number;
  email: string;
  username: string;
  name: string;
  role: 'admin' | 'user';
  isActive?: boolean;
  latestRegistrationDate?: string | null;
  avatar: string | null;
  bio: string | null;
  phone: string | null;
  joinedDate: string;
}

export async function fetchUsers(): Promise<User[]> {
  return cachedGet<UserFromApi[]>('users/', undefined, 30);
}

export async function fetchUser(id: number): Promise<User> {
  return cachedGet<UserFromApi>(`users/${id}/`, undefined, 30);
}

export async function updateUser(id: number, data: Partial<User>): Promise<User> {
  invalidateCacheFor('users/');
  invalidateCacheFor(`users/${id}/`);
  const response = await api.patch<UserFromApi>(`users/${id}/`, data);
  return response.data;
}

export default {
  fetchUsers,
  fetchUser,
  updateUser,
};
