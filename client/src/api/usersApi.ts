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

interface AvatarUploadSignatureResponse {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
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

export async function getAvatarUploadSignature(): Promise<AvatarUploadSignatureResponse> {
  const response = await api.get<AvatarUploadSignatureResponse>('uploads/avatar-signature/');
  return response.data;
}

export async function uploadAvatarToCloudinary(file: File): Promise<string> {
  const signatureData = await getAvatarUploadSignature();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signatureData.apiKey);
  formData.append('timestamp', String(signatureData.timestamp));
  formData.append('folder', signatureData.folder);
  formData.append('signature', signatureData.signature);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`;
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error('Cloudinary upload failed');
  }

  const uploadData = await uploadResponse.json();
  if (!uploadData.secure_url) {
    throw new Error('Cloudinary did not return secure_url');
  }

  return uploadData.secure_url as string;
}

export default {
  fetchUsers,
  fetchUser,
  updateUser,
  getAvatarUploadSignature,
  uploadAvatarToCloudinary,
};
