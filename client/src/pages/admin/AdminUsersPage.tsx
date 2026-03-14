import { useState, useEffect } from 'react';
import EmptyState from '@/components/shared/EmptyState';
import { Users, Search, X, Loader2, UserCheck, UserX, ShieldCheck } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import { fetchUsers, updateUser } from '@/api/usersApi';
import { fetchEvents, mapEventFromApi } from '@/api/eventsApi';
import { fetchRegistrations } from '@/api/registrationApi';
import { useToast } from '@/hooks/use-toast';
import { Event, Registration, User } from '@/types';
import { formatDateDDMMYY } from '@/utils/date';

type UserTab = 'user' | 'admin';

const AdminUsersPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<UserTab>('user');
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersData, eventsData, registrationsData] = await Promise.all([
          fetchUsers(),
          fetchEvents(),
          fetchRegistrations(),
        ]);

        setAllUsers(usersData);
        setEvents(eventsData.map(mapEventFromApi));
        setRegistrations(registrationsData);
      } catch {
        setAllUsers([]);
        setEvents([]);
        setRegistrations([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const adminCount = allUsers.filter((user) => user.role === 'admin').length;
  const regularUserCount = allUsers.filter((user) => user.role === 'user').length;

  const users = allUsers.filter(
    (u) =>
      u.role === activeTab &&
      (
        !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
  );

  const handleToggleUserActive = async (user: User) => {
    const currentState = user.isActive ?? true;
    const nextState = !currentState;

    setUpdatingUserId(user.id);
    try {
      const updatedUser = await updateUser(user.id, { isActive: nextState });
      setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
      toast({
        title: nextState ? 'User activated' : 'User deactivated',
        description: `${user.name} is now ${nextState ? 'active' : 'inactive'}.`,
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: 'Could not change user status. Please try again.',
      });
    } finally {
      setUpdatingUserId(null);
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-sm text-muted-foreground mt-1">{users.length} {activeTab === 'admin' ? 'admins' : 'users'}</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/30 p-1.5 w-fit">
        <button
          onClick={() => {
            setActiveTab('user');
          }}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'user'
              ? 'bg-background text-foreground shadow-sm border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          type="button"
        >
          <Users className="h-4 w-4" />
          Users
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{regularUserCount}</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('admin');
          }}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'admin'
              ? 'bg-background text-foreground shadow-sm border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          type="button"
        >
          <ShieldCheck className="h-4 w-4" />
          Admins
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{adminCount}</span>
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm max-w-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={activeTab === 'admin' ? ShieldCheck : Users}
          title={`No ${activeTab === 'admin' ? 'admins' : 'users'} found`}
          description={`No ${activeTab === 'admin' ? 'admins' : 'users'} match your search.`}
        />
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">User</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Status</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Joined</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Registered On</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Event Registrations</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => {
                  const userRegs = registrations.filter((registration) => registration.userId === String(user.id));
                  const activeRegs = userRegs.filter((r) => r.status === 'confirmed');
                  const fallbackLatestRegistrationDate = userRegs.length > 0
                    ? formatDateDDMMYY(
                      Math.max(...userRegs.map((registration) => new Date(registration.registeredAt).getTime()))
                    )
                    : null;
                  const latestRegistrationDate = user.latestRegistrationDate
                    ? formatDateDDMMYY(user.latestRegistrationDate)
                    : fallbackLatestRegistrationDate;
                  const eventTitles = activeRegs
                    .map((registration) => events.find((event) => event.id === registration.eventId)?.title)
                    .filter((title): title is string => Boolean(title));
                  const visibleTitles = eventTitles.slice(0, 2);
                  const remainingCount = eventTitles.length - visibleTitles.length;

                  return (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        <StatusBadge label={(user.isActive ?? true) ? 'active' : 'inactive'} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {formatDateDDMMYY(user.joinedDate)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">
                        {activeTab === 'admin'
                          ? <span className="text-xs text-muted-foreground">Not applicable</span>
                          : latestRegistrationDate || <span className="text-xs text-muted-foreground">No registrations</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                        {activeTab === 'admin' ? (
                          <span className="text-xs text-muted-foreground">Not applicable</span>
                        ) : eventTitles.length === 0 ? (
                          <span className="text-xs text-muted-foreground">No confirmed registrations</span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {visibleTitles.map((title) => (
                              <span
                                key={`${user.id}-${title}`}
                                className="inline-flex max-w-[180px] truncate rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-foreground"
                                title={title}
                              >
                                {title}
                              </span>
                            ))}
                            {remainingCount > 0 && (
                              <span className="inline-flex rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
                                +{remainingCount} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {user.role === 'user' && (
                            <button
                              onClick={() => handleToggleUserActive(user)}
                              disabled={updatingUserId === user.id}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                (user.isActive ?? true)
                                  ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                                  : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                              }`}
                              title={(user.isActive ?? true) ? 'Deactivate user' : 'Activate user'}
                            >
                              {updatingUserId === user.id ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  Updating
                                </>
                              ) : (user.isActive ?? true) ? (
                                <>
                                  <UserX className="h-3.5 w-3.5" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-3.5 w-3.5" />
                                  Activate
                                </>
                              )}
                            </button>
                          )}
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
    </div>
  );
};

export default AdminUsersPage;
