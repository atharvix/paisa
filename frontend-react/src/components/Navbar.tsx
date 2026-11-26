import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Ticket, Calendar, ShieldAlert, Settings, BookOpen, LogOut, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0B0F17]/90 backdrop-blur-md border-b border-[#222E40]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-burgundy-700 border border-gold-500/50 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-gold-400" />
            </div>
            <div>
              <span className="font-editorial text-xl font-bold tracking-tight text-white group-hover:text-gold-300 transition-colors">
                VERITIX
              </span>
              <span className="block text-[10px] tracking-wider uppercase text-gold-500/80 font-mono -mt-1">
                Zero-Scam Escrow
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link to="/" className="text-slate-300 hover:text-white transition-colors">
              Explore Events
            </Link>

            {isAuthenticated && user?.role === 'ROLE_ATTENDEE' && (
              <Link to="/wallet" className="flex items-center gap-2 text-slate-300 hover:text-gold-300 transition-colors">
                <Ticket className="w-4 h-4 text-gold-500" />
                My Ticket Wallet
              </Link>
            )}

            {isAuthenticated && (user?.role === 'ROLE_HOST' || user?.role === 'ROLE_ADMIN') && (
              <>
                <Link to="/host/events" className="flex items-center gap-2 text-slate-300 hover:text-gold-300 transition-colors">
                  <Calendar className="w-4 h-4 text-gold-500" />
                  Organizer Studio
                </Link>
                <Link to="/host/kyc" className="text-slate-300 hover:text-gold-300 transition-colors">
                  KYC & Linked Account
                </Link>
              </>
            )}

            {isAuthenticated && user?.role === 'ROLE_ADMIN' && (
              <>
                <Link to="/admin" className="flex items-center gap-1.5 text-rose-300 hover:text-rose-200 transition-colors">
                  <ShieldAlert className="w-4 h-4" />
                  Admin Console
                </Link>
                <Link to="/admin/disputes" className="text-slate-300 hover:text-white transition-colors">
                  Dispute Center
                </Link>
                <Link to="/admin/settings" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
                  <Settings className="w-4 h-4 text-slate-400" />
                  System Config
                </Link>
                <Link to="/admin/ledger" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  Audit Ledger
                </Link>
              </>
            )}
          </nav>

          {/* Right Action / Profile */}
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-semibold text-white">{user.fullName}</span>
                  <span className="text-[11px] font-mono text-gold-400">
                    {user.role.replace('ROLE_', '')}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 rounded-lg bg-[#1A2333] border border-[#222E40] text-slate-400 hover:text-rose-400 hover:border-rose-900/50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm text-slate-300 hover:text-white font-medium px-3 py-1.5"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold px-4 py-2 rounded-lg bg-burgundy-700 hover:bg-burgundy-600 border border-gold-500/40 text-gold-200 shadow-md transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
