import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useEventStore } from '@/stores/eventStore';
import { useRegistrationStore } from '@/stores/registrationStore';
import EventCard from '@/components/shared/EventCard';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { CalendarDays, Search, X } from 'lucide-react';
import { EventCategory } from '@/types';
import { Link } from 'react-router-dom';

const CATEGORIES: (EventCategory | 'All')[] = ['All', 'Sports', 'Arts', 'Academic', 'Tech', 'Cultural', 'Social'];

const BrowseEventsPage = () => {
  const { currentUser } = useAuthStore();
  const { searchQuery, selectedCategory, setSearchQuery, setSelectedCategory, getFilteredEvents } = useEventStore();
  const { isUserRegistered, registerForEvent, cancelRegistration, getUserRegistrationForEvent } = useRegistrationStore();
  const { incrementRegistered, decrementRegistered } = useEventStore();
  const [confirmEventId, setConfirmEventId] = useState<string | null>(null);
  const [cancelRegId, setCancelRegId] = useState<string | null>(null);
  const [cancelEventId, setCancelEventId] = useState<string | null>(null);

  const userId = currentUser?.id || '';
  const filteredEvents = getFilteredEvents();
  const allEvents = useEventStore.getState().events;

  const handleRegister = (eventId: string) => setConfirmEventId(eventId);
  const handleCancel = (eventId: string) => {
    const reg = getUserRegistrationForEvent(userId, eventId);
    if (reg) { setCancelRegId(reg.id); setCancelEventId(eventId); }
  };

  const confirmRegister = () => {
    if (!confirmEventId) return;
    registerForEvent(userId, confirmEventId);
    incrementRegistered(confirmEventId);
    setConfirmEventId(null);
  };

  const confirmCancel = () => {
    if (!cancelRegId || !cancelEventId) return;
    cancelRegistration(cancelRegId);
    decrementRegistered(cancelEventId);
    setCancelRegId(null);
    setCancelEventId(null);
  };

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
            const registered = isUserRegistered(userId, event.id);
            const full = event.registeredCount >= event.capacity && !registered;
            return (
              <EventCard
                key={event.id}
                event={event}
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
        description={`Register for "${allEvents.find((e) => e.id === confirmEventId)?.title}"?`}
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
