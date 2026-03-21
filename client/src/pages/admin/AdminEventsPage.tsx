import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  fetchEvents,
  createEvent as apiCreateEvent,
  updateEvent as apiUpdateEvent,
  deleteEvent as apiDeleteEvent,
  mapEventFromApi,
  mapEventToApi,
} from '@/api/eventsApi';
import { fetchRegistrations } from '@/api/registrationApi';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import EmptyState from '@/components/shared/EmptyState';
import { CalendarDays, Plus, Pencil, Trash2, Search, X, Loader2 } from 'lucide-react';
import { EventCategory, Event, Registration } from '@/types';
import { formatDateDDMMYY } from '@/utils/date';

const CATEGORIES: EventCategory[] = ['Sports', 'Arts', 'Academic', 'Tech', 'Cultural', 'Social'];

const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  category: z.enum(['Sports', 'Arts', 'Academic', 'Tech', 'Cultural', 'Social']),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  location: z.string().min(3, 'Location is required').max(200),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1').max(10000),
});

type EventFormValues = z.infer<typeof eventSchema>;

const AdminEventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Event | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadEvents = async () => {
    try {
      const [eventsData, registrationsData] = await Promise.all([fetchEvents(), fetchRegistrations()]);
      setEvents(eventsData.map(mapEventFromApi));
      setRegistrations(registrationsData);
    } catch {
      setEvents([]);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const filtered = events.filter(
    (e) =>
      !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase())
  );

  const getRegisteredCount = (eventId: string) => {
    const confirmedCount = registrations.filter((r) => r.eventId === eventId && r.status === 'confirmed').length;
    return Number.isFinite(confirmedCount) ? confirmedCount : 0;
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({ resolver: zodResolver(eventSchema) });

  const openCreate = () => {
    setEditTarget(null);
    setIsCreating(true);
    reset({ title: '', description: '', category: 'Academic' as EventCategory, date: '', time: '', location: '', capacity: 50 });
    setIsDialogOpen(true);
  };

  const openEdit = (event: Event) => {
    setEditTarget(event);
    setIsCreating(false);
    reset({
      title: event.title,
      description: event.description,
      category: event.category,
      date: event.date,
      time: event.time,
      location: event.location,
      capacity: event.capacity,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: EventFormValues) => {
    const payload = mapEventToApi({
      title: data.title,
      description: data.description,
      category: data.category as EventCategory,
      date: data.date,
      time: data.time,
      location: data.location,
      capacity: data.capacity,
    });
    setSubmitting(true);
    try {
      if (editTarget) {
        await apiUpdateEvent(Number(editTarget.id), payload);
      } else {
        await apiCreateEvent(payload);
      }
      await loadEvents();
      setIsDialogOpen(false);
      reset();
    } catch (err) {
      console.error('Failed to save event', err);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiDeleteEvent(Number(deleteTarget));
      await loadEvents();
    } catch (err) {
      console.error('Failed to delete event', err);
    }
    setDeleteTarget(null);
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Events Management</h1>
          <p className="text-sm text-muted-foreground mt-1">{events.length} total events</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors text-sm font-semibold"
        >
          <Plus className="h-4 w-4" />
          Create Event
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events..."
          className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm max-w-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No events found" description="Create your first event to get started." />
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Location</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Capacity</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Registered</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((event) => {
                  const registeredCount = getRegisteredCount(event.id);
                  const pct = event.capacity > 0 ? Math.min(100, Math.round((registeredCount / event.capacity) * 100)) : 0;
                  return (
                    <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground max-w-[200px]">
                        <p className="truncate">{event.title}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell"><StatusBadge label={event.category} /></td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{formatDateDDMMYY(event.date)}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell truncate max-w-[160px]">{event.location}</td>
                      <td className="px-4 py-3 text-muted-foreground">{event.capacity}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-12 bg-muted rounded-full hidden sm:block overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-muted-foreground">{registeredCount} / {event.capacity}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(event)}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(event.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/80" onClick={() => setIsDialogOpen(false)} />
          <div className="relative z-50 w-full max-w-2xl mx-4 bg-background border border-border rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">{isCreating ? 'Create New Event' : 'Edit Event'}</h2>
              <button onClick={() => setIsDialogOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Title *</label>
                  <input {...register('title')} className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                  {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Category *</label>
                  <select {...register('category')} className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Capacity *</label>
                  <input type="number" {...register('capacity')} className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                  {errors.capacity && <p className="text-xs text-destructive mt-1">{errors.capacity.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Date *</label>
                  <input type="date" {...register('date')} className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                  {errors.date && <p className="text-xs text-destructive mt-1">{errors.date.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Time *</label>
                  <input type="time" {...register('time')} className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                  {errors.time && <p className="text-xs text-destructive mt-1">{errors.time.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Location *</label>
                  <input {...register('location')} className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                  {errors.location && <p className="text-xs text-destructive mt-1">{errors.location.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Description *</label>
                  <textarea {...register('description')} rows={4} className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none" />
                  {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsDialogOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-60 flex items-center gap-2">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isCreating ? 'Create Event' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Event"
        description="Are you sure you want to delete this event? All registrations for this event will be affected."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
};

export default AdminEventsPage;
