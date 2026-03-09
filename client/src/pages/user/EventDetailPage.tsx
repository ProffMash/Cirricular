import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useEventStore } from '@/stores/eventStore';
import { useRegistrationStore } from '@/stores/registrationStore';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Calendar, Clock, MapPin, Users, ArrowLeft, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { getEventById, incrementRegistered, decrementRegistered } = useEventStore();
  const { isUserRegistered, registerForEvent, cancelRegistration, getUserRegistrationForEvent } = useRegistrationStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const event = getEventById(id || '');
  const userId = currentUser?.id || '';
  const registered = isUserRegistered(userId, id || '');
  const isFull = event ? event.registeredCount >= event.capacity && !registered : false;
  const capacityPercent = event ? Math.min(100, Math.round((event.registeredCount / event.capacity) * 100)) : 0;

  if (!event) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Event not found.</p>
        <Link to="/dashboard/events" className="text-primary hover:underline text-sm mt-2 inline-block">
          Back to events
        </Link>
      </div>
    );
  }

  const handleRegister = () => {
    registerForEvent(userId, event.id);
    incrementRegistered(event.id);
    setConfirmOpen(false);
    setSuccessMsg('You have successfully registered for this event!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleCancel = () => {
    const reg = getUserRegistrationForEvent(userId, event.id);
    if (reg) {
      cancelRegistration(reg.id);
      decrementRegistered(event.id);
    }
    setCancelOpen(false);
    setSuccessMsg('Your registration has been cancelled.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 mb-4 text-sm">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {event.imageUrl && (
        <div className="h-64 lg:h-80 rounded-2xl overflow-hidden mb-6">
          <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <StatusBadge label={event.category} />
            {registered && <StatusBadge label="confirmed" />}
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">{event.title}</h1>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { icon: Calendar, label: new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) },
              { icon: Clock, label: event.time },
              { icon: MapPin, label: event.location },
              { icon: Users, label: `${event.registeredCount} / ${event.capacity} registered` },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>
          <h2 className="font-semibold text-foreground mb-2">About this Event</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{event.description}</p>
        </div>

        <div>
          <div className="bg-card border border-border rounded-xl p-5 shadow-card sticky top-6">
            <h3 className="font-semibold text-foreground mb-4">Registration</h3>
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1 text-muted-foreground">
                <span>{event.registeredCount} registered</span>
                <span>{event.capacity - event.registeredCount} spots left</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    capacityPercent >= 100 ? 'bg-destructive' : capacityPercent >= 80 ? 'bg-amber-500' : 'bg-primary'
                  )}
                  style={{ width: `${capacityPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{capacityPercent}% full</p>
            </div>
            {registered ? (
              <>
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 rounded-lg px-3 py-2.5 text-sm mb-3">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  You're registered!
                </div>
                <button
                  onClick={() => setCancelOpen(true)}
                  className="w-full py-2.5 px-4 rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium"
                >
                  Cancel Registration
                </button>
              </>
            ) : isFull ? (
              <button disabled className="w-full py-2.5 px-4 rounded-lg bg-muted text-muted-foreground cursor-not-allowed text-sm font-medium">
                Event is Full
              </button>
            ) : (
              <button
                onClick={() => setConfirmOpen(true)}
                className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-semibold"
              >
                Register Now
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm Registration"
        description={`Register for "${event.title}" on ${new Date(event.date).toLocaleDateString()}?`}
        confirmLabel="Register"
        onConfirm={handleRegister}
      />
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel Registration"
        description="Are you sure you want to cancel your registration for this event?"
        confirmLabel="Yes, Cancel"
        onConfirm={handleCancel}
        variant="destructive"
      />
    </div>
  );
};

export default EventDetailPage;
