import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { fetchUser } from '@/api/usersApi';
import { updateUser, uploadAvatarToCloudinary } from '@/api/usersApi';
import { User, Mail, Phone, FileText, Calendar, Loader2, Pencil, X, Hash, Building2 } from 'lucide-react';
import { formatDateDDMMYY } from '@/utils/date';
import type { School } from '@/types';

const schoolOptions: School[] = ['SPAS', 'Education', 'Health Science', 'Bussiness', 'Engineering'];

const UserProfilePage = () => {
  const { currentUser, token, updateProfile, setUser } = useAuthStore();
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    bio: currentUser?.bio || '',
    phone: currentUser?.phone || '',
    regNo: currentUser?.regNo || '',
    school: currentUser?.school || ('' as School | ''),
  });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setProfileData({
      name: currentUser.name || '',
      email: currentUser.email || '',
      bio: currentUser.bio || '',
      phone: currentUser.phone || '',
      regNo: currentUser.regNo || '',
      school: currentUser.school || ('' as School | ''),
    });
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !token) return;

    const syncUserProfile = async () => {
      try {
        const freshUser = await fetchUser(currentUser.id);
        setUser(freshUser, token);
      } catch {
        // Keep existing local user state when profile refresh fails.
      }
    };

    syncUserProfile();
  }, [currentUser?.id, token, setUser]);

  const openEditModal = () => {
    if (!currentUser) return;
    setProfileData({
      name: currentUser.name || '',
      email: currentUser.email || '',
      bio: currentUser.bio || '',
      phone: currentUser.phone || '',
      regNo: currentUser.regNo || '',
      school: currentUser.school || ('' as School | ''),
    });
    setAvatarFile(null);
    setAvatarPreview(currentUser.avatar || null);
    setIsEditOpen(true);
    setError('');
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setAvatarFile(null);
    setError('');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    setError('');
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    let avatarUrl = currentUser.avatar;

    if (!profileData.school) {
      setError('School is required.');
      return;
    }

    const selectedSchool: School = profileData.school;

    const updates = {
      name: profileData.name.trim(),
      email: profileData.email.trim(),
      phone: profileData.phone.trim(),
      bio: profileData.bio.trim(),
      regNo: profileData.regNo.trim(),
      school: selectedSchool,
      avatar: avatarUrl,
    };

    if (!updates.name) {
      setError('Name is required.');
      return;
    }
    if (updates.name.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    if (!updates.email) {
      setError('Email is required.');
      return;
    }
    if (!updates.regNo || updates.regNo.length < 3) {
      setError('Reg No must be at least 3 characters.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (avatarFile) {
        avatarUrl = await uploadAvatarToCloudinary(avatarFile);
        updates.avatar = avatarUrl;
      }

      await updateUser(currentUser.id, updates);
      updateProfile(updates);
      setProfileData(updates);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      closeEditModal();
    } catch (err: any) {
      const message =
        err.response?.data?.regNo?.[0] ||
        err.response?.data?.school?.[0] ||
        err.response?.data?.email?.[0] ||
        err.response?.data?.detail ||
        'Failed to update profile.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your personal information</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-card mb-6">
        <div className="flex items-start justify-between gap-4 mb-6 pb-6 border-b border-border">
          <div className="flex items-center gap-4">
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="h-16 w-16 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="font-bold text-foreground text-lg">{currentUser.name}</h2>
            <p className="text-muted-foreground text-sm">{currentUser.email}</p>
            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
              {currentUser.role}
            </span>
          </div>
          </div>
          <button
            type="button"
            onClick={openEditModal}
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background p-2.5 text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            title="Edit profile"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="w-full rounded-xl border border-border bg-background p-4 text-left">
              <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <User className="h-3.5 w-3.5" />
                Full Name
              </div>
              <p className="text-sm text-foreground">{currentUser.name}</p>
            </div>
            <div className="w-full rounded-xl border border-border bg-background p-4 text-left">
              <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Phone className="h-3.5 w-3.5" />
                Phone
              </div>
              <p className={`text-sm ${currentUser.phone ? 'text-foreground' : 'text-muted-foreground'}`}>{currentUser.phone || 'Not provided'}</p>
            </div>
          </div>
          <div className="w-full rounded-xl border border-border bg-background p-4 text-left">
            <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Hash className="h-3.5 w-3.5" />
              Reg No
            </div>
            <p className={`text-sm ${currentUser.regNo ? 'text-foreground' : 'text-muted-foreground'}`}>{currentUser.regNo || 'Not provided'}</p>
          </div>
          <div className="w-full rounded-xl border border-border bg-background p-4 text-left">
            <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Building2 className="h-3.5 w-3.5" />
              School
            </div>
            <p className={`text-sm ${currentUser.school ? 'text-foreground' : 'text-muted-foreground'}`}>{currentUser.school || 'Not provided'}</p>
          </div>
          <div className="w-full rounded-xl border border-border bg-background p-4 text-left">
            <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Mail className="h-3.5 w-3.5" />
              Email Address
            </div>
            <p className="text-sm text-foreground">{currentUser.email}</p>
          </div>
          <div className="w-full rounded-xl border border-border bg-background p-4 text-left">
            <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <FileText className="h-3.5 w-3.5" />
              Bio
            </div>
            <p className={`text-sm ${currentUser.bio ? 'text-foreground' : 'text-muted-foreground'}`}>{currentUser.bio || 'Not provided'}</p>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> Member Since
            </label>
            <input
              type="text"
              value={formatDateDDMMYY(currentUser.joinedDate)}
              disabled
              className="w-full px-3 py-2.5 rounded-lg border border-input bg-muted text-muted-foreground text-sm cursor-not-allowed"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          {saved && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
              Profile updated successfully!
            </div>
          )}
        </div>
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-4 sm:items-center sm:py-0">
          <div className="fixed inset-0 bg-black/80" onClick={closeEditModal} />
          <div className="relative z-50 mx-4 w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Edit Profile</h2>
                <p className="text-sm text-muted-foreground">Update your profile information.</p>
              </div>
              <button onClick={closeEditModal} className="text-muted-foreground transition-colors hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <User className="h-3.5 w-3.5" />
                  Avatar
                </label>
                <div className="flex items-center gap-3">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="h-14 w-14 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm border border-border">
                      N/A
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-primary file:cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <User className="h-3.5 w-3.5" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                    maxLength={100}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Hash className="h-3.5 w-3.5" />
                    Reg No
                  </label>
                  <input
                    type="text"
                    value={profileData.regNo}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, regNo: e.target.value }))}
                    maxLength={50}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  School
                </label>
                <select
                  value={profileData.school}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, school: e.target.value as School | '' }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select your school</option>
                  {schoolOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  Bio
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, bio: e.target.value }))}
                  rows={5}
                  maxLength={300}
                  placeholder="Tell us a bit about yourself..."
                  className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="mt-1 text-right text-xs text-muted-foreground">{profileData.bio.length}/300</p>
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="sticky bottom-0 -mx-6 mt-2 flex flex-col-reverse gap-3 border-t border-border bg-background px-6 pb-1 pt-4 sm:mx-0 sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="w-full rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 sm:w-auto"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;
