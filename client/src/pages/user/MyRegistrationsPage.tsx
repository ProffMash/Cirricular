import { useAuthStore } from '@/stores/authStore';
import { useEventStore } from '@/stores/eventStore';
import { useRegistrationStore } from '@/stores/registrationStore';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import EmptyState from '@/components/shared/EmptyState';
import { BookMarked, Calendar, MapPin, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const MyRegistrationsPage = () => {
  const { currentUser } = useAuthStore();
  const { events, decrementRegistered } = useEventStore();
  const { getUserRegistrations, cancelRegistration } = useRegistrationStore();
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');

  const userId = currentUser?.id || '';
  const regs = getUserRegistrations(userId);
  const filtered = filter === 'all' ? regs : regs.filter((r) => r.status === filter);
  const sorted = [...filtered].sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

  const handleCancel = () => {
    if (!cancelTarget) return;
    const reg = regs.find((r) => r.id === cancelTarget);
    cancelRegistration(cancelTarget);
    if (reg) decrementRegistered(reg.eventId);
    setCancelTarget(null);
  };

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
            {f} ({f === 'all' ? regs.length : regs.filter((r) => r.status === f).length})
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
                {event.imageUrl && (
                  <div className="hidden sm:block h-16 w-20 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                  </div>
                )}
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
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {event.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Registered on {new Date(reg.registeredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
