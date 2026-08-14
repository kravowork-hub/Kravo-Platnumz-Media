/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { Layout } from './components/Layout';
import { AdminLayout } from './components/AdminLayout';
import { Home } from './pages/Home';
import { ArticlePage } from './pages/ArticlePage';
import { CategoryPage } from './pages/CategoryPage';
import { SearchPage } from './pages/SearchPage';
import { LiveScores } from './pages/LiveScores';
import { TournamentScores } from './pages/TournamentScores';
import { Videos } from './pages/Videos';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminArticles } from './pages/admin/AdminArticles';
import { AdminEditor } from './pages/admin/AdminEditor';
import { AdminVideo } from './pages/admin/AdminVideo';
import { AdminSocial } from './pages/admin/AdminSocial';
import { AdminScores } from './pages/admin/AdminScores';
import { AdminCategories } from './pages/admin/AdminCategories';
import { ThemeSwitcher } from './components/ThemeSwitcher';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/admin/login" />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <HelmetProvider>
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
            <Route path="scores" element={<LiveScores />} />
            <Route path="scores/:id" element={<TournamentScores />} />
            <Route path="videos" element={<Videos />} />
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
            <Route path="categories" element={<AdminCategories />} />
            <Route path="video" element={<AdminVideo />} />
            <Route path="social" element={<AdminSocial />} />
            <Route path="scores" element={<AdminScores />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
    </HelmetProvider>
  );
}
