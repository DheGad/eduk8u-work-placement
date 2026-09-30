import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Mail, Smartphone, ShieldAlert, CheckCircle2, Save } from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

export default function NotificationHub() {
  const queryClient = useQueryClient();
  const [prefs, setPrefs] = useState({
    email_enabled: true,
    in_app_enabled: true,
    compliance_alerts: true,
    placement_alerts: true
  });

  const { data, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => (await apiClient.get('/users/notifications/preferences')).data.preferences
  });

  useEffect(() => {
    if (data) setPrefs(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (updatedPrefs: any) => {
      return await apiClient.put('/users/notifications/preferences', updatedPrefs);
    },
    onSuccess: () => {
      toast.success('Notification preferences saved');
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
    onError: () => toast.error('Failed to save preferences')
  });

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading preferences...</div>;

  return (
    <div className="page-content max-w-4xl mx-auto">
      <div className="page-header mb-8 pb-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-end">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Bell className="w-8 h-8 text-indigo-500" />
            Notification Hub
          </h1>
          <p className="text-slate-500 mt-2">Manage how and when you receive alerts from EDUK8U.</p>
        </div>
        <button 
          className="btn btn-primary flex items-center gap-2"
          onClick={() => mutation.mutate(prefs)}
          disabled={mutation.isPending}
        >
          <Save className="w-4 h-4" /> {mutation.isPending ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Delivery Methods */}
        <div className="card overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-500" /> Delivery Methods
            </h2>
          </div>
          <div className="p-0">
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              <li className="p-6 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" /> Email Notifications
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Receive daily summaries and critical alerts via email.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={prefs.email_enabled} onChange={e => setPrefs({...prefs, email_enabled: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                </label>
              </li>
              <li className="p-6 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-slate-400" /> In-App Notifications
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Receive real-time popups and dashboard alerts.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={prefs.in_app_enabled} onChange={e => setPrefs({...prefs, in_app_enabled: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                </label>
              </li>
            </ul>
          </div>
        </div>

        {/* Alert Types */}
        <div className="card overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-500" /> Alert Subscriptions
            </h2>
          </div>
          <div className="p-0">
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              <li className="p-6 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-500" /> Compliance Alerts
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Missing documents, overdue signatures, expired checks.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={prefs.compliance_alerts} onChange={e => setPrefs({...prefs, compliance_alerts: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                </label>
              </li>
              <li className="p-6 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Placement Milestones
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">120-hour progress (25%, 50%, 75%, completion).</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={prefs.placement_alerts} onChange={e => setPrefs({...prefs, placement_alerts: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                </label>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
