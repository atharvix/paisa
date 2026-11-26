import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { AttendeeDashboard } from './pages/AttendeeDashboard';
import { CheckInPage } from './pages/CheckInPage';
import { ReportVenuePage } from './pages/ReportVenuePage';
import { HostDashboard } from './pages/HostDashboard';
import { HostKycPage } from './pages/HostKycPage';
import { CreateEventPage } from './pages/CreateEventPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminDisputesPage } from './pages/AdminDisputesPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { AdminLedgerPage } from './pages/AdminLedgerPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#0B0F17] flex flex-col font-sans text-slate-100">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />

              {/* Attendee Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/wallet" element={<AttendeeDashboard />} />
                <Route path="/checkin/:ticketId" element={<CheckInPage />} />
                <Route path="/report/:ticketId" element={<ReportVenuePage />} />
              </Route>

              {/* Host Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ROLE_HOST', 'ROLE_ADMIN']} />}>
                <Route path="/host/events" element={<HostDashboard />} />
                <Route path="/host/kyc" element={<HostKycPage />} />
                <Route path="/host/create-event" element={<CreateEventPage />} />
              </Route>

              {/* Admin Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/disputes" element={<AdminDisputesPage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
                <Route path="/admin/ledger" element={<AdminLedgerPage />} />
              </Route>
            </Routes>
          </main>
          <footer className="border-t border-[#222E40] py-6 text-center text-xs text-slate-500 font-mono">
            VERITIX Anti-Scam Event Ticketing Protocol • Zero Overselling • Escrow Protected
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
