import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Registration, RegistrationStatus } from '@/types';
import { mockRegistrations } from '@/data/mockData';

interface RegistrationState {
  registrations: Registration[];
  registerForEvent: (userId: string, eventId: string) => { success: boolean; error?: string };
  cancelRegistration: (registrationId: string) => void;
  getUserRegistrations: (userId: string) => Registration[];
  getEventRegistrations: (eventId: string) => Registration[];
  isUserRegistered: (userId: string, eventId: string) => boolean;
  getUserRegistrationForEvent: (userId: string, eventId: string) => Registration | undefined;
  updateRegistrationStatus: (id: string, status: RegistrationStatus) => void;
  getAllActiveRegistrations: () => Registration[];
}

export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set, get) => ({
      registrations: mockRegistrations,

      registerForEvent: (userId, eventId) => {
        const { registrations, isUserRegistered } = get();
        if (isUserRegistered(userId, eventId)) {
          return { success: false, error: 'You are already registered for this event.' };
        }
        const newReg: Registration = {
          id: `reg-${Date.now()}`,
          userId,
          eventId,
          registeredAt: new Date().toISOString(),
          status: 'confirmed',
        };
        set({ registrations: [...registrations, newReg] });
        return { success: true };
      },

      cancelRegistration: (registrationId) => {
        set((state) => ({
          registrations: state.registrations.map((r) =>
            r.id === registrationId ? { ...r, status: 'cancelled' as RegistrationStatus } : r
          ),
        }));
      },

      getUserRegistrations: (userId) => {
        return get().registrations.filter((r) => r.userId === userId);
      },

      getEventRegistrations: (eventId) => {
        return get().registrations.filter((r) => r.eventId === eventId);
      },

      isUserRegistered: (userId, eventId) => {
        return get().registrations.some(
          (r) => r.userId === userId && r.eventId === eventId && r.status === 'confirmed'
        );
      },

      getUserRegistrationForEvent: (userId, eventId) => {
        return get().registrations.find(
          (r) => r.userId === userId && r.eventId === eventId
        );
      },

      updateRegistrationStatus: (id, status) => {
        set((state) => ({
          registrations: state.registrations.map((r) =>
            r.id === id ? { ...r, status } : r
          ),
        }));
      },

      getAllActiveRegistrations: () => {
        return get().registrations.filter((r) => r.status === 'confirmed');
      },
    }),
    { name: 'registration-storage', partialize: (state) => ({ registrations: state.registrations }) }
  )
);
