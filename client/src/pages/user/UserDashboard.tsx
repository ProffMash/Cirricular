import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { fetchEvents, mapEventFromApi } from '@/api/eventsApi';
import { fetchRegistrations, createRegistration, cancelRegistration as apiCancelRegistration } from '@/api/registrationApi';
import StatsCard from '@/components/shared/StatsCard';
import EventCard from '@/components/shared/EventCard';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Calendar, BookMarked, TrendingUp, Star, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Event, Registration } from '@/types';

const UserDashboard = () => {
  const { currentUser } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmEvent, setConfirmEvent] = useState<string | null>(null);
  const [cancelConfirmReg, setCancelConfirmReg] = useState<string | null>(null);
  const [cancelEventId, setCancelEventId] = useState<string | null>(null);

  useEffect(() => {
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
    loadData();
  }, []);

  const userId = currentUser?.id ? String(currentUser.id) : '';
  const userRegs = registrations.filter((r) => r.userId === userId && r.status === 'confirmed');
  const today = new Date();
  const upcomingRegs = userRegs.filter((r) => {
    const ev = events.find((e) => e.id === r.eventId);
    return ev && new Date(ev.date) >= today;
  });

  const featuredEvents = events
    .filter((e) => e.isActive && new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const isUserRegistered = (eventId: string) =>
    registrations.some((r) => r.userId === userId && r.eventId === eventId && r.status === 'confirmed');

  const getUserRegistrationForEvent = (eventId: string) =>
    registrations.find((r) => r.userId === userId && r.eventId === eventId && r.status === 'confirmed');

  const getRegisteredCount = (eventId: string) =>
    registrations.filter((r) => r.eventId === eventId && r.status === 'confirmed').length;

  const handleRegister = (eventId: string) => setConfirmEvent(eventId);
  const handleCancel = (eventId: string) => {
    const reg = getUserRegistrationForEvent(eventId);
    if (reg) {
      setCancelConfirmReg(reg.id);
      setCancelEventId(eventId);
    }
  };

  const confirmRegister = async () => {
    if (!confirmEvent || !currentUser) return;
    try {
      const newReg = await createRegistration({ event: Number(confirmEvent) });
      setRegistrations((prev) => [...prev, newReg]);
    } catch (err) {
      console.error('Failed to register', err);
    } finally {
      setConfirmEvent(null);
    }
  };

  const confirmCancel = async () => {
    if (!cancelConfirmReg || !cancelEventId) return;
    try {
      await apiCancelRegistration(Number(cancelConfirmReg));
      setRegistrations((prev) => prev.map((r) => r.id === cancelConfirmReg ? { ...r, status: 'cancelled' } : r));
    } catch (err) {
      console.error('Failed to cancel registration', err);
    } finally {
      setCancelConfirmReg(null);
      setCancelEventId(null);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-primary rounded-2xl p-6 mb-8 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative">
          <p className="text-primary-foreground/80 text-sm mb-1">{greeting},</p>
          <h1 className="text-2xl font-bold">{currentUser?.name} 👋</h1>
          <p className="text-primary-foreground/70 text-sm mt-1">Here's what's happening with your activities</p>
          <Link
            to="/dashboard/events"
            className="inline-flex items-center gap-2 mt-4 bg-white text-primary text-sm font-semibold px-4 py-2 rounded-lg hover:bg-white/90 transition-colors"
          >
            <Calendar className="h-4 w-4" />
            Browse Events
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatsCard
          title="Events Registered"
          value={userRegs.length}
          icon={BookMarked}
          description="Total confirmed registrations"
        />
        <StatsCard
          title="Upcoming Events"
          value={upcomingRegs.length}
          icon={TrendingUp}
          description="Events scheduled ahead"
        />
        <StatsCard
          title="Activities Available"
          value={events.filter((e) => e.isActive && new Date(e.date) >= today).length}
          icon={Star}
          description="Open for registration"
        />
      </div>

      {/* Featured Events */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Upcoming Events</h2>
        <Link to="/dashboard/events" className="text-sm text-primary hover:underline font-medium">
          View all →
        </Link>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Don't miss these upcoming activities</p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {featuredEvents.map((event) => {
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

      <ConfirmDialog
        open={!!confirmEvent}
        onOpenChange={(open) => !open && setConfirmEvent(null)}
        title="Confirm Registration"
        description={`Are you sure you want to register for "${events.find((e) => e.id === confirmEvent)?.title}"?`}
        confirmLabel="Register"
        onConfirm={confirmRegister}
      />
      <ConfirmDialog
        open={!!cancelConfirmReg}
        onOpenChange={(open) => !open && setCancelConfirmReg(null)}
        title="Cancel Registration"
        description="Are you sure you want to cancel this registration? This action cannot be undone."
        confirmLabel="Yes, Cancel"
        onConfirm={confirmCancel}
        variant="destructive"
      />
    </div>
  );
};

export default UserDashboard;
