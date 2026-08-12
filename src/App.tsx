/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { Layout } from './components/Layout';
import { AdminLayout } from './components/AdminLayout';
import { Home } from './pages/Home';
import { ArticlePage } from './pages/ArticlePage';
import { CategoryPage } from './pages/CategoryPage';
import { SearchPage } from './pages/SearchPage';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminArticles } from './pages/admin/AdminArticles';
import { AdminEditor } from './pages/admin/AdminEditor';
import { AdminVideo } from './pages/admin/AdminVideo';
import { ThemeSwitcher } from './components/ThemeSwitcher';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/admin/login" />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ThemeSwitcher />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="article/:slug" element={<ArticlePage />} />
            <Route path="category/:category" element={<CategoryPage />} />
            <Route path="search" element={<SearchPage />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="articles" element={<AdminArticles />} />
            <Route path="articles/new" element={<AdminEditor />} />
            <Route path="articles/:id" element={<AdminEditor />} />
            <Route path="video" element={<AdminVideo />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
