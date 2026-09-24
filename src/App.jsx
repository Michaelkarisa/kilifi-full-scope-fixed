import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import './styles.css';

import Navigation from './components/Navigation';
import AuthModal from './components/AuthModal';
import AppRoute from './components/AppRoute';
import Dashboard from './components/dashboard';

import Hero from './components/sections/Hero';
import NewsSection from './components/sections/NewsSection';
import EventsSection from './components/sections/EventsSection';
import JobsSection from './components/sections/JobsSection';
import TendersSection from './components/sections/TendersSection';
import DepartmentsSection from './components/sections/DepartmentsSection';
import ServicesSection from './components/sections/ServicesSection';
import ProjectsSection from './components/sections/ProjectsSection';
import LeadershipSection from './components/sections/LeadershipSection';
import AnnouncementsSection from './components/sections/AnnouncementsSection';
import AboutSection from './components/sections/AboutSection';
import BlogSection from './components/sections/BlogSection';
import DocumentsSection from './components/sections/DocumentsSection';
import FaqSection from './components/sections/FaqSection';
import PartnershipsSection from './components/sections/PartnershipsSection';
import SectorsSection from './components/sections/SectorsSection';
import TourismSection from './components/sections/TourismSection';

import { getAuthToken, hydrateTokenFromStorage, staff } from './api';

// ── Auth context restored once on mount ───────────────────────────────────
function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData]               = useState(null);
  const [authLoading, setAuthLoading]         = useState(true);

  useEffect(() => {
    hydrateTokenFromStorage();
    const token = getAuthToken();
    if (!token) { setAuthLoading(false); return; }

    staff.me(token)
      .then(res => {
        setIsAuthenticated(true);
        setUserData(res?.data?.user ?? res?.user ?? null);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setUserData(null);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  const login = (user) => { setIsAuthenticated(true); setUserData(user); };
  const logout = () => { setIsAuthenticated(false); setUserData(null); };

  return { isAuthenticated, userData, authLoading, login, logout };
}

// ── Public page wrapper (adds shared nav + footer) ─────────────────────────
function PublicLayout({ children, auth }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchParams] = useSearchParams();

  // If the user just landed with ?next=... open login immediately
  useEffect(() => {
    if (searchParams.get('next')) setAuthModalOpen(true);
  }, [searchParams]);

  const handleAuthSuccess = (_token, user) => {
    auth.login(user);
    setAuthModalOpen(false);
    const next = searchParams.get('next');
    navigate(next ? decodeURIComponent(next) : '/dashboard');
  };

  const handleLogout = () => {
    auth.logout();
    navigate('/');
  };

  // Map pathname → nav tab id
  const pathToTab = {
    '/': 'home', '/news': 'news', '/events': 'events', '/jobs': 'jobs',
    '/tenders': 'tenders', '/departments': 'departments', '/services': 'services',
    '/projects': 'projects', '/leadership': 'leadership',
    '/announcements': 'announcements', '/blog': 'blog', '/sectors': 'sectors',
    '/partnerships': 'partnerships', '/documents': 'documents', '/faqs': 'faqs',
    '/tourism': 'tourism', '/about': 'about', '/dashboard': 'dashboard',
  };
  const activeTab = pathToTab[location.pathname] ?? location.pathname.startsWith('/dashboard') ? 'dashboard' : 'home';

  return (
    <>
      <Navigation
        activeSection={activeTab}
        onSectionChange={(id) => navigate(id === 'home' ? '/' : `/${id}`)}
        onLoginClick={() => setAuthModalOpen(true)}
        isAuthenticated={auth.isAuthenticated}
        user={auth.userData}
        onLogout={handleLogout}
      />

      {children}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <footer>
        <p>© 2026 <strong>Kilifi County Government</strong>. All rights reserved.</p>
      </footer>
    </>
  );
}

// ── Root app ───────────────────────────────────────────────────────────────
export default function App() {
  const auth = useAuth();

  return (
    <Routes>
      {/* ── Dashboard (protected) ── */}
      <Route
        path="/dashboard/:panel?"
        element={
          <AppRoute isAuthenticated={auth.isAuthenticated} isLoading={auth.authLoading}>
            <Dashboard user={auth.userData} onLogout={() => { auth.logout(); }} />
          </AppRoute>
        }
      />

      {/* ── Public pages (all wrapped in PublicLayout) ── */}
      <Route element={<PublicLayoutWrapper auth={auth} />}>
        <Route path="/"              element={<HeroPage />} />
        <Route path="/news"          element={<NewsSection />} />
        <Route path="/events"        element={<EventsSection />} />
        <Route path="/jobs"          element={<JobsSection />} />
        <Route path="/tenders"       element={<TendersSection />} />
        <Route path="/departments"   element={<DepartmentsSection />} />
        <Route path="/services"      element={<ServicesSection />} />
        <Route path="/projects"      element={<ProjectsSection />} />
        <Route path="/leadership"    element={<LeadershipSection />} />
        <Route path="/announcements" element={<AnnouncementsSection />} />
        <Route path="/blog"          element={<BlogSection />} />
        <Route path="/sectors"       element={<SectorsSection />} />
        <Route path="/partnerships"  element={<PartnershipsSection />} />
        <Route path="/documents"     element={<DocumentsSection />} />
        <Route path="/faqs"          element={<FaqSection />} />
        <Route path="/tourism"       element={<TourismSection />} />
        <Route path="/about"         element={<AboutSection />} />
        <Route path="*"              element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

// Hero with navigation wired up
function HeroPage() {
  const navigate = useNavigate();
  return <Hero onShowNews={() => navigate('/news')} />;
}

// Outlet-based wrapper so PublicLayout can wrap all public child routes
import { Outlet } from 'react-router-dom';
function PublicLayoutWrapper({ auth }) {
  return (
    <PublicLayout auth={auth}>
      <Outlet />
    </PublicLayout>
  );
}
