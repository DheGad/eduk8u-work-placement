import React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Database, Server, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';

const DEFAULT_MODULES = [
  { name: 'Authentication & Sessions', status: 'complete', notes: 'JWT, Role-based routing, Refresh token rotation' },
  { name: 'RBAC Permission Engine', status: 'complete', notes: 'Granular permissions, UI Guards, middleware' },
  { name: 'Placement Workflow', status: 'complete', notes: 'Wizard, Drafts, Host Approval Journey' },
  { name: 'Document Vault & Signatures', status: 'complete', notes: 'Digital signatures with audit trail' },
  { name: 'Audit Logging', status: 'complete', notes: 'Immutable trail with Before/After diffs' },
  { name: 'Notification Hub', status: 'complete', notes: 'In-App & Email routing' },
  { name: 'Users & Tenants Module', status: 'complete', notes: 'CRUD, Approval workflow, Multi-tenancy' },
  { name: 'LMS Connectors', status: 'pending', notes: 'Schema ready. API mapping pending.' },
  { name: 'Billing Integration', status: 'blocked', notes: 'Stripe API keys required.' },
];

export default function ReadinessReport() {
  const { data: platformMetrics } = useQuery({
    queryKey: ['admin', 'platform-metrics'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/platform-metrics');
      return (res.data as any)?.data;
    },
    retry: false,
  });

  const modules = DEFAULT_MODULES;
  const readinessScore = Math.round((modules.filter(m => m.status === 'complete').length / modules.length) * 100);

  return (
    <div className="page-content max-w-5xl mx-auto">
      <div className="page-header mb-8 pb-6 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-500" />
            Enterprise Production Readiness Report
          </h1>
          <p className="text-slate-500 mt-2 text-lg">System Audit &amp; SaaS Deployment Capability</p>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-sm text-slate-500 font-medium">Generated</div>
          <div className="text-lg font-bold text-slate-800 dark:text-slate-200">{new Date().toLocaleDateString('en-AU')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 border-l-4 border-l-emerald-500">
          <h3 className="font-bold text-emerald-900 mb-2">Readiness Score</h3>
          <p className="text-4xl font-black text-emerald-600">{readinessScore}%</p>
        </div>
        <div className="card p-6 border-l-4 border-l-indigo-500">
          <h3 className="font-bold text-indigo-900 mb-2">Completed</h3>
          <p className="text-3xl font-black text-indigo-600">{modules.filter(m => m.status === 'complete').length}</p>
          <p className="text-sm text-indigo-700 mt-2">Core Enterprise Modules</p>
        </div>
        {platformMetrics && (
          <div className="card p-6 border-l-4 border-l-blue-500">
            <h3 className="font-bold text-blue-900 mb-2">Active Tenants</h3>
            <p className="text-3xl font-black text-blue-600">{platformMetrics.activeTenants ?? 0}</p>
            <p className="text-sm text-blue-700 mt-2">Live organisations</p>
          </div>
        )}
        <div className="card p-6 border-l-4 border-l-red-500">
          <h3 className="font-bold text-red-900 mb-2">Blocked</h3>
          <p className="text-3xl font-black text-red-600">{modules.filter(m => m.status === 'blocked').length}</p>
          <p className="text-sm text-red-700 mt-2">External dependencies</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> Module Completion Checklist</h2>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {modules.map((m, i) => (
            <li key={i} className="p-4 flex items-start gap-3">
              <div className="mt-1">
                {m.status === 'complete' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {m.status === 'pending' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                {m.status === 'blocked' && <XCircle className="w-5 h-5 text-red-500" />}
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-white">{m.name}</div>
                <div className="text-sm text-slate-500">{m.notes}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
