import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { fetchEvents, mapEventFromApi } from '@/api/eventsApi';
import { fetchRegistrations, createRegistration, cancelRegistration as apiCancelRegistration } from '@/api/registrationApi';
import EventCard from '@/components/shared/EventCard';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { CalendarDays, Search, X, Loader2 } from 'lucide-react';
import { EventCategory, Event, Registration } from '@/types';

const CATEGORIES: (EventCategory | 'All')[] = ['All', 'Sports', 'Arts', 'Academic', 'Tech', 'Cultural', 'Social'];

const BrowseEventsPage = () => {
  const { currentUser } = useAuthStore();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'All'>('All');
  const [confirmEventId, setConfirmEventId] = useState<string | null>(null);
  const [cancelRegId, setCancelRegId] = useState<string | null>(null);
  const [cancelEventId, setCancelEventId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [eventsData, regsData] = await Promise.all([fetchEvents(), fetchRegistrations()]);
      setEvents(eventsData.map(mapEventFromApi));
      setRegistrations(regsData);
    } catch {
      setEvents([]);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const userId = currentUser?.id ? String(currentUser.id) : '';

  const isUserRegistered = (eventId: string) => {
    return registrations.some((r) => r.userId === userId && r.eventId === eventId && r.status === 'confirmed');
  };

  const getUserRegistrationForEvent = (eventId: string) => {
    return registrations.find((r) => r.userId === userId && r.eventId === eventId && r.status === 'confirmed');
  };

  const getRegisteredCount = (eventId: string) => {
    return registrations.filter((r) => r.eventId === eventId && r.status === 'confirmed').length;
  };

  const filteredEvents = useMemo(() => {
    const today = new Date();
    return events.filter((e) => {
      if (!e.isActive || new Date(e.date) < today) return false;
      if (selectedCategory !== 'All' && e.category !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [events, searchQuery, selectedCategory]);

  const handleRegister = (eventId: string) => setConfirmEventId(eventId);
  const handleCancel = (eventId: string) => {
    const reg = getUserRegistrationForEvent(eventId);
    if (reg) { setCancelRegId(reg.id); setCancelEventId(eventId); }
  };

  const confirmRegister = async () => {
    if (!confirmEventId || !currentUser) return;
    try {
      const newReg = await createRegistration({ event: Number(confirmEventId) });
      setRegistrations((prev) => [...prev, newReg]);
    } catch (err) {
      console.error('Failed to register', err);
    } finally {
      setConfirmEventId(null);
    }
  };

  const confirmCancel = async () => {
    if (!cancelRegId || !cancelEventId) return;
    try {
      await apiCancelRegistration(Number(cancelRegId));
      setRegistrations((prev) => prev.map((r) => r.id === cancelRegId ? { ...r, status: 'cancelled' } : r));
    } catch (err) {
      console.error('Failed to cancel registration', err);
    } finally {
      setCancelRegId(null);
      setCancelEventId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Browse Events</h1>
        <p className="text-muted-foreground text-sm mt-1">Discover and register for upcoming co-curricular activities</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by name, description or location..."
            className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              selectedCategory === cat
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground mb-4">{filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found</p>

      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events found"
          description="Try adjusting your search or category filter."
          action={
            <button onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }} className="text-sm text-primary hover:underline">
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredEvents.map((event) => {
            const registered = isUserRegistered(event.id);
            const registeredCount = getRegisteredCount(event.id);
            const full = registeredCount >= event.capacity && !registered;
            return (
              <EventCard
                key={event.id}
                event={{ ...event, registeredCount }}
                isRegistered={registered}
                isFull={full}
                onRegister={() => handleRegister(event.id)}
                onCancel={() => handleCancel(event.id)}
                linkTo={`/dashboard/events/${event.id}`}
              />
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmEventId}
        onOpenChange={(open) => !open && setConfirmEventId(null)}
        title="Confirm Registration"
        description={`Register for "${events.find((e) => e.id === confirmEventId)?.title}"?`}
        confirmLabel="Register"
        onConfirm={confirmRegister}
      />
      <ConfirmDialog
        open={!!cancelRegId}
        onOpenChange={(open) => !open && (setCancelRegId(null), setCancelEventId(null))}
        title="Cancel Registration"
        description="Are you sure you want to cancel this registration?"
        confirmLabel="Yes, Cancel"
        onConfirm={confirmCancel}
        variant="destructive"
      />
    </div>
  );
};

export default BrowseEventsPage;
