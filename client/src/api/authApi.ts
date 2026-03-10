import api from './apiClient';

// role can be 'admin' or 'user'
export interface RegisterPayload {
  email: string;
  username?: string;
  password: string;
  name?: string;
  phone?: string;
  avatar?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: number;
  email: string;
  username: string;
  name: string;
  role: 'admin' | 'user';
  avatar: string | null;
  bio: string | null;
  phone: string | null;
  joinedDate: string;
  message: string;
  token: string;
}

export async function registerUser(payload: RegisterPayload): Promise<{ message: string; token: string }> {
  const response = await api.post(`auth/register/`, payload);
  return response.data;
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(`auth/login/`, payload);
  return response.data;
}

export default {
  registerUser,
  loginUser,
};
