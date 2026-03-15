import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types';
import { loginUser, registerUser, LoginResponse } from '@/api/authApi';
import { setAuthToken } from '@/api/apiClient';

interface AuthState {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  logout: () => void;
  register: (name: string, email: string, password: string, regNo: string, school: User['school']) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'email' | 'bio' | 'phone' | 'avatar' | 'regNo' | 'school'>>) => void;
  setUser: (user: User, token: string) => void;
}

const mapLoginResponseToUser = (res: LoginResponse): User => ({
  id: res.id,
  email: res.email,
  username: res.username,
  name: res.name,
  regNo: res.regNo,
  school: res.school || 'SPAS',
  role: res.role,
  isActive: res.isActive,
  avatar: res.avatar,
  bio: res.bio,
  phone: res.phone,
  joinedDate: res.joinedDate,
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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

  register: async (name, email, password, regNo, school) => {
    try {
    await registerUser({ email, password, name, regNo, school });
      return { success: true };
    } catch (err: any) {
      const message =
        err.response?.data?.email?.[0] ||
        err.response?.data?.regNo?.[0] ||
      err.response?.data?.school?.[0] ||
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
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ currentUser: state.currentUser, token: state.token, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        // Restore the Authorization header when state is rehydrated from storage
        if (state?.token) {
          setAuthToken(state.token);
        }
      },
    }
  )
);
