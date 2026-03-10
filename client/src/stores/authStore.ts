import { create } from 'zustand';
import { User, UserRole } from '@/types';
import { loginUser, registerUser, LoginResponse } from '@/api/authApi';
import { setAuthToken } from '@/api/apiClient';

interface AuthState {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'email' | 'bio' | 'phone'>>) => void;
  setUser: (user: User, token: string) => void;
}

const mapLoginResponseToUser = (res: LoginResponse): User => ({
  id: res.id,
  email: res.email,
  username: res.username,
  name: res.name,
  role: res.role,
  avatar: res.avatar,
  bio: res.bio,
  phone: res.phone,
  joinedDate: res.joinedDate,
});

export const useAuthStore = create<AuthState>()((set) => ({
  currentUser: null,
  token: null,
  isAuthenticated: false,

  login: async (email, password) => {
    try {
      const res = await loginUser({ email, password });
      const user = mapLoginResponseToUser(res);
      setAuthToken(res.token);
      set({ currentUser: user, token: res.token, isAuthenticated: true });
      return { success: true, role: user.role };
    } catch (err: any) {
      const message = err.response?.data?.error || err.response?.data?.detail || 'Invalid email or password.';
      return { success: false, error: message };
    }
  },

  logout: () => {
    setAuthToken(null);
    set({ currentUser: null, token: null, isAuthenticated: false });
  },

  register: async (name, email, password) => {
    try {
      const res = await registerUser({ email, password, name });
      // Registration returns token but not full user; need to login to get user data
      // For now just indicate success — user will be redirected to login
      return { success: true };
    } catch (err: any) {
      const message =
        err.response?.data?.email?.[0] ||
        err.response?.data?.password?.[0] ||
        err.response?.data?.detail ||
        'Registration failed.';
      return { success: false, error: message };
    }
  },

  updateProfile: (updates) => {
    set((state) => {
      if (!state.currentUser) return state;
      const updatedUser = { ...state.currentUser, ...updates };
      return { currentUser: updatedUser };
    });
  },

  setUser: (user, token) => {
    setAuthToken(token);
    set({ currentUser: user, token, isAuthenticated: true });
  },
}));
