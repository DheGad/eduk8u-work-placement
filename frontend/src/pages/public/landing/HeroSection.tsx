import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, ShieldCheck, FileText, Clock, CheckCircle2, AlertTriangle,
  ArrowRight, LayoutDashboard, BookOpen, UserCircle, Briefcase, Star
} from 'lucide-react';

const PORTALS = [
  {
    id: 'admin',
    label: 'Admin',
    icon: LayoutDashboard,
    color: 'bg-indigo-600',
    badge: 'Executive',
    preview: <AdminPreview />,
  },
  {
    id: 'student',
    label: 'Student',
    icon: UserCircle,
    color: 'bg-violet-600',
    badge: 'Mobile App',
    preview: <StudentPreview />,
  },
  {
    id: 'trainer',
    label: 'Trainer',
    icon: BookOpen,
    color: 'bg-sky-600',
    badge: 'Compliance',
    preview: <TrainerPreview />,
  },
  {
    id: 'supervisor',
    label: 'Supervisor',
    icon: Users,
    color: 'bg-emerald-600',
    badge: 'Approvals',
    preview: <SupervisorPreview />,
  },
  {
    id: 'host',
    label: 'Host',
    icon: Briefcase,
    color: 'bg-amber-600',
    badge: 'Agreements',
    preview: <HostPreview />,
  },
];

export default function HeroSection() {
  const navigate = useNavigate();
  const [activePortal, setActivePortal] = useState(0);

  // Auto-rotate portals
  useEffect(() => {
    const timer = setInterval(() => {
      setActivePortal(p => (p + 1) % PORTALS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const portal = PORTALS[activePortal];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col pt-16">

      {/* ─── TOP STAT TICKER ────────────────────────────────────────── */}
      <div className="bg-indigo-600/20 border-b border-indigo-500/20 px-4 py-2 flex items-center justify-center gap-8 text-xs font-semibold text-indigo-300 overflow-hidden">
        {[
          { label: 'Active Placements', value: '1,248' },
          { label: 'ASQA Compliance', value: '99.2%' },
          { label: 'Audit Packs Generated', value: '3,841' },
          { label: 'RTOs on Platform', value: '24' },
          { label: 'Hours Tracked Today', value: '9,320' },
        ].map((s, i) => (
          <span key={i} className="flex items-center gap-2 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-indigo-400">{s.label}:</span>
            <span className="text-white font-bold">{s.value}</span>
          </span>
        ))}
      </div>

      {/* ─── MAIN HERO SPLIT LAYOUT ─────────────────────────────────── */}
      <div className="flex-1 max-w-[1400px] mx-auto w-full px-6 lg:px-10 py-10 flex flex-col lg:flex-row gap-10 items-center">

        {/* ╔══════════════════════════════╗
            ║   LEFT COLUMN — PITCH        ║
            ╚══════════════════════════════╝ */}
        <div className="w-full lg:w-[45%] shrink-0 flex flex-col gap-7">

          {/* Eyebrow badge */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-widest uppercase">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
              ASQA-Certified Platform for Australian RTOs
            </div>
          </div>

          {/* Headline */}
          <div>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-[1.08] tracking-tight">
              The Intelligence<br />
              Operating System<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-violet-400">
                for Work Placements.
              </span>
            </h1>
            <p className="mt-5 text-slate-300 text-base lg:text-lg leading-relaxed max-w-lg">
              Manage <strong className="text-white">1,200+ students</strong>, automate ASQA compliance, collect digital signatures, and generate a complete audit pack in one click.
            </p>
          </div>

          {/* Role Cards — what each user sees */}
          <div className="grid grid-cols-5 gap-2">
            {PORTALS.map((p, idx) => {
              const Icon = p.icon;
              const isActive = idx === activePortal;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePortal(idx)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center transition-all duration-300 ${
                    isActive
                      ? 'bg-white/10 border-white/30 scale-105 shadow-lg shadow-indigo-900/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${p.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>
                    {p.label}
                  </span>
                  {isActive && (
                    <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider">
                      {p.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Key Proof Points */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: ShieldCheck, label: 'ASQA Audit Ready', sub: 'One-click audit pack', color: 'text-emerald-400' },
              { icon: Clock, label: '120-Hour Tracking', sub: 'GPS-stamped timesheets', color: 'text-blue-400' },
              { icon: FileText, label: 'Digital Signatures', sub: 'Tripartite agreements', color: 'text-indigo-400' },
              { icon: AlertTriangle, label: 'Risk Intelligence', sub: 'At-risk alerts in real time', color: 'text-amber-400' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-3.5">
                <item.icon className={`w-5 h-5 ${item.color} shrink-0 mt-0.5`} />
                <div>
                  <div className="text-white font-bold text-sm">{item.label}</div>
                  <div className="text-slate-400 text-xs mt-0.5">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-all shadow-xl shadow-indigo-900/60 hover:scale-105"
            >
              Start Free Pilot <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-all"
            >
              Sign In
            </button>
          </div>

          {/* Social Proof */}
          <div className="flex items-center gap-4 pt-2 border-t border-white/10">
            <div className="flex -space-x-2">
              {['SJ', 'MC', 'EW', 'LT'].map((init, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 border-2 border-slate-900 flex items-center justify-center text-white text-[10px] font-bold">
                  {init}
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-400">
              <div className="flex items-center gap-1 mb-0.5">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
              </div>
              Trusted by <strong className="text-white">24 RTOs</strong> across Australia
            </div>
          </div>

        </div>

        {/* ╔══════════════════════════════╗
            ║   RIGHT COLUMN — LIVE DEMO   ║
            ╚══════════════════════════════╝ */}
        <div className="w-full lg:flex-1 flex flex-col gap-4">

          {/* Browser Chrome */}
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 bg-slate-800">

            {/* Browser Bar */}
            <div className="bg-slate-900 px-4 py-2.5 flex items-center gap-3 border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 bg-slate-800 border border-white/10 rounded-md px-3 py-1 text-xs text-slate-400 font-mono flex items-center gap-2">
                <span className="text-emerald-400">🔒</span>
                app.eduk8u.com/{portal.id}
              </div>
              <div className="text-[10px] text-indigo-400 font-bold bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-full uppercase tracking-widest">
                LIVE DEMO
              </div>
            </div>

            {/* Portal Switcher Tabs */}
            <div className="flex bg-slate-900/50 border-b border-white/5">
              {PORTALS.map((p, idx) => {
                const Icon = p.icon;
                const isActive = idx === activePortal;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActivePortal(idx)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold transition-all duration-300 border-b-2 ${
                      isActive
                        ? 'text-white border-indigo-500 bg-white/5'
                        : 'text-slate-500 border-transparent hover:text-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{p.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Live Portal Preview */}
            <div className="bg-slate-50 min-h-[420px] overflow-hidden">
              <div key={activePortal} className="animate-in fade-in slide-in-from-right-4 duration-500 h-full">
                {portal.preview}
              </div>
            </div>

          </div>

          {/* Below browser — 3 quick stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: '99.2%', label: 'Audit Readiness', sub: 'Across all campuses', color: 'from-emerald-600 to-emerald-700' },
              { value: '< 2min', label: 'Audit Pack Time', sub: 'Was 3 weeks manually', color: 'from-indigo-600 to-indigo-700' },
              { value: '500+', label: 'Hours Saved/Year', sub: 'Per college cohort', color: 'from-violet-600 to-violet-700' },
            ].map((s, i) => (
              <div key={i} className={`bg-gradient-to-br ${s.color} rounded-xl p-4 text-white`}>
                <div className="text-2xl font-black">{s.value}</div>
                <div className="text-xs font-bold text-white/90 mt-1">{s.label}</div>
                <div className="text-[10px] text-white/60 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Portal Previews ─────────────────────────────────────────────────────────

function AdminPreview() {
  return (
    <div className="p-5 h-full flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-black text-slate-900 text-base">Executive Dashboard</h3>
          <p className="text-xs text-slate-500 font-medium">ICQA — Brisbane Campus</p>
        </div>
        <button className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Download Audit Pack</button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Health Score', value: '92%', sub: '1,248 placements', color: 'indigo' },
          { label: 'Compliance', value: '88%', sub: 'Signatures tracked', color: 'emerald' },
          { label: 'At-Risk', value: '14', sub: 'Behind on hours', color: 'amber' },
          { label: 'Audit Ready', value: '99%', sub: 'ASQA compliant', color: 'violet' },
        ].map((m, i) => (
          <div key={i} className={`bg-${m.color}-50 border border-${m.color}-100 rounded-xl p-3`}>
            <div className={`text-2xl font-black text-${m.color}-700`}>{m.value}</div>
            <div className="text-xs font-bold text-slate-700 mt-1">{m.label}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex-1">
        <div className="px-4 py-2.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <span className="font-bold text-slate-700 text-sm">Live Placements</span>
          <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">1,248 Active</span>
        </div>
        {[
          { name: 'Sarah Jenkins', course: 'Cert III Early Childhood', host: 'Goodstart (Brisbane)', pct: 80, status: 'On Track', sc: 'emerald' },
          { name: 'Liam Smith', course: 'Diploma of Nursing', host: 'Opal HealthCare', pct: 10, status: 'Lagging', sc: 'amber' },
          { name: 'Emma Nguyen', course: 'Cert IV Aged Care', host: 'BlueCare (Springwood)', pct: 100, status: 'Ready', sc: 'violet' },
        ].map((r, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs shrink-0">
              {r.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">{r.name}</div>
              <div className="text-xs text-slate-400">{r.host}</div>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-1">
              <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className={`h-full bg-${r.sc}-500 rounded-full`} style={{ width: `${r.pct}%` }} />
              </div>
              <span className="text-[10px] text-slate-400">{r.pct}% hours</span>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md bg-${r.sc}-50 text-${r.sc}-700 border border-${r.sc}-100`}>
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentPreview() {
  return (
    <div className="flex items-center justify-center py-8 h-full bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden border-4 border-slate-300">
        <div className="bg-indigo-600 px-5 py-6 text-white">
          <div className="text-xs font-bold text-indigo-200 mb-1">Hi, Sarah 👋</div>
          <div className="text-lg font-black">BlueCare Springwood</div>
          <div className="text-indigo-200 text-xs">Cert III Aged Care • 2026</div>
        </div>
        <div className="p-4 bg-slate-50 flex flex-col gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Hours Logged</div>
            <div className="text-4xl font-black text-indigo-700">96</div>
            <div className="text-xs text-slate-400 mb-3">out of 120 required</div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '80%' }} />
            </div>
          </div>
          <button className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl text-sm flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" /> Log Shift Now
          </button>
          <div className="space-y-2">
            {[
              { date: 'Today, 9:00 AM', hrs: '8 hrs', status: 'Approved', c: 'emerald' },
              { date: 'Yesterday', hrs: '8 hrs', status: 'Pending', c: 'amber' },
            ].map((l, i) => (
              <div key={i} className={`bg-white border border-${l.c}-100 border-l-4 border-l-${l.c}-500 rounded-lg p-3 flex justify-between items-center`}>
                <div>
                  <div className="text-xs font-bold text-slate-900">{l.date}</div>
                  <div className="text-[10px] text-slate-400">{l.hrs} • Aged Care Ward</div>
                </div>
                <span className={`text-[9px] font-black bg-${l.c}-50 text-${l.c}-700 px-1.5 py-0.5 rounded`}>{l.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrainerPreview() {
  return (
    <div className="p-5 flex flex-col gap-4 h-full">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-black text-slate-900 text-base">Trainer Portal</h3>
          <p className="text-xs text-slate-500">Monitor students, log visits, track compliance</p>
        </div>
        <button className="text-xs bg-sky-600 text-white font-bold px-3 py-1.5 rounded-lg">Log Visit</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { name: 'Sarah Jenkins', course: 'Cert III EC', pct: 80, journal: 'Submitted', risk: 'Low', rc: 'emerald' },
          { name: 'Liam Smith', course: 'Dip. Nursing', pct: 10, journal: 'Overdue', risk: 'HIGH', rc: 'red' },
          { name: 'Emma Nguyen', course: 'Cert IV Aged', pct: 100, journal: 'Submitted', risk: 'None', rc: 'emerald' },
          { name: 'Mark Taylor', course: 'Cert III HC', pct: 55, journal: 'Submitted', risk: 'Medium', rc: 'amber' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-black">{s.name[0]}</div>
              <div>
                <div className="text-xs font-bold text-slate-900">{s.name}</div>
                <div className="text-[10px] text-slate-400">{s.course}</div>
              </div>
            </div>
            <div className="space-y-1.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Hours</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-12 bg-slate-100 rounded-full h-1 overflow-hidden">
                    <div className="bg-sky-500 h-1 rounded-full" style={{ width: `${s.pct}%` }} />
                  </div>
                  <span className="font-bold text-slate-700">{s.pct}%</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Journal</span>
                <span className={`font-bold text-${s.rc}-600`}>{s.journal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Risk</span>
                <span className={`font-black text-${s.rc}-700 bg-${s.rc}-50 px-1.5 py-0.5 rounded text-[9px]`}>{s.risk}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SupervisorPreview() {
  return (
    <div className="p-5 flex flex-col gap-4 h-full">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-black text-slate-900 text-base">Supervisor Portal</h3>
          <p className="text-xs text-slate-500">Review & approve student timesheets</p>
        </div>
        <span className="text-xs bg-emerald-100 text-emerald-700 font-black px-2 py-1 rounded-lg border border-emerald-200">2 Pending</span>
      </div>

      {[
        { name: 'Sarah Jenkins', date: 'Today, 9:00 AM', hours: 8, notes: 'Assisted with morning rounds, medication prep and vital sign recording in Ward 3.', urgent: false },
        { name: 'Mark Taylor', date: 'Yesterday', hours: 6.5, notes: 'Shadowed senior nurse during patient intake. Excellent observation skills.', urgent: true },
      ].map((a, i) => (
        <div key={i} className={`bg-white border rounded-xl p-4 shadow-sm ${a.urgent ? 'border-amber-200 border-l-4 border-l-amber-500' : 'border-slate-200 border-l-4 border-l-emerald-500'}`}>
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="font-black text-slate-900 text-sm">{a.name}</div>
              <div className="text-xs text-slate-400">{a.date}</div>
            </div>
            <div className="bg-indigo-50 text-indigo-700 text-xs font-black px-2.5 py-1 rounded-lg border border-indigo-100">
              {a.hours} hrs
            </div>
          </div>
          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-3 leading-relaxed">
            "{a.notes}"
          </p>
          <div className="flex gap-2">
            <button className="flex-1 bg-emerald-600 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-700 transition-colors">
              <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Sign
            </button>
            <button className="flex-1 bg-slate-100 text-slate-600 font-bold py-2 rounded-lg text-xs hover:bg-slate-200 transition-colors">
              Request Revision
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function HostPreview() {
  return (
    <div className="p-5 flex flex-col gap-4 h-full">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-black text-slate-900 text-base">Host Manager</h3>
          <p className="text-xs text-slate-500">BlueCare Springwood — Manage placement agreements</p>
        </div>
        <span className="text-xs bg-amber-100 text-amber-700 font-black px-2 py-1 rounded-lg border border-amber-200">1 Agreement Pending</span>
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0">EN</div>
          <div className="flex-1">
            <div className="font-black text-slate-900">Emma Nguyen</div>
            <div className="text-xs text-slate-500 mb-3">Requested: 120-hour Clinical Placement • Jan–Jun 2026</div>
            <div className="space-y-1.5 text-xs mb-4">
              {[
                { label: 'Institution', value: 'ICQA Brisbane' },
                { label: 'Course', value: 'Cert IV Aged Care' },
                { label: 'Supervisor', value: 'Dr. Helen Park' },
              ].map((f, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-slate-400 w-24 shrink-0">{f.label}</span>
                  <span className="font-bold text-slate-700">{f.value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="flex-1 bg-indigo-600 text-white font-black py-2 rounded-lg text-xs hover:bg-indigo-700 transition-colors">
                Sign Digitally ✍️
              </button>
              <button className="px-4 bg-white border border-slate-200 text-slate-600 font-bold py-2 rounded-lg text-xs">
                Review
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Active Students', value: '8', color: 'indigo' },
          { label: 'Supervisor Slots', value: '3/5 used', color: 'emerald' },
          { label: 'Hours Verified', value: '1,284', color: 'sky' },
          { label: 'Compliance Score', value: '97%', color: 'violet' },
        ].map((s, i) => (
          <div key={i} className={`bg-${s.color}-50 border border-${s.color}-100 rounded-xl p-3`}>
            <div className={`text-xl font-black text-${s.color}-700`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
