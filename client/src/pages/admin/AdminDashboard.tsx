import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { fetchUsers } from '@/api/usersApi';
import { fetchEvents, mapEventFromApi } from '@/api/eventsApi';
import { fetchRegistrations } from '@/api/registrationApi';
import { User, Event, Registration } from '@/types';
import StatsCard from '@/components/shared/StatsCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { CalendarDays, Users, ClipboardList, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { formatDateDDMMYY } from '@/utils/date';

const AdminDashboard = () => {
  const { currentUser } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
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
      } catch {
        setUsers([]);
        setEvents([]);
        setRegistrations([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const studentUsers = users.filter((u) => u.role === 'user');
  const activeRegs = registrations.filter((reg) => reg.status === 'confirmed');
  const registrationsByEvent = activeRegs.reduce<Record<string, number>>((acc, reg) => {
    acc[reg.eventId] = (acc[reg.eventId] || 0) + 1;
    return acc;
  }, {});

  const today = new Date();
  const activeEvents = events
    .filter((e) => e.isActive && new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Chart data: top 7 events by confirmed registrations from server data
  const chartData = events
    .filter((e) => e.isActive)
    .map((e) => {
      const count = registrationsByEvent[e.id] || 0;
      return {
        name: e.title.length > 18 ? e.title.slice(0, 18) + '…' : e.title,
        registrations: count,
        capacity: e.capacity,
      };
    })
    .sort((a, b) => b.registrations - a.registrations)
    .slice(0, 7)
    ;

  // Recent 5 registrations
  const recentRegs = [...registrations]
    .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
    .slice(0, 5);

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
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {currentUser?.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Total Events" value={events.length} icon={CalendarDays} description="All created events" />
        <StatsCard title="Active Events" value={activeEvents.length} icon={TrendingUp} description="Upcoming this season" />
        <StatsCard title="Total Students" value={studentUsers.length} icon={Users} description="Registered accounts" />
        <StatsCard title="Active Registrations" value={activeRegs.length} icon={ClipboardList} description="Confirmed sign-ups" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Chart */}
        <div className="xl:col-span-3 bg-card border border-border rounded-xl p-5 shadow-card">
          <h2 className="font-semibold text-foreground mb-1">Registrations by Event</h2>
          <p className="text-xs text-muted-foreground mb-4">Top events by registration count</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                formatter={(value: number) => [Math.round(value), 'Registrations']}
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="registrations" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent registrations */}
        <div className="xl:col-span-2 bg-card border border-border rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Recent Registrations</h2>
            <Link to="/admin/registrations" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {recentRegs.map((reg) => {
              const user = users.find((u) => String(u.id) === reg.userId);
              const event = events.find((e) => e.id === reg.eventId);
              return (
                <div key={reg.id} className="flex items-center gap-3">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-8 w-8 rounded-full object-cover border border-border flex-shrink-0"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                      {user?.name.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground truncate">{event?.title || 'Unknown event'}</p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <StatusBadge label={reg.status} />
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDateDDMMYY(reg.registeredAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Events summary */}
      <div className="mt-6 bg-card border border-border rounded-xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Upcoming Events Overview</h2>
          <Link to="/admin/events" className="text-xs text-primary hover:underline">Manage events</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Event</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Capacity</th>
                <th className="pb-3 font-medium text-muted-foreground">Registrations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeEvents.slice(0, 5).map((event) => {
                const currentRegistrations = registrationsByEvent[event.id] || 0;
                const pct = Math.min(100, Math.round((currentRegistrations / event.capacity) * 100));
                return (
                  <tr key={event.id}>
                    <td className="py-3 pr-4 font-medium text-foreground truncate max-w-[180px]">{event.title}</td>
                    <td className="py-3 pr-4 hidden sm:table-cell"><StatusBadge label={event.category} /></td>
                    <td className="py-3 pr-4 text-muted-foreground hidden md:table-cell">{formatDateDDMMYY(event.date)}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{event.capacity}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{currentRegistrations}/{event.capacity}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
