import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ShieldCheck, Lock, Mail, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login({ email, password });
      if (res.success && res.data) {
        login(res.data.accessToken, res.data.refreshToken, res.data.user);
        if (res.data.user.role === 'ROLE_ADMIN') {
          navigate('/admin');
        } else if (res.data.user.role === 'ROLE_HOST') {
          navigate('/host/events');
        } else {
          navigate('/wallet');
        }
      } else {
        setError(res.message || 'Login failed. Please verify credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Could not connect to authentication service');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-burgundy-700 border border-gold-500/50 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <ShieldCheck className="w-7 h-7 text-gold-400" />
          </div>
          <h2 className="font-editorial text-3xl font-bold text-white tracking-tight">
            Sign In to Veritix
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Anti-Scam Event Ticketing &amp; Escrow Platform
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="editorial-card p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#0B0F17] border border-[#222E40] rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0B0F17] border border-[#222E40] rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-burgundy-700 hover:bg-burgundy-600 border border-gold-500/50 text-gold-200 text-sm font-semibold shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Fast-Login Pills */}
        <div className="editorial-card p-4 text-xs space-y-2">
          <p className="font-semibold text-slate-300 font-mono text-[11px] uppercase text-center">
            One-Click Demo Credentials:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('attendee1@gmail.com')}
              className="py-1.5 px-2 rounded bg-[#0B0F17] border border-[#222E40] hover:border-gold-500/50 text-slate-300 text-[11px] truncate"
            >
              Attendee
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('host.verified@techfest.in')}
              className="py-1.5 px-2 rounded bg-[#0B0F17] border border-[#222E40] hover:border-gold-500/50 text-gold-400 text-[11px] truncate"
            >
              Host (KYC)
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('admin@antiscam.io')}
              className="py-1.5 px-2 rounded bg-[#0B0F17] border border-[#222E40] hover:border-gold-500/50 text-rose-300 text-[11px] truncate"
            >
              Admin
            </button>
          </div>
          <p className="text-[10px] text-slate-500 text-center font-mono">
            Default Password: <code className="text-gold-400">Password123!</code>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-gold-400 hover:underline font-semibold">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};
