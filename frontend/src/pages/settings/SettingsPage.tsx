import React, { useState } from 'react';
import { Settings, Lock, User, Bell, Shield, Save, Check } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useMutation } from '@tanstack/react-query';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  const [saved, setSaved] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: () => apiClient.post('/auth/change-password', {
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password,
    }),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Failed to change password'),
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  function validateAndSubmitPassword() {
    if (!passwordForm.current_password || !passwordForm.new_password) {
      return toast.error('All fields are required');
    }
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      return toast.error('New passwords do not match');
    }
    if (passwordForm.new_password.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }
    changePasswordMutation.mutate();
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>Manage your account and platform preferences</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem' }}>
        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '0.625rem 0.875rem',
                  borderRadius: 8, background: isActive ? 'rgba(99,102,241,0.1)' : 'none',
                  border: `1px solid ${isActive ? 'rgba(99,102,241,0.2)' : 'transparent'}`,
                  color: isActive ? 'var(--color-primary-400)' : 'var(--text-muted)',
                  cursor: 'pointer', fontWeight: isActive ? 600 : 400, fontSize: '0.875rem',
                  textAlign: 'left', width: '100%', transition: 'all 0.15s',
                }}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="card">
          {activeTab === 'profile' && (
            <div>
              <h2 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Profile Information</h2>
              <div style={{ display: 'grid', gap: '1rem', maxWidth: 480 }}>
                <div className="input-group">
                  <label className="input-label">First Name</label>
                  <input className="input" defaultValue={user?.first_name} readOnly style={{ background: 'var(--surface-input-disabled, rgba(255,255,255,0.03))' }} />
                </div>
                <div className="input-group">
                  <label className="input-label">Last Name</label>
                  <input className="input" defaultValue={user?.last_name} readOnly style={{ background: 'var(--surface-input-disabled, rgba(255,255,255,0.03))' }} />
                </div>
                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <input className="input" type="email" defaultValue={user?.email} readOnly style={{ background: 'var(--surface-input-disabled, rgba(255,255,255,0.03))' }} />
                </div>
                <div className="input-group">
                  <label className="input-label">Role</label>
                  <input className="input" defaultValue={user?.role?.replace(/_/g, ' ')} readOnly style={{ background: 'var(--surface-input-disabled, rgba(255,255,255,0.03))', textTransform: 'capitalize' }} />
                </div>
                <div className="input-group">
                  <label className="input-label">Organisation</label>
                  <input className="input" defaultValue={user?.tenant?.name || 'Your Organisation'} readOnly style={{ background: 'var(--surface-input-disabled, rgba(255,255,255,0.03))' }} />
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Profile details are managed by your administrator. Contact support to update.</p>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Change Password</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Use a strong password with at least 8 characters.</p>
              <div style={{ display: 'grid', gap: '1rem', maxWidth: 420 }}>
                <div className="input-group">
                  <label className="input-label">Current Password</label>
                  <input
                    className="input" type="password"
                    value={passwordForm.current_password}
                    onChange={e => setPasswordForm(f => ({ ...f, current_password: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">New Password</label>
                  <input
                    className="input" type="password"
                    value={passwordForm.new_password}
                    onChange={e => setPasswordForm(f => ({ ...f, new_password: e.target.value }))}
                    placeholder="At least 8 characters"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Confirm New Password</label>
                  <input
                    className="input" type="password"
                    value={passwordForm.new_password_confirmation}
                    onChange={e => setPasswordForm(f => ({ ...f, new_password_confirmation: e.target.value }))}
                    placeholder="Re-enter new password"
                  />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={validateAndSubmitPassword}
                  disabled={changePasswordMutation.isPending}
                  style={{ width: 'fit-content' }}
                >
                  {changePasswordMutation.isPending ? 'Updating…' : 'Update Password'}
                </button>
              </div>

              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--surface-border)' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9375rem' }}>Session Security</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Your session uses JWT tokens with automatic refresh. Sessions expire after 8 hours of inactivity.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Active session · Secure</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Notification Preferences</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Control what events trigger alerts in the Compliance Centre.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { label: 'Missing Agreement Alert', desc: 'Alert when a placement has no signed tripartite agreement', default: true },
                  { label: 'Hours Behind Schedule', desc: 'Alert when a student is more than 10 hours behind schedule', default: true },
                  { label: 'Missing Evidence Alert', desc: 'Alert when no documents have been uploaded after 40 hours', default: true },
                  { label: 'Supervisor Unverified', desc: 'Alert when an assigned supervisor is not CA 0395 verified', default: true },
                  { label: 'Placement Near Completion', desc: 'Alert when a student reaches 100+ hours', default: false },
                ].map(pref => (
                  <div key={pref.label} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', padding: '0.875rem 0', borderBottom: '1px solid var(--surface-border)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{pref.label}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>{pref.desc}</div>
                    </div>
                    <label style={{ position: 'relative', width: 40, height: 22, flexShrink: 0, cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked={pref.default} style={{ display: 'none' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(99,102,241,0.7)', borderRadius: 11, transition: 'background 0.2s' }} />
                      <div style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', background: 'white', top: 3, left: 3, transition: 'left 0.2s' }} />
                    </label>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: 'fit-content' }} onClick={() => toast.success('Notification preferences saved')}>
                <Save size={16} /> Save Preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
