import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SystemSetting } from '../types';
import { Settings, Save, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [settingsList, setSettingsList] = useState<SystemSetting[]>([]);
  const [editValues, setEditValues] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successKey, setSuccessKey] = useState<string | null>(null);

  const fetchSettings = () => {
    setLoading(true);
    api.getSettings()
      .then(res => {
        if (res.success && res.data) {
          setSettingsList(res.data);
          const map: { [key: string]: string } = {};
          res.data.forEach(s => {
            map[s.settingKey] = s.settingValue;
          });
          setEditValues(map);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (key: string) => {
    setSavingKey(key);
    setError(null);
    setSuccessKey(null);

    const val = editValues[key];
    try {
      const res = await api.updateSetting(key, val);
      if (res.success) {
        setSuccessKey(key);
        fetchSettings();
      } else {
        setError(res.message || 'Failed to update setting');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222E40] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/40 text-gold-300 text-xs font-semibold mb-2">
            <Settings className="w-4 h-4 text-gold-400" />
            Dynamic Runtime Parameters
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            System Configuration Panel
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Zero Hardcoding Constraint: Modify commission percentages, escrow hold duration, geofence radius, and dispute ratios in PostgreSQL live without restarting servers.
          </p>
        </div>

        <button
          onClick={fetchSettings}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#131A26] border border-[#222E40] text-xs font-mono text-slate-300 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reload Settings
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400 font-mono">Loading database settings...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {settingsList.map(item => (
            <div key={item.settingKey} className="editorial-card p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-gold-300 font-bold text-sm">
                    {item.settingKey}
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  Last updated by: {item.updatedBy}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={editValues[item.settingKey] || ''}
                  onChange={e => setEditValues({ ...editValues, [item.settingKey]: e.target.value })}
                  className="flex-1 bg-[#0B0F17] border border-[#222E40] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-gold-500"
                />

                <button
                  type="button"
                  disabled={savingKey === item.settingKey}
                  onClick={() => handleSave(item.settingKey)}
                  className="px-4 py-2 rounded-lg bg-burgundy-700 hover:bg-burgundy-600 text-gold-200 border border-gold-500/40 text-xs font-semibold font-mono flex items-center gap-1.5 shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingKey === item.settingKey ? 'Saving...' : 'Apply Live'}
                </button>
              </div>

              {successKey === item.settingKey && (
                <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Updated in system_settings table!
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
