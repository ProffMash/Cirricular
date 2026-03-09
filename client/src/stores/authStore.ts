import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types';
import { mockUsers } from '@/data/mockData';

interface AuthState {
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; role?: UserRole; error?: string };
  logout: () => void;
  register: (name: string, email: string, password: string) => { success: boolean; error?: string };
  updateProfile: (updates: Partial<Pick<User, 'name' | 'email' | 'bio' | 'phone'>>) => void;
  updateUserStatus: (userId: string, status: User['status']) => void;
  getAllUsers: () => User[];
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: mockUsers,
      isAuthenticated: false,

      login: (email, password) => {
        const { users } = get();
        const user = users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (!user) {
          return { success: false, error: 'Invalid email or password.' };
        }
        if (user.status === 'suspended') {
          return { success: false, error: 'Your account has been suspended. Please contact admin.' };
        }
        set({ currentUser: user, isAuthenticated: true });
        return { success: true, role: user.role };
      },

      logout: () => {
        set({ currentUser: null, isAuthenticated: false });
      },

      register: (name, email, password) => {
        const { users } = get();
        const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (exists) {
          return { success: false, error: 'An account with this email already exists.' };
        }
        const newUser: User = {
          id: `user-${Date.now()}`,
          name,
          email,
          password,
          role: 'user',
          status: 'active',
          joinedDate: new Date().toISOString().split('T')[0],
        };
        set((state) => ({ users: [...state.users, newUser], currentUser: newUser, isAuthenticated: true }));
        return { success: true };
      },

      updateProfile: (updates) => {
        set((state) => {
          if (!state.currentUser) return state;
          const updatedUser = { ...state.currentUser, ...updates };
          const updatedUsers = state.users.map((u) =>
            u.id === updatedUser.id ? updatedUser : u
          );
          return { currentUser: updatedUser, users: updatedUsers };
        });
      },

      updateUserStatus: (userId, status) => {
        set((state) => ({
          users: state.users.map((u) => (u.id === userId ? { ...u, status } : u)),
        }));
      },

      getAllUsers: () => {
        return get().users.filter((u) => u.role === 'user');
      },
    }),
    { name: 'auth-storage', partialize: (state) => ({ currentUser: state.currentUser, users: state.users, isAuthenticated: state.isAuthenticated }) }
  )
);
