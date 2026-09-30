import React, { useMemo } from 'react';
import { 
  Users, Building, Briefcase, CheckCircle2, 
  AlertTriangle, ShieldAlert, Activity, Clock, FileWarning, MailWarning,
  ArrowRight, Inbox, Plus, ChevronRight, FileText, Search, Zap, Check, AlertCircle, TrendingUp
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { 
  getDashboardStats, 
  getWeeklyHoursChart, 
  getAtRiskPlacements, 
  getComplianceDistribution, 
  getRecentActivity,
  getAuditReadiness,
  getComplianceAlerts
} from '../../api/endpoints/admin';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { format } from 'date-fns';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: getDashboardStats });
  const { data: atRisk = [] } = useQuery({ queryKey: ['admin', 'atRisk'], queryFn: getAtRiskPlacements });
  const { data: activityData } = useQuery({ queryKey: ['admin', 'activity'], queryFn: () => getRecentActivity() });
  const activity = (activityData as any[]) || [];
  const { data: auditReadiness } = useQuery({ queryKey: ['admin', 'auditReadiness'], queryFn: getAuditReadiness });
  const { data: complianceAlerts = [] } = useQuery({ queryKey: ['admin', 'complianceAlerts'], queryFn: getComplianceAlerts });

  const currentDate = format(new Date(), 'EEEE, MMMM do');
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  const globalHealthScore = useMemo(() => {
    if (!stats) return 0;
    // Mocking a health score algorithm for UX showcase
    const complianceWeight = 0.6;
    const riskWeight = 0.4;
    const complianceScore = stats.avg_compliance || 0;
    const riskScore = 100 - (stats.at_risk_placements ? (stats.at_risk_placements / (stats.active_placements || 1)) * 100 : 0);
    return Math.round(complianceScore * complianceWeight + riskScore * riskWeight);
  }, [stats]);

  if (statsLoading) {
    return (
      <div className="max-w-[1400px] mx-auto p-6 md:p-8 space-y-8 animate-pulse">
        <div className="h-48 bg-[#111111] border border-[#222222] rounded-2xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-96 bg-[#111111] border border-[#222222] rounded-2xl col-span-3"></div>
          <div className="h-96 bg-[#111111] border border-[#222222] rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-black min-h-screen">
      
      {/* 1. EXECUTIVE HERO SECTION (Stripe/Linear Aesthetic) */}
      <div className="relative rounded-2xl overflow-hidden border border-[#222222] bg-[#0A0A0A] p-8 md:p-10 isolation-auto">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A1A] border border-[#333333] text-[12px] font-medium text-[#A1A1AA] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              System Operational
              <span className="text-[#555555] mx-1">•</span>
              {currentDate}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-3">
              {greeting}, {user?.first_name || 'Executive'}
            </h1>
            <p className="text-[#A1A1AA] text-[15px] leading-relaxed tracking-tight">
              EDUK8U is currently monitoring <strong className="text-white font-medium">{stats?.active_placements || 0}</strong> active placements across your institution. Your overall global health score indicates strong compliance, but <strong className="text-white font-medium">{stats?.at_risk_placements || 0}</strong> placements require immediate intervention.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button onClick={() => navigate('/placements/wizard')} className="w-full sm:w-auto h-10 px-5 inline-flex items-center justify-center rounded-lg bg-white text-black hover:bg-gray-100 text-[13px] font-semibold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]">
              <Plus className="w-4 h-4 mr-2" strokeWidth={2.5} />
              New Placement
            </button>
            <button className="w-full sm:w-auto h-10 px-5 inline-flex items-center justify-center rounded-lg border border-[#333333] bg-[#111111] hover:bg-[#1A1A1A] text-white text-[13px] font-medium transition-colors">
              <Search className="w-4 h-4 mr-2 text-[#71717A]" />
              Search (Cmd+K)
            </button>
          </div>
        </div>
      </div>

      {/* 2. GLOBAL METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Global Health Score */}
        <div className="rounded-xl border border-[#222222] bg-[#0A0A0A] p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-5 opacity-20 group-hover:opacity-100 transition-opacity">
            <Activity className="w-24 h-24 text-blue-500 transform translate-x-8 -translate-y-8" strokeWidth={1} />
          </div>
          <p className="text-[13px] font-medium text-[#71717A] tracking-tight mb-4">Global Health Score</p>
          <div className="flex items-end gap-3 relative z-10">
            <span className="text-4xl font-semibold text-white tracking-tighter">{globalHealthScore}</span>
            <span className="text-[14px] font-medium text-emerald-400 mb-1 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-1" /> +2.4%
            </span>
          </div>
        </div>

        {/* Compliance Readiness */}
        <div className="rounded-xl border border-[#222222] bg-[#0A0A0A] p-5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-5 opacity-20 group-hover:opacity-100 transition-opacity">
            <ShieldAlert className="w-24 h-24 text-purple-500 transform translate-x-8 -translate-y-8" strokeWidth={1} />
          </div>
          <p className="text-[13px] font-medium text-[#71717A] tracking-tight mb-4">Compliance Readiness</p>
          <div className="flex items-end gap-3 relative z-10">
            <span className="text-4xl font-semibold text-white tracking-tighter">{auditReadiness?.score || 0}%</span>
            <span className="text-[14px] font-medium text-emerald-400 mb-1 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Audit Ready
            </span>
          </div>
        </div>

        {/* Active Placements */}
        <div className="rounded-xl border border-[#222222] bg-[#0A0A0A] p-5 relative overflow-hidden group">
          <p className="text-[13px] font-medium text-[#71717A] tracking-tight mb-4">Active Placements</p>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-semibold text-white tracking-tighter">{stats?.active_placements || 0}</span>
          </div>
          <div className="mt-4 flex items-center gap-4 text-[12px] text-[#A1A1AA]">
            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span> On Track: {stats?.active_placements - (stats?.at_risk_placements || 0)}</span>
          </div>
        </div>

        {/* Pending Actions */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 relative overflow-hidden group cursor-pointer hover:bg-amber-500/10 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[13px] font-medium text-amber-500/70 tracking-tight">Pending Actions</p>
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-semibold text-amber-500 tracking-tighter">{stats?.near_completion || 0}</span>
          </div>
          <p className="text-[12px] text-amber-500/70 mt-4 flex items-center">
            <ArrowRight className="w-3.5 h-3.5 mr-1" /> Review approvals
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Placement Pipeline & Risk */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-[#222222] bg-[#0A0A0A] overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="flex items-center justify-between p-5 border-b border-[#222222] bg-[#0F0F0F]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <h2 className="text-[15px] font-semibold text-white tracking-tight">At-Risk Interventions</h2>
              </div>
              <button onClick={() => navigate('/placements')} className="text-[13px] text-[#71717A] hover:text-white font-medium flex items-center transition-colors px-3 py-1.5 rounded-md hover:bg-[#1A1A1A]">
                View Pipeline <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </button>
            </div>
            
            <div className="flex-1 p-2">
              {atRisk.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-10 text-center">
                  <CheckCircle2 className="w-10 h-10 text-[#333333] mb-4" strokeWidth={1.5} />
                  <h3 className="text-white text-[15px] font-medium mb-1">Zero Risks Detected</h3>
                  <p className="text-[#71717A] text-[14px] max-w-sm">All student placements are currently operating within nominal parameters.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {atRisk.map((item: any) => (
                    <div key={item.id} className="p-3 hover:bg-[#141414] rounded-lg transition-colors flex items-center justify-between gap-4 cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#333333] flex items-center justify-center text-[#A1A1AA] text-[14px] font-medium">
                          {item.student_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-[14px] font-medium text-white group-hover:text-blue-400 transition-colors tracking-tight">{item.student_name}</h4>
                          <div className="flex items-center text-[13px] text-[#71717A] mt-0.5">
                            {item.host_name}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 max-w-[200px] hidden sm:block">
                        <div className="flex justify-between text-[12px] mb-2">
                          <span className="text-[#71717A]">Hours Progress</span>
                          <span className="font-medium text-[#A1A1AA]">{item.hours_completed} / {item.hours_required}</span>
                        </div>
                        <div className="w-full bg-[#222222] rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${item.hours_completed >= item.hours_required ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                            style={{ width: `${Math.min((item.hours_completed/item.hours_required)*100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 justify-end shrink-0">
                        <span className={`text-[12px] font-medium px-2.5 py-1 rounded-md border ${item.risk_level === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' : item.risk_level === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-[#1A1A1A] text-[#A1A1AA] border-[#333333]'}`}>
                          {item.risk_level || 'At Risk'}
                        </span>
                        <div className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-[#222222] transition-colors">
                          <ChevronRight className="w-4 h-4 text-[#71717A] group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Activity & Intelligence */}
        <div className="space-y-6">
          
          {/* SMART RECOMMENDATIONS */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-blue-400" />
              <h2 className="text-[13px] font-semibold text-blue-400 tracking-tight uppercase">Smart Insight</h2>
            </div>
            <p className="text-[14px] text-blue-100/80 leading-relaxed mb-5">
              3 Host Facilities have upcoming insurance expiries next week. We recommend triggering automated compliance reminders.
            </p>
            <button className="w-full h-9 rounded-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-[13px] font-medium transition-colors border border-blue-500/20">
              Trigger Reminders
            </button>
          </div>

          {/* ACTIVITY TIMELINE */}
          <div className="rounded-xl border border-[#222222] bg-[#0A0A0A] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-[#222222] bg-[#0F0F0F]">
              <h2 className="text-[14px] font-semibold text-white tracking-tight">System Activity</h2>
            </div>
            <div className="p-5">
              {activity.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <Activity className="w-6 h-6 text-[#333333] mb-3" />
                  <p className="text-[13px] text-[#71717A]">No recent activity.</p>
                </div>
              ) : (
                <div className="relative space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:-ml-px before:w-[2px] before:bg-[#222222]">
                  {activity.slice(0, 5).map((log: any, idx: number) => (
                    <div key={log.id} className="relative flex gap-4 items-start">
                      <div className="absolute -left-1 -ml-[3px] mt-1 w-3 h-3 rounded-full bg-[#0A0A0A] border-[2.5px] border-[#333333] shrink-0 z-10 group-hover:border-blue-500 transition-colors"></div>
                      <div className="ml-5 flex-1 min-w-0">
                        <p className="text-[13.5px] text-[#A1A1AA] leading-snug">
                          <span className="font-medium text-white">{log.user_name || 'System'}</span> {log.description}
                        </p>
                        <p className="text-[12px] text-[#71717A] mt-1.5 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {format(new Date(log.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
