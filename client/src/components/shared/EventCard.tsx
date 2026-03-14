import { Link } from 'react-router-dom';
import { Event } from '@/types';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { cn } from '@/lib/utils';
import { formatDateDDMMYY } from '@/utils/date';

interface EventCardProps {
  event: Event;
  isRegistered?: boolean;
  isFull?: boolean;
  onRegister?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
  linkTo?: string;
}

const EventCard = ({
  event,
  isRegistered = false,
  isFull = false,
  onRegister,
  onCancel,
  showActions = true,
  linkTo,
}: EventCardProps) => {
  const capacityPercent = Math.min(100, Math.round((event.registeredCount / event.capacity) * 100));
  const isNearFull = capacityPercent >= 80;

  const CardWrapper = ({ children }: { children: React.ReactNode }) =>
    linkTo ? (
      <Link to={linkTo} className="block group h-full">
        {children}
      </Link>
    ) : (
      <div className="group h-full">{children}</div>
    );

  return (
    <CardWrapper>
      <div className="bg-card border border-border rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col h-full overflow-hidden">
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <StatusBadge label={event.category} />
            {isRegistered && <StatusBadge label="confirmed" />}
          </div>
          <h3 className="font-semibold text-foreground text-base leading-snug mb-3 line-clamp-2">
            {event.title}
          </h3>
          <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{formatDateDDMMYY(event.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          </div>

          {/* Capacity bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3 w-3" />
                {event.registeredCount} / {event.capacity}
              </span>
              <span className={cn('font-medium', isNearFull ? 'text-amber-600' : 'text-muted-foreground')}>
                {capacityPercent}%
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  capacityPercent >= 100 ? 'bg-destructive' : isNearFull ? 'bg-amber-500' : 'bg-primary'
                )}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
          </div>

          {showActions && (
            <div className="mt-auto">
              {isRegistered ? (
                <button
                  onClick={(e) => { e.preventDefault(); onCancel?.(); }}
                  className="w-full text-sm py-2 px-4 rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors font-medium"
                >
                  Cancel Registration
                </button>
              ) : isFull ? (
                <button disabled className="w-full text-sm py-2 px-4 rounded-lg bg-muted text-muted-foreground cursor-not-allowed font-medium">
                  Event Full
                </button>
              ) : (
                <button
                  onClick={(e) => { e.preventDefault(); onRegister?.(); }}
                  className="w-full text-sm py-2 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                >
                  Register Now
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </CardWrapper>
  );
};

export default EventCard;
