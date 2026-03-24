import { useState, useEffect } from 'react';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { ClipboardList, Download, Search, X, Loader2, UserX } from 'lucide-react';
import { fetchUsers } from '@/api/usersApi';
import { fetchEvents, mapEventFromApi } from '@/api/eventsApi';
import { adminDeregisterRegistration, fetchRegistrations } from '@/api/registrationApi';
import { User, Event, Registration } from '@/types';
import { formatDateDDMMYY } from '@/utils/date';

const AdminRegistrationsPage = () => {
  const PAGE_SIZE = 7;
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deregisterTarget, setDeregisterTarget] = useState<string | null>(null);
  const [deregisteringId, setDeregisteringId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersData, eventsData, registrationsData] = await Promise.all([
          fetchUsers(),
          fetchEvents(),
          fetchRegistrations(),
        ]);
        setUsers(usersData);
        setEvents(eventsData.map(mapEventFromApi));
        setRegistrations(registrationsData);
      } catch (error) {
        console.error('Failed to load data', error);
        setUsers([]);
        setEvents([]);
        setRegistrations([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filtered = registrations.filter((reg) => {
    const user = users.find((u) => String(u.id) === reg.userId);
    const event = events.find((e) => e.id === reg.eventId);
    const matchesSearch =
      !search ||
      user?.name.toLowerCase().includes(search.toLowerCase()) ||
      event?.title.toLowerCase().includes(search.toLowerCase()) ||
      user?.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    const matchesEvent = eventFilter === 'all' || reg.eventId === eventFilter;
    return matchesSearch && matchesStatus && matchesEvent;
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, eventFilter]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRegistrations = sorted.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );

  const startIndex = sorted.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(safeCurrentPage * PAGE_SIZE, sorted.length);

  const exportCSV = () => {
    const headers = ['Registration ID', 'Student Name', 'Email', 'Event Title', 'Date', 'Status', 'Registered At'];
    const rows = sorted.map((reg) => {
      const user = users.find((u) => String(u.id) === reg.userId);
      const event = events.find((e) => e.id === reg.eventId);
      return [
        reg.id,
        user?.name || '',
        user?.email || '',
        event?.title || '',
        event?.date || '',
        reg.status,
        new Date(reg.registeredAt).toLocaleString(),
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeregister = async () => {
    if (!deregisterTarget) return;

    try {
      setDeregisteringId(deregisterTarget);
      await adminDeregisterRegistration(Number(deregisterTarget));

      const currentReg = registrations.find((r) => r.id === deregisterTarget);
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === deregisterTarget ? { ...r, status: 'cancelled' } : r
        )
      );

      if (currentReg) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === currentReg.eventId
              ? { ...e, registeredCount: Math.max(0, e.registeredCount - 1) }
              : e
          )
        );
      }
    } catch (error) {
      console.error('Failed to deregister user', error);
    } finally {
      setDeregisteringId(null);
      setDeregisterTarget(null);
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Registrations</h1>
          <p className="text-sm text-muted-foreground mt-1">{sorted.length} of {registrations.length} registrations</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 border border-border text-foreground px-4 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student or event..."
            className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-3 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm max-w-xs"
        >
          <option value="all">All Events</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.title}</option>
          ))}
        </select>
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No registrations found" description="Try adjusting your filters." />
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Student</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Event</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Event Date</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Registered</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedRegistrations.map((reg) => {
                  const user = users.find((u) => String(u.id) === reg.userId);
                  const event = events.find((e) => e.id === reg.eventId);
                  return (
                    <tr key={reg.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {user?.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="h-7 w-7 rounded-full object-cover border border-border flex-shrink-0"
                            />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                              {user?.name.charAt(0).toUpperCase() || '?'}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-foreground">{user?.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground truncate max-w-[200px]">{event?.title || 'Unknown event'}</p>
                        {event && <StatusBadge label={event.category} />}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {event ? formatDateDDMMYY(event.date) : '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {formatDateDDMMYY(reg.registeredAt)}
                      </td>
                      <td className="px-4 py-3"><StatusBadge label={reg.status} /></td>
                      <td className="px-4 py-3 text-right">
                        {reg.status === 'confirmed' ? (
                          <button
                            onClick={() => setDeregisterTarget(reg.id)}
                            disabled={deregisteringId === reg.id}
                            className="inline-flex items-center gap-1.5 text-xs text-destructive border border-destructive/30 hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {deregisteringId === reg.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <UserX className="h-3.5 w-3.5" />
                            )}
                            Deregister
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing {startIndex}-{endIndex} of {sorted.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-xs text-muted-foreground">
                Page {safeCurrentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deregisterTarget}
        onOpenChange={(open) => !open && setDeregisterTarget(null)}
        title="Deregister User"
        description="This will cancel the user's registration for this event. Continue?"
        confirmLabel="Yes, Deregister"
        onConfirm={handleDeregister}
        variant="destructive"
      />
    </div>
  );
};

export default AdminRegistrationsPage;
