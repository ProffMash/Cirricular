import { useState, useEffect } from 'react';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { ClipboardList, Download, Search, X, Loader2 } from 'lucide-react';
import { fetchUsers } from '@/api/usersApi';
import { fetchEvents, mapEventFromApi } from '@/api/eventsApi';
import { fetchRegistrations } from '@/api/registrationApi';
import { User, Event, Registration } from '@/types';
import { formatDateDDMMYY } from '@/utils/date';

const AdminRegistrationsPage = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((reg) => {
                  const user = users.find((u) => String(u.id) === reg.userId);
                  const event = events.find((e) => e.id === reg.eventId);
                  return (
                    <tr key={reg.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                            {user?.name.charAt(0) || '?'}
                          </div>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRegistrationsPage;
