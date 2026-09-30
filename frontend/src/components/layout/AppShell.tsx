import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, Building2, UserCheck, ShieldCheck,
  BarChart3, FileSearch, FileText, Bell, Settings, ChevronLeft, ChevronRight,
  LogOut, User, Zap, ClipboardList, Clock, CheckSquare, FileCheck2, Home,
  Search, X, ChevronDown, ChevronUp, UsersRound, Sun, Moon, HelpCircle,
  ArrowRight, ArrowLeft, CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '@/stores/authStore';
import { logout as logoutApi } from '@/api/endpoints/auth';
import { useQuery } from '@tanstack/react-query';
import { getComplianceAlerts } from '@/api/endpoints/admin';
import { useThemeStore } from '@/stores/themeStore';

// ─── Navigation Groups ────────────────────────────────────────────────────────
interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  description?: string;
}
interface NavGroup {
  label: string;
  items: NavItem[];
  collapsible?: boolean;
}

const buildNavGroups = (alertCount: number): NavGroup[] => [
  {
    label: 'Command Centre',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={17} />, description: 'Platform overview' },
    ],
  },
  {
    label: 'Placement Workflow',
    collapsible: false,
    items: [
      { label: 'Active Placements', href: '/placements', icon: <Briefcase size={17} />, description: '120hr tracking' },
      { label: 'Students', href: '/students', icon: <Users size={17} />, description: 'Learner management' },
      { label: 'Host Facilities', href: '/hosts', icon: <Building2 size={17} />, description: 'CA 0393 Suitability' },
      { label: 'Supervisors', href: '/supervisors', icon: <UserCheck size={17} />, description: 'CA 0395 Verification' },
      { label: 'Document Vault', href: '/documents', icon: <FileText size={17} />, description: 'All uploaded files' },
    ],
  },
  {
    label: 'Intelligence',
    collapsible: false,
    items: [
      { label: 'Compliance Centre', href: '/compliance', icon: <ShieldCheck size={17} />, badge: alertCount > 0 ? alertCount : undefined, description: 'ASQA matrix' },
      { label: 'Audit Centre', href: '/audit', icon: <FileSearch size={17} />, description: 'One-click packages' },
      { label: 'Reports', href: '/reports', icon: <BarChart3 size={17} />, description: 'Export & download' },
    ],
  },
  {
    label: 'System',
    collapsible: true,
    items: [
      { label: 'User Management', href: '/users', icon: <UsersRound size={17} />, description: 'Roles & access' },
      { label: 'Settings', href: '/settings', icon: <Settings size={17} />, description: 'Configuration' },
    ],
  },
];

// ─── Quick search ─────────────────────────────────────────────────────────────
const ALL_PAGES = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Active Placements', href: '/placements' },
  { label: 'Students', href: '/students' },
  { label: 'Host Facilities', href: '/hosts' },
  { label: 'Supervisors', href: '/supervisors' },
  { label: 'Document Vault', href: '/documents' },
  { label: 'Compliance Centre', href: '/compliance' },
  { label: 'Audit Centre', href: '/audit' },
  { label: 'Reports', href: '/reports' },
  { label: 'User Management', href: '/users' },
  { label: 'Settings', href: '/settings' },
];

const GlobalSearch: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const results = q.length > 0
    ? ALL_PAGES.filter(p => p.label.toLowerCase().includes(q.toLowerCase()))
    : ALL_PAGES.slice(0, 6);

  useEffect(() => { inputRef.current?.focus(); }, []);
  function go(href: string) { navigate(href); onClose(); }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh' }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 520, background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1rem 1.25rem', borderBottom: '1px solid var(--surface-border)' }}>
          <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search pages, placements, students…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '1rem' }}
          />
          <kbd style={{ fontSize: '0.6875rem', padding: '0.125rem 0.375rem', borderRadius: 4, border: '1px solid var(--surface-border)', color: 'var(--text-muted)' }}>ESC</kbd>
        </div>
        <div style={{ padding: '0.5rem 0', maxHeight: 360, overflowY: 'auto' }}>
          {results.map(r => (
            <button
              key={r.href}
              onClick={() => go(r.href)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '0.625rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary)', fontSize: '0.875rem' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <LayoutDashboard size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              {r.label}
            </button>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--surface-border)', padding: '0.625rem 1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Press <kbd style={{ fontSize: '0.6875rem', padding: '0.0625rem 0.25rem', borderRadius: 3, border: '1px solid var(--surface-border)' }}>↵</kbd> to navigate
        </div>
      </div>
    </div>
  );
};

// ─── How-To-Use Tour ─────────────────────────────────────────────────────────
const TOUR_STEPS = [
  {
    title: '👋 Welcome to EDUK8U',
    body: 'This guided tour walks you through the key features. Use the arrows to move between steps.',
    highlight: null,
  },
  {
    title: '📊 Dashboard',
    body: 'The Dashboard is your command centre. See your Global Health Score, Compliance Readiness, At-Risk students, and recent platform activity at a glance.',
    highlight: '/dashboard',
  },
  {
    title: '📋 Active Placements',
    body: 'Manage all student placements here. Track hours progress, view compliance status, approve timesheets, and drill into individual placement detail pages.',
    highlight: '/placements',
  },
  {
    title: '👨‍🎓 Students',
    body: 'View all enrolled students, their placement status, hours logged, journals submitted, and competency sign-offs. Click any student to see their full profile.',
    highlight: '/students',
  },
  {
    title: '🏢 Host Facilities',
    body: 'Manage your placement host organisations. Verify insurance, record suitability assessments (CA 0393), and track available supervisor slots.',
    highlight: '/hosts',
  },
  {
    title: '🛡️ Compliance Centre',
    body: 'See your real-time Audit Readiness Score, compliance heatmaps by campus/course, and a prioritised list of missing evidence, signatures, and overdue visits.',
    highlight: '/compliance',
  },
  {
    title: '📦 Audit Centre',
    body: 'Generate a complete ASQA Audit Pack with one click. The pack includes student profiles, hour logs, journals, evidence, competencies, and a full audit trail PDF.',
    highlight: '/audit',
  },
  {
    title: '✅ You\'re all set!',
    body: 'You now know the essentials. For help, use the Help button at any time. To get started, click "New Placement" on the Dashboard.',
    highlight: null,
  },
];

const GuidedTour: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  function next() {
    if (isLast) { onClose(); return; }
    const nextStep = TOUR_STEPS[step + 1];
    if (nextStep.highlight) navigate(nextStep.highlight);
    setStep(s => s + 1);
  }
  function prev() {
    if (step === 0) return;
    setStep(s => s - 1);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 500, background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 20, boxShadow: '0 25px 60px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '1.5rem 1.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {TOUR_STEPS.map((_, i) => (
              <div key={i} style={{ width: 24, height: 4, borderRadius: 2, background: i <= step ? '#6366f1' : 'var(--surface-border)', transition: 'background 0.3s' }} />
            ))}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            Step {step + 1} of {TOUR_STEPS.length}
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', lineHeight: 1.3 }}>
            {current.title}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.65 }}>
            {current.body}
          </p>

          {current.highlight && (
            <button
              onClick={() => navigate(current.highlight!)}
              style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--color-primary-400)', fontWeight: 600, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '0.375rem 0.875rem', cursor: 'pointer' }}
            >
              Open {current.title.split(' ').slice(1).join(' ')} <ArrowRight size={13} />
            </button>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={prev}
            disabled={step === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: step === 0 ? 'var(--text-muted)' : 'var(--text-secondary)', background: 'none', border: 'none', cursor: step === 0 ? 'default' : 'pointer', fontWeight: 500 }}
          >
            <ArrowLeft size={15} /> Previous
          </button>
          <button
            onClick={next}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', border: 'none', borderRadius: 10, padding: '0.625rem 1.25rem', cursor: 'pointer' }}
          >
            {isLast ? (
              <><CheckCircle2 size={15} /> Finish Tour</>
            ) : (
              <>Next <ArrowRight size={15} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Light mode CSS variables injected dynamically ───────────────────────────
const LIGHT_OVERRIDES = `
[data-theme="light"] {
  --surface-bg: #f8fafc;
  --surface-sidebar: #ffffff;
  --surface-card: #ffffff;
  --surface-card-hover: #f8fafc;
  --surface-card-elevated: #f1f5f9;
  --surface-border: #e2e8f0;
  --surface-border-subtle: #f1f5f9;
  --surface-input: #ffffff;
  --surface-input-focus: #f8fafc;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --text-inverse: #ffffff;
}
[data-theme="light"] .sidebar-link { color: #475569; }
[data-theme="light"] .sidebar-link:hover { background: rgba(99,102,241,0.06); color: #1e293b; }
[data-theme="light"] .sidebar-link.active { background: rgba(99,102,241,0.1); color: #4f46e5; }
`;

// ─── Main AppShell ────────────────────────────────────────────────────────────
export const AppShell: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const { user, refreshToken, logout: localLogout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  // Inject light-mode CSS once
  useEffect(() => {
    const styleId = 'eduk8u-light-mode-vars';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = LIGHT_OVERRIDES;
      document.head.appendChild(style);
    }
  }, []);

  // Live alerts count for badge
  const { data: alerts = [] } = useQuery({
    queryKey: ['compliance-alerts'],
    queryFn: getComplianceAlerts,
    refetchInterval: 60000,
    retry: false,
  });

  const navGroups = buildNavGroups(alerts.length);

  // Keyboard shortcut: Cmd+K / Ctrl+K opens search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(o => !o); }
      if (e.key === 'Escape') { setSearchOpen(false); setTourOpen(false); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  async function handleLogout() {
    try { if (refreshToken) await logoutApi(refreshToken); } catch {}
    localLogout();
    navigate('/login');
  }

  function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
  function toggleGroup(label: string) {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  }

  const sidebarWidth = collapsed ? '64px' : '240px';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-bg)' }}>
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      {tourOpen && <GuidedTour onClose={() => setTourOpen(false)} />}

      {/* ─── SIDEBAR ─────────────────────────────────────────── */}
      <aside style={{ width: sidebarWidth, minHeight: '100vh', background: 'var(--surface-sidebar)', borderRight: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', transition: 'width 0.2s ease', overflow: 'hidden', position: 'sticky', top: 0, zIndex: 30, flexShrink: 0 }}>
        
        {/* Brand — text only, no icon */}
        <div style={{ height: '60px', display: 'flex', alignItems: 'center', padding: collapsed ? '0 14px' : '0 16px', borderBottom: '1px solid var(--surface-border)', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start', flexShrink: 0 }}>
          {collapsed ? (
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#4f46e5,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 900, fontSize: '0.75rem' }}>E</span>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1 }}>EDUK8U</div>
              <div style={{ fontSize: '0.5625rem', color: 'var(--color-primary-400)', letterSpacing: '0.1em', marginTop: 1, fontWeight: 700 }}>PLACEMENT INTELLIGENCE</div>
            </div>
          )}
        </div>

        {/* Tenant badge */}
        {!collapsed && user?.tenant && (
          <div style={{ padding: '8px 12px' }}>
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, padding: '4px 10px', fontSize: '0.6875rem', color: 'var(--color-primary-300)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {user.tenant.name}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '8px', overflowY: 'auto', overflowX: 'hidden' }}>
          {navGroups.map(group => {
            const isGroupCollapsed = collapsedGroups[group.label];
            return (
              <div key={group.label} style={{ marginBottom: 4 }}>
                {!collapsed && (
                  <button
                    onClick={() => group.collapsible && toggleGroup(group.label)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px 4px', background: 'none', border: 'none', cursor: group.collapsible ? 'pointer' : 'default', color: 'var(--text-muted)', marginBottom: 2 }}
                  >
                    <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{group.label}</span>
                    {group.collapsible && (isGroupCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                  </button>
                )}
                {!isGroupCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {group.items.map(item => (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        className={({ isActive }) => clsx('sidebar-link', isActive && 'active')}
                        title={collapsed ? item.label : undefined}
                        style={collapsed ? { justifyContent: 'center', padding: '8px' } : undefined}
                      >
                        <span className="sidebar-link-icon">{item.icon}</span>
                        {!collapsed && <span style={{ flex: 1, fontSize: '0.8125rem' }}>{item.label}</span>}
                        {!collapsed && item.badge && item.badge > 0 && (
                          <span style={{ background: '#ef4444', color: 'white', borderRadius: 10, padding: '1px 6px', fontSize: '0.625rem', fontWeight: 700, minWidth: 18, textAlign: 'center' }}>
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
                <div style={{ height: 1, background: 'var(--surface-border)', margin: '6px 4px' }} />
              </div>
            );
          })}

          {/* Profile + Logout */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 4 }}>
            <NavLink to="/profile" className={({ isActive }) => clsx('sidebar-link', isActive && 'active')} title={collapsed ? 'Profile' : undefined} style={collapsed ? { justifyContent: 'center', padding: '8px' } : undefined}>
              <span className="sidebar-link-icon"><User size={17} /></span>
              {!collapsed && <span style={{ fontSize: '0.8125rem' }}>Profile</span>}
            </NavLink>
            <button
              className="sidebar-link"
              onClick={handleLogout}
              style={collapsed ? { justifyContent: 'center', padding: '8px', width: '100%', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' } : { width: '100%', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              title={collapsed ? 'Sign out' : undefined}
            >
              <LogOut size={17} className="sidebar-link-icon" />
              {!collapsed && <span style={{ fontSize: '0.8125rem' }}>Sign out</span>}
            </button>
          </div>
        </nav>

        {/* Collapse toggle */}
        <div style={{ padding: '8px', borderTop: '1px solid var(--surface-border)', flexShrink: 0 }}>
          <button className="btn btn-ghost" onClick={() => setCollapsed(c => !c)} style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-end' }}>
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>
      </aside>

      {/* ─── MAIN AREA ───────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Top Header */}
        <header style={{ height: '60px', background: 'var(--surface-sidebar)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12, position: 'sticky', top: 0, zIndex: 20, flexShrink: 0 }}>
          
          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 8, padding: '6px 12px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8125rem', transition: 'all 0.15s' }}
          >
            <Search size={14} />
            <span>Search…</span>
            <kbd style={{ fontSize: '0.625rem', padding: '1px 4px', borderRadius: 3, border: '1px solid var(--surface-border)', marginLeft: 4 }}>⌘K</kbd>
          </button>

          <div style={{ flex: 1 }} />

          {/* How-to-use button */}
          <button
            onClick={() => setTourOpen(true)}
            title="How to use EDUK8U"
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '5px 10px', color: 'var(--color-primary-400)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
          >
            <HelpCircle size={14} /> How to Use
          </button>

          {/* Dark/Light mode toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Alerts bell */}
          <button
            onClick={() => navigate('/compliance')}
            style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, display: 'flex', borderRadius: 8 }}
            title="Compliance Alerts"
          >
            <Bell size={18} />
            {alerts.length > 0 && (
              <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '1.5px solid var(--surface-sidebar)' }} />
            )}
          </button>

          {/* User avatar */}
          <NavLink to="/settings" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', padding: '4px 8px', borderRadius: 8, transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-card)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'white' }}>
                {user ? getInitials(user.full_name || `${user.first_name} ${user.last_name}`) : 'U'}
              </span>
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.full_name || `${user?.first_name} ${user?.last_name}`}</p>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role?.replace(/_/g, ' ')}</p>
            </div>
          </NavLink>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
