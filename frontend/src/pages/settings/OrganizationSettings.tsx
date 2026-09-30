import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Palette, Image as ImageIcon, Mail, Save, AlertCircle } from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

export default function OrganizationSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    primaryColor: '#4f46e5',
    logoUrl: '',
    emailHeader: '',
    emailFooter: '',
    customDomain: ''
  });

  // Since we don't have a direct GET /tenants/settings endpoint yet that returns just settings, 
  // we'll manage local state until save. In a real app we'd fetch current settings first.

  const mutation = useMutation({
    mutationFn: async (settings: any) => {
      return await apiClient.put('/tenants/settings', { settings });
    },
    onSuccess: () => {
      toast.success('Organization settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
    },
    onError: () => {
      toast.error('Failed to update settings');
    }
  });

  return (
    <div className="page-content max-w-4xl mx-auto">
      <div className="page-header mb-8 pb-6 border-b border-slate-200 dark:border-slate-700">
        <h1 className="page-title flex items-center gap-3">
          <Building2 className="w-8 h-8 text-indigo-500" />
          Organization Branding & Settings
        </h1>
        <p className="text-slate-500 mt-2">Customize the platform appearance and communication for your college.</p>
      </div>

      <div className="space-y-6">
        {/* Brand Identity */}
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-500" /> Brand Identity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Primary Brand Color (HEX)</label>
              <div className="flex gap-3 items-center">
                <input 
                  type="color" 
                  value={formData.primaryColor}
                  onChange={e => setFormData({...formData, primaryColor: e.target.value})}
                  className="h-10 w-10 rounded border-0 p-0 cursor-pointer"
                />
                <input 
                  type="text" 
                  value={formData.primaryColor}
                  onChange={e => setFormData({...formData, primaryColor: e.target.value})}
                  className="input flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Custom Domain Name</label>
              <input 
                type="text" 
                placeholder="e.g. placements.icqa.edu.au" 
                value={formData.customDomain}
                onChange={e => setFormData({...formData, customDomain: e.target.value})}
                className="input" 
              />
            </div>
          </div>
        </div>

        {/* Logo Configuration */}
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-500" /> Logo & Assets
          </h2>
          <div className="flex items-start gap-6">
            <div className="w-32 h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400">
              {formData.logoUrl ? <img src={formData.logoUrl} alt="Logo" className="max-w-full max-h-full p-2" /> : 'No Logo'}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Logo URL</label>
              <input 
                type="text" 
                placeholder="https://example.com/logo.png" 
                value={formData.logoUrl}
                onChange={e => setFormData({...formData, logoUrl: e.target.value})}
                className="input mb-2" 
              />
              <p className="text-sm text-slate-500">Provide a direct link to your institutional logo. Recommended size: 250x100px.</p>
            </div>
          </div>
        </div>

        {/* Email Branding */}
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-500" /> Email Branding
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Global Email Header Text</label>
              <textarea 
                rows={2} 
                className="input" 
                placeholder="e.g. ICQA Student Placements System"
                value={formData.emailHeader}
                onChange={e => setFormData({...formData, emailHeader: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Global Email Footer & Legal Disclaimer</label>
              <textarea 
                rows={3} 
                className="input" 
                placeholder="e.g. This email is intended solely for..."
                value={formData.emailFooter}
                onChange={e => setFormData({...formData, emailFooter: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            className="btn btn-primary flex items-center gap-2 px-8"
            onClick={() => mutation.mutate(formData)}
            disabled={mutation.isPending}
          >
            <Save className="w-4 h-4" /> 
            {mutation.isPending ? 'Saving...' : 'Save Organization Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
