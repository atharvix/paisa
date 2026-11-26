import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ShieldCheck, User, Lock, Mail, Phone, AlertCircle } from 'lucide-react';
import { Role } from '../types';

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('ROLE_ATTENDEE');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.register({
        email,
        password,
        fullName,
        phone,
        role
      });
      if (res.success && res.data) {
        login(res.data.accessToken, res.data.refreshToken, res.data.user);
        if (role === 'ROLE_HOST') {
          navigate('/host/kyc');
        } else {
          navigate('/wallet');
        }
      } else {
        setError(res.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-burgundy-700 border border-gold-500/50 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <ShieldCheck className="w-7 h-7 text-gold-400" />
          </div>
          <h2 className="font-editorial text-3xl font-bold text-white tracking-tight">
            Create an Account
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Join the Anti-Scam Event Ticketing Protocol
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
              Account Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('ROLE_ATTENDEE')}
                className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                  role === 'ROLE_ATTENDEE'
                    ? 'bg-burgundy-700 text-gold-300 border-gold-500/60 shadow-md'
                    : 'bg-[#0B0F17] text-slate-400 border-[#222E40]'
                }`}
              >
                Event Attendee
              </button>
              <button
                type="button"
                onClick={() => setRole('ROLE_HOST')}
                className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                  role === 'ROLE_HOST'
                    ? 'bg-burgundy-700 text-gold-300 border-gold-500/60 shadow-md'
                    : 'bg-[#0B0F17] text-slate-400 border-[#222E40]'
                }`}
              >
                Event Organizer
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
              Full Legal Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Aarav Sharma"
                className="w-full bg-[#0B0F17] border border-[#222E40] rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>

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
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-[#0B0F17] border border-[#222E40] rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
              Password (Min 8 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={8}
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
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-gold-400 hover:underline font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
