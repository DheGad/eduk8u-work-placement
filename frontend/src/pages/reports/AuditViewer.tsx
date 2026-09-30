import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Clock, User, Filter, AlertCircle } from 'lucide-react';
import apiClient from '@/api/client';

export default function AuditViewer() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => (await apiClient.get('/audit-logs')).data.data
  });

  return (
    <div className="page-content">
      <div className="page-header mb-8 pb-6 border-b border-slate-200 dark:border-slate-700">
        <h1 className="page-title flex items-center gap-3">
          <Shield className="w-8 h-8 text-indigo-500" />
          System Audit Logs
        </h1>
        <p className="text-slate-500 mt-2">Immutable record of all system modifications and user activities.</p>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="font-bold">Recent Activity</h2>
          <button className="btn btn-secondary text-sm py-1.5"><Filter className="w-4 h-4 mr-2" /> Filter</button>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading audit trail...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User ID</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {logs?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-slate-500">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      No audit logs found.
                    </td>
                  </tr>
                ) : (
                  logs?.map((log: any) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap font-mono text-xs text-slate-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap font-mono text-xs text-indigo-600">
                        {log.user_id ? log.user_id.substring(0, 8) + '...' : 'System'}
                      </td>
                      <td>
                        <span className="badge badge-primary bg-indigo-100 text-indigo-700 font-mono text-xs uppercase">
                          {log.action}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        <span className="text-sm font-medium">{log.entity_type}</span>
                      </td>
                      <td className="w-full">
                        <span className="text-sm">{log.description}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
