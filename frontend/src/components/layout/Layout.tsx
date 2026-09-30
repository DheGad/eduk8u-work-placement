import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Building, UserCheck, 
  Briefcase, CheckSquare, ShieldCheck, FileText, 
  Settings, Bell, LogOut, Menu, X, ChevronRight,
  Folder, Activity
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { NotificationDropdown } from '../ui/NotificationDropdown';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout: storeLogout } = useAuthStore();
  
  const logout = () => {
    storeLogout();
    navigate('/login');
  };

  const getNavGroups = () => {
    const role = user?.role || 'student';
    
    // Super Admin & College Admin
    if (role === 'super_admin' || role === 'college_admin') {
      return [
        {
          title: 'OVERVIEW',
          items: [{ path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
        },
        {
          title: 'PEOPLE',
          items: [
            { path: '/students', label: 'Students', icon: Users },
            { path: '/hosts', label: 'Host Facilities', icon: Building },
            { path: '/supervisors', label: 'Supervisors', icon: UserCheck },
          ],
        },
        {
          title: 'PLACEMENTS',
          items: [
            { path: '/placements', label: 'Placements', icon: Briefcase },
          ],
        },
        {
          title: 'COMPLIANCE',
          items: [
            { path: '/compliance', label: 'Compliance Centre', icon: CheckSquare },
            { path: '/audit', label: 'Audit Centre', icon: ShieldCheck },
          ],
        },
        {
          title: 'DOCUMENTS',
          items: [
            { path: '/documents', label: 'Document Vault', icon: Folder },
          ],
        },
        {
          title: 'REPORTS',
          items: [
            { path: '/analytics', label: 'Product Analytics', icon: Activity },
            { path: '/reports', label: 'Reports', icon: FileText }
          ],
        },
        {
          title: 'SETTINGS',
          items: [
            { path: '/settings/organization', label: 'Organization Settings', icon: Settings },
            { path: '/settings/workflows', label: 'Automation Rules', icon: Settings },
            { path: '/settings/import', label: 'Bulk Import', icon: Users },
            { path: '/system/audit', label: 'Audit Logs', icon: Settings },
            { path: '/system/readiness', label: 'Readiness Report', icon: Settings },
            { path: '/users', label: 'Users', icon: Users },
          ],
        }
      ];
    }
    
    if (role === 'supervisor') {
      return [
        {
          title: 'SUPERVISOR PORTAL',
          items: [{ path: '/portal/supervisor', label: 'Dashboard', icon: LayoutDashboard }],
        }
      ];
    }
    
    // Student
    return [
      {
        title: 'STUDENT PORTAL',
        items: [{ path: '/portal/student', label: 'My Placement', icon: LayoutDashboard }],
      }
    ];
  };

  const navGroups = getNavGroups();

  

  return (
    <div className="flex h-screen bg-[#000000] font-sans text-[#EDEDED] antialiased selection:bg-indigo-500/30">
      {/* Sidebar Desktop */}
      <aside className={`hidden md:flex flex-col bg-[#0A0A0A] border-r border-[#222222] transition-all duration-300 ${sidebarOpen ? 'w-[240px]' : 'w-[68px]'}`}>
        <div className="h-14 flex items-center justify-between px-4 border-b border-[#222222]">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold tracking-tighter">E8</span>
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-white">EDUK8U</span>
            </div>
          ) : (
            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center mx-auto">
              <span className="text-white text-xs font-bold tracking-tighter">E8</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 scrollbar-none">
          {navGroups.map((group, i) => (
            <div key={i} className="mb-6 px-3">
              {sidebarOpen && <p className="text-[11px] font-medium text-[#71717A] mb-2 px-2 uppercase tracking-widest">{group.title}</p>}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={!sidebarOpen ? item.label : undefined}
                      className={`flex items-center px-2 py-1.5 rounded-md transition-colors text-[13px] font-medium ${
                        isActive 
                          ? 'bg-[#222222] text-white' 
                          : 'text-[#A1A1AA] hover:bg-[#1A1A1A] hover:text-white'
                      }`}
                    >
                      <item.icon className={`w-[15px] h-[15px] ${sidebarOpen ? 'mr-2.5' : 'mx-auto'} ${isActive ? 'text-white' : 'text-[#71717A]'}`} strokeWidth={2.5} />
                      {sidebarOpen && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-[#222222]">
          <div className={`flex items-center ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.first_name?.[0] || 'U'}
            </div>
            {sidebarOpen && (
              <div className="ml-2.5 flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-[11px] text-[#71717A] truncate capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            )}
            {sidebarOpen && (
              <button onClick={logout} className="p-1.5 text-[#71717A] hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors">
                <LogOut className="w-[14px] h-[14px]" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sm:px-6 z-10 shrink-0">
          <div className="flex items-center">
            <button className="md:hidden p-2 -ml-2 mr-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center text-sm text-slate-500 dark:text-slate-400">
              <span>EDUK8U</span>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="text-slate-900 dark:text-slate-100 font-medium capitalize">
                {location.pathname.split('/')[1] || 'Dashboard'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <NotificationDropdown />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900">
          <Outlet />
        </div>
      </main>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-800 shadow-xl">
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-500">
                EDUK8U
              </span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              {navGroups.map((group, i) => (
                <div key={i} className="mb-6 px-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">{group.title}</p>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                          location.pathname.startsWith(item.path) 
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
