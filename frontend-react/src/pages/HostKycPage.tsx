import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { HostProfile } from '../types';
import { ShieldCheck, Building2, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';

export const HostKycPage: React.FC = () => {
  const [profile, setProfile] = useState<HostProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [panNumber, setPanNumber] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessEntityType, setBusinessEntityType] = useState('INDIVIDUAL');
  const [kycDocumentUrl, setKycDocumentUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    api.getMyKyc()
      .then(res => {
        if (res.success && res.data) {
          setProfile(res.data);
          setPanNumber(res.data.panNumber || '');
          setBankAccountNumber(res.data.bankAccountNumber || '');
          setBankIfsc(res.data.bankIfsc || '');
          setBusinessName(res.data.businessName || '');
          setBusinessEntityType(res.data.businessEntityType || 'INDIVIDUAL');
          setKycDocumentUrl(res.data.kycDocumentUrl || '');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.submitKyc({
        panNumber,
        bankAccountNumber,
        bankIfsc,
        businessName,
        businessEntityType,
        kycDocumentUrl
      });

      if (res.success && res.data) {
        setProfile(res.data);
        setSuccessMsg('KYC information submitted. Razorpay Route linked account generated.');
      } else {
        setError(res.message || 'KYC submission failed');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to KYC service');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/40 text-gold-300 text-xs font-semibold mb-2">
          <ShieldCheck className="w-4 h-4 text-gold-400" />
          Gateway Linked Account Protocol
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Host KYC &amp; Escrow Account Onboarding
        </h1>
        <p className="text-sm text-slate-400 mt-1 leading-relaxed">
          To comply with anti-money laundering (AML) and anti-scam regulations, event organizers must register their verified PAN and bank account. A Razorpay Route Linked Account (`acc_xxx`) will be attached to receive split payouts upon 12h post-event clearance.
        </p>
      </div>

      {/* Current Status Card */}
      {profile && (
        <div className="editorial-card p-5 flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase block">Current KYC Status</span>
            <span className={`text-base font-bold font-mono ${
              profile.kycStatus === 'VERIFIED'
                ? 'text-emerald-400'
                : profile.kycStatus === 'REJECTED'
                ? 'text-rose-400'
                : 'text-amber-400'
            }`}>
              {profile.kycStatus}
            </span>
            {profile.rejectionReason && (
              <p className="text-xs text-rose-300 mt-1">Reason: {profile.rejectionReason}</p>
            )}
          </div>

          {profile.razorpayAccountId && (
            <div className="text-right font-mono text-xs">
              <span className="text-[11px] text-slate-400 uppercase block">Linked Vendor ID</span>
              <span className="text-gold-300 font-bold">{profile.razorpayAccountId}</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="editorial-card p-6 sm:p-8 space-y-6">
        <h2 className="font-editorial text-xl font-bold text-white border-b border-[#222E40] pb-3">
          Entity &amp; Settlement Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
              Business / Organizer Name
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="e.g. Apex Tech Events LLP"
              className="w-full bg-[#0B0F17] border border-[#222E40] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-gold-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
              Entity Type
            </label>
            <select
              value={businessEntityType}
              onChange={e => setBusinessEntityType(e.target.value)}
              className="w-full bg-[#0B0F17] border border-[#222E40] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-gold-500 font-mono text-xs"
            >
              <option value="INDIVIDUAL">INDIVIDUAL</option>
              <option value="PROPRIETORSHIP">PROPRIETORSHIP</option>
              <option value="PARTNERSHIP">PARTNERSHIP</option>
              <option value="PRIVATE_LIMITED">PRIVATE LIMITED</option>
              <option value="PUBLIC_LIMITED">PUBLIC LIMITED</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
              PAN Number
            </label>
            <input
              type="text"
              required
              maxLength={10}
              value={panNumber}
              onChange={e => setPanNumber(e.target.value.toUpperCase())}
              placeholder="ABCDE1234F"
              className="w-full bg-[#0B0F17] border border-[#222E40] rounded-lg px-3.5 py-2.5 text-sm text-white uppercase font-mono focus:outline-none focus:border-gold-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
              Bank Account Number
            </label>
            <input
              type="text"
              required
              value={bankAccountNumber}
              onChange={e => setBankAccountNumber(e.target.value)}
              placeholder="9182736455019"
              className="w-full bg-[#0B0F17] border border-[#222E40] rounded-lg px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-gold-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
              Bank IFSC Code
            </label>
            <input
              type="text"
              required
              maxLength={11}
              value={bankIfsc}
              onChange={e => setBankIfsc(e.target.value.toUpperCase())}
              placeholder="HDFC0000128"
              className="w-full bg-[#0B0F17] border border-[#222E40] rounded-lg px-3.5 py-2.5 text-sm text-white uppercase font-mono focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
            KYC Document Verification URL (PDF or Image)
          </label>
          <input
            type="url"
            required
            value={kycDocumentUrl}
            onChange={e => setKycDocumentUrl(e.target.value)}
            placeholder="https://storage.antiscam.io/kyc/pan_certificate.pdf"
            className="w-full bg-[#0B0F17] border border-[#222E40] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-gold-500"
          />
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            * Provide link to scanned PAN card, Certificate of Incorporation, or canceled bank cheque.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-burgundy-700 hover:bg-burgundy-600 border border-gold-500/50 text-gold-200 text-sm font-bold shadow-xl transition-all disabled:opacity-50"
        >
          {submitting ? 'Connecting with Payment Gateway...' : 'Submit KYC & Generate Linked Account'}
        </button>
      </form>
    </div>
  );
};
