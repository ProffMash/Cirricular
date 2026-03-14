import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { fetchEvents, mapEventFromApi } from '@/api/eventsApi';
import { fetchRegistrations, cancelRegistration as apiCancelRegistration } from '@/api/registrationApi';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import EmptyState from '@/components/shared/EmptyState';
import { BookMarked, Calendar, MapPin, X, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Event, Registration } from '@/types';
import { formatDateDDMMYY } from '@/utils/date';

const MyRegistrationsPage = () => {
  const { currentUser } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');

  const userId = currentUser?.id ? String(currentUser.id) : '';

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

  const userRegs = registrations.filter((r) => r.userId === userId);
  const filtered = filter === 'all' ? userRegs : userRegs.filter((r) => r.status === filter);
  const sorted = [...filtered].sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await apiCancelRegistration(Number(cancelTarget));
      const reg = registrations.find((r) => r.id === cancelTarget);
      setRegistrations((prev) => prev.map((r) => r.id === cancelTarget ? { ...r, status: 'cancelled' } : r));
      if (reg) {
        setEvents((prev) => prev.map((e) => e.id === reg.eventId ? { ...e, registeredCount: Math.max(0, e.registeredCount - 1) } : e));
      }
    } catch (err) {
      console.error('Failed to cancel registration', err);
    } finally {
      setCancelTarget(null);
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
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Registrations</h1>
        <p className="text-sm text-muted-foreground mt-1">Track all your event registrations</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {(['all', 'confirmed', 'cancelled'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
              filter === f ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {f} ({f === 'all' ? userRegs.length : userRegs.filter((r) => r.status === f).length})
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title="No registrations found"
          description="You haven't registered for any events yet."
          action={
            <Link to="/dashboard/events" className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              Browse Events
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((reg) => {
            const event = events.find((e) => e.id === reg.eventId);
            if (!event) return null;
            const isPast = new Date(event.date) < new Date();
            return (
              <div key={reg.id} className="bg-card border border-border rounded-xl p-4 shadow-card flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge label={event.category} />
                    <StatusBadge label={reg.status} />
                    {isPast && <span className="text-xs text-muted-foreground">(Past)</span>}
                  </div>
                  <Link to={`/dashboard/events/${event.id}`} className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                    {event.title}
                  </Link>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDateDDMMYY(event.date)} · {event.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Registered on {formatDateDDMMYY(reg.registeredAt)}
                  </p>
                </div>
                {reg.status === 'confirmed' && !isPast && (
                  <button
                    onClick={() => setCancelTarget(reg.id)}
                    className="flex-shrink-0 flex items-center gap-1 text-xs text-destructive border border-destructive/30 hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Cancel Registration"
        description="Are you sure you want to cancel this registration?"
        confirmLabel="Yes, Cancel"
        onConfirm={handleCancel}
        variant="destructive"
      />
    </div>
  );
};

export default MyRegistrationsPage;
