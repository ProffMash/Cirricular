import { useState, useEffect } from 'react';
import { useRegistrationStore } from '@/stores/registrationStore';
import EmptyState from '@/components/shared/EmptyState';
import { Users, Search, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useEventStore } from '@/stores/eventStore';
import { fetchUsers } from '@/api/usersApi';
import { User } from '@/types';

const AdminUsersPage = () => {
  const { getUserRegistrations } = useRegistrationStore();
  const { events } = useEventStore();
  const [search, setSearch] = useState('');
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers()
      .then((data) => setAllUsers(data.filter((u) => u.role === 'user')))
      .catch(() => setAllUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const users = allUsers.filter(
    (u) =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

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
        <p className="text-sm text-muted-foreground mt-1">{users.length} registered students</p>
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
        <EmptyState icon={Users} title="No users found" description="No registered students match your search." />
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Student</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Joined</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Registrations</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => {
                  const userRegs = getUserRegistrations(String(user.id));
                  const activeRegs = userRegs.filter((r) => r.status === 'confirmed');
                  const isExpanded = expandedUser === user.id;

                  return (
                    <>
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
                          {new Date(user.joinedDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {activeRegs.length} confirmed
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="View registrations"
                          >
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${user.id}-expanded`}>
                          <td colSpan={4} className="px-4 pb-4 bg-muted/20">
                            <div className="pt-2">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">REGISTRATIONS ({userRegs.length})</p>
                              {userRegs.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No registrations found.</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {userRegs.map((reg) => {
                                    const event = events.find((e) => e.id === reg.eventId);
                                    return (
                                      <div key={reg.id} className="flex items-center justify-between bg-card border border-border rounded-lg px-3 py-2 text-xs">
                                        <span className="font-medium text-foreground truncate max-w-[200px]">{event?.title || 'Unknown event'}</span>
                                        <span className="text-muted-foreground">{new Date(reg.registeredAt).toLocaleDateString()}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
