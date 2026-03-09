import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import { UserLayout } from "./components/layout/UserLayout";
import { AdminLayout } from "./components/layout/AdminLayout";

import UserDashboard from "./pages/user/UserDashboard";
import BrowseEventsPage from "./pages/user/BrowseEventsPage";
import EventDetailPage from "./pages/user/EventDetailPage";
import MyRegistrationsPage from "./pages/user/MyRegistrationsPage";
import UserProfilePage from "./pages/user/UserProfilePage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEventsPage from "./pages/admin/AdminEventsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminRegistrationsPage from "./pages/admin/AdminRegistrationsPage";
import AdminProfilePage from "./pages/admin/AdminProfilePage";

import NotFound from "./pages/NotFound";

const App = () => (
  <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* User dashboard routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="user">
                <UserLayout>
                  <UserDashboard />
                </UserLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/events"
            element={
              <ProtectedRoute role="user">
                <UserLayout>
                  <BrowseEventsPage />
                </UserLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/events/:id"
            element={
              <ProtectedRoute role="user">
                <UserLayout>
                  <EventDetailPage />
                </UserLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/my-registrations"
            element={
              <ProtectedRoute role="user">
                <UserLayout>
                  <MyRegistrationsPage />
                </UserLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/profile"
            element={
              <ProtectedRoute role="user">
                <UserLayout>
                  <UserProfilePage />
                </UserLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin dashboard routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout>
                  <AdminEventsPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout>
                  <AdminUsersPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/registrations"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout>
                  <AdminRegistrationsPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout>
                  <AdminProfilePage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
    </BrowserRouter>
);

export default App;
