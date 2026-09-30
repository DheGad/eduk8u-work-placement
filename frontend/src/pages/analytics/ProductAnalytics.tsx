import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Users, AlertCircle, Calendar, Clock, Download } from 'lucide-react';
import apiClient from '@/api/client';
import { format } from 'date-fns';

export default function ProductAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-metrics'],
    queryFn: async () => (await apiClient.get('/analytics/metrics')).data
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading analytics...</div>;
  }

  const metrics = data?.metrics || {
    activePlacements: 0,
    atRiskStudents: 0,
    complianceScore: 0,
    globalHealthScore: 0,
  };

  const activity = data?.activity || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-500" />
            Product Analytics
          </h1>
          <p className="text-[13px] text-[#A1A1AA] mt-1">
            Real-time platform usage and performance metrics.
          </p>
        </div>
        <button className="btn btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Platform Health', value: `${metrics.globalHealthScore}%`, icon: TrendingUp, color: 'text-emerald-500' },
          { label: 'Active Workflows', value: metrics.activePlacements, icon: Clock, color: 'text-indigo-500' },
          { label: 'Compliance Score', value: `${metrics.complianceScore}%`, icon: Users, color: 'text-blue-500' },
          { label: 'At-Risk Cases', value: metrics.atRiskStudents, icon: AlertCircle, color: 'text-amber-500' },
        ].map((stat, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center gap-3 mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <h3 className="text-[13px] font-medium text-[#A1A1AA]">{stat.label}</h3>
            </div>
            <p className="text-2xl font-bold tracking-tight text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-0 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#222222] bg-[#0F0F0F]">
            <h2 className="font-semibold text-[14px] text-white">Usage Trends (30 Days)</h2>
          </div>
          <div className="flex-1 p-6 flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <BarChart3 className="w-10 h-10 text-[#333333] mx-auto mb-3" />
              <p className="text-[13px] text-[#A1A1AA]">Chart visualization will be rendered here.</p>
            </div>
          </div>
        </div>

        <div className="card p-0 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#222222] bg-[#0F0F0F]">
            <h2 className="font-semibold text-[14px] text-white">Recent Activity Log</h2>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[300px]">
            {activity.length === 0 ? (
              <div className="p-6 text-center text-[#71717A] text-[13px]">No recent activity recorded.</div>
            ) : (
              <div className="divide-y divide-[#222222]">
                {activity.map((log: any, i: number) => (
                  <div key={i} className="p-4 hover:bg-[#111111] transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[13px] font-medium text-white capitalize">{log.action.replace('_', ' ')}</span>
                      <span className="text-[11px] text-[#71717A] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(log.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#A1A1AA] leading-snug">{log.description}</p>
                    <span className="inline-block mt-2 text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                      {log.entity_type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
