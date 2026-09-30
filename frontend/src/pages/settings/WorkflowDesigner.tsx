import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GitMerge, Play, CheckCircle2, XCircle, Clock, Zap, Settings2 } from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

export default function WorkflowDesigner() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'rules' | 'logs'>('rules');

  const { data: rules = [], isLoading: loadingRules } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: async () => (await apiClient.get('/admin/automation-rules')).data.data
  });

  const { data: logs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['automation-logs'],
    queryFn: async () => (await apiClient.get('/admin/automation-logs')).data.data,
    enabled: activeTab === 'logs'
  });

  const toggleRule = useMutation({
    mutationFn: ({ id, is_enabled }: { id: string; is_enabled: boolean }) => 
      apiClient.patch(`/admin/automation-rules/${id}`, { is_enabled }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['automation-rules'] });
      toast.success('Workflow rule updated');
    },
    onError: () => toast.error('Failed to update rule')
  });

  const renderActionBadge = (action: any, index: number) => {
    switch (action.type) {
      case 'CREATE_DOCUMENT':
        return <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">File: {action.payload.type}</span>;
      case 'NOTIFY_STUDENT':
      case 'NOTIFY_SUPERVISOR':
      case 'NOTIFY_TRAINER':
        return <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium border border-amber-100">Notify: {action.type.replace('NOTIFY_', '')}</span>;
      case 'RECALCULATE_TOTALS':
        return <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium border border-purple-100">Math: Recalculate</span>;
      case 'EVALUATE_MILESTONES':
        return <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-medium border border-emerald-100">Check: Milestones</span>;
      case 'MARK_READY_FOR_REVIEW':
        return <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium border border-indigo-100">Status: Ready For Review</span>;
      default:
        return <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-700 rounded text-xs font-medium border border-gray-200">{action.type}</span>;
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <GitMerge className="w-6 h-6 text-indigo-500" />
            Workflow Automation Engine
          </h1>
          <p className="text-slate-500 mt-1">Configure event-driven automation rules across the placement lifecycle.</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'rules' 
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Active Rules
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'logs' 
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Execution Logs
        </button>
      </div>

      {activeTab === 'rules' && (
        <div className="space-y-4">
          {loadingRules ? (
            <div className="text-center p-8 text-slate-500">Loading automation rules...</div>
          ) : rules.length === 0 ? (
            <div className="card p-12 text-center text-slate-500">No automation rules configured.</div>
          ) : (
            rules.map((rule: any) => {
              let parsedActions = [];
              try { parsedActions = JSON.parse(rule.actions); } catch (e) {}

              return (
                <div key={rule.id} className={`card p-5 border-l-4 transition-colors ${rule.is_enabled ? 'border-l-indigo-500' : 'border-l-slate-300 opacity-75'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className={`w-4 h-4 ${rule.is_enabled ? 'text-amber-500' : 'text-slate-400'}`} />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{rule.name}</h3>
                      </div>
                      <p className="text-sm text-slate-500">{rule.description}</p>
                    </div>
                    <div>
                      <button
                        onClick={() => toggleRule.mutate({ id: rule.id, is_enabled: !rule.is_enabled })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          rule.is_enabled 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100' 
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100'
                        }`}
                      >
                        {rule.is_enabled ? 'Disable Rule' : 'Enable Rule'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-100 dark:border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Trigger Event</span>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                          <Play className="w-4 h-4 text-indigo-500" />
                          {rule.trigger_event}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Executed Actions</span>
                        <div className="flex flex-wrap gap-2">
                          {parsedActions.map((a: any, i: number) => renderActionBadge(a, i))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="card">
          {loadingLogs ? (
            <div className="text-center p-8 text-slate-500">Loading execution logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center p-12 text-slate-500 flex flex-col items-center">
              <Clock className="w-12 h-12 text-slate-300 mb-4" />
              <p>No automation logs found yet.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rule Executed</th>
                    <th>Entity</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id}>
                      <td className="font-medium text-slate-900 dark:text-white">
                        {log.rule_name}
                        <div className="text-xs text-slate-500 font-normal mt-0.5">{log.trigger_event}</div>
                      </td>
                      <td>
                        <span className="capitalize">{log.entity_type}</span>
                        <div className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-[120px]">{log.entity_id}</div>
                      </td>
                      <td className="text-sm text-slate-600">
                        {new Date(log.created_at).toLocaleString('en-AU')}
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                          log.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {log.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {log.status}
                        </span>
                      </td>
                      <td>
                        <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                          View Trace
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
