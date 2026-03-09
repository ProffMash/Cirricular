import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Event, EventFormData } from '@/types';
import { mockEvents } from '@/data/mockData';

interface EventState {
  events: Event[];
  searchQuery: string;
  selectedCategory: string;
  createEvent: (data: EventFormData) => void;
  updateEvent: (id: string, data: EventFormData) => void;
  deleteEvent: (id: string) => void;
  incrementRegistered: (eventId: string) => void;
  decrementRegistered: (eventId: string) => void;
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (c: string) => void;
  getFilteredEvents: () => Event[];
  getEventById: (id: string) => Event | undefined;
}

export const useEventStore = create<EventState>()(
  persist(
    (set, get) => ({
      events: mockEvents,
      searchQuery: '',
      selectedCategory: 'All',

      createEvent: (data) => {
        const newEvent: Event = {
          id: `evt-${Date.now()}`,
          ...data,
          registeredCount: 0,
          createdBy: 'admin-001',
          createdAt: new Date().toISOString().split('T')[0],
          isActive: true,
        };
        set((state) => ({ events: [newEvent, ...state.events] }));
      },

      updateEvent: (id, data) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, ...data } : e
          ),
        }));
      },

      deleteEvent: (id) => {
        set((state) => ({ events: state.events.filter((e) => e.id !== id) }));
      },

      incrementRegistered: (eventId) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId ? { ...e, registeredCount: e.registeredCount + 1 } : e
          ),
        }));
      },

      decrementRegistered: (eventId) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId
              ? { ...e, registeredCount: Math.max(0, e.registeredCount - 1) }
              : e
          ),
        }));
      },

      setSearchQuery: (q) => set({ searchQuery: q }),
      setSelectedCategory: (c) => set({ selectedCategory: c }),

      getFilteredEvents: () => {
        const { events, searchQuery, selectedCategory } = get();
        return events.filter((e) => {
          const matchesSearch =
            !searchQuery ||
            e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.location.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesCategory =
            selectedCategory === 'All' || e.category === selectedCategory;
          return matchesSearch && matchesCategory && e.isActive;
        });
      },

      getEventById: (id) => get().events.find((e) => e.id === id),
    }),
    { name: 'event-storage', partialize: (state) => ({ events: state.events }) }
  )
);
