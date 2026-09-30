import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Clock, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { formatDistanceToNow } from 'date-fns';

export const NotificationDropdown: React.FC = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await apiClient.get('/notifications')).data
  });

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  const markRead = useMutation({
    mutationFn: async (id: string) => apiClient.post(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'compliance': return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      case 'alert': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'system': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <Bell className="w-4 h-4 text-[#A1A1AA]" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#222222] text-[#A1A1AA] hover:text-white transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-[#0A0A0A] border border-[#222222] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#222222] bg-[#0F0F0F]">
              <h3 className="font-semibold text-[13px] text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </div>
            
            <div className="max-h-[360px] overflow-y-auto scrollbar-thin">
              {isLoading ? (
                <div className="p-4 text-center text-[12px] text-[#71717A]">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-[12px] text-[#71717A]">You're all caught up!</div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notif: any) => (
                    <div 
                      key={notif.id}
                      className={`p-3 border-b border-[#222222] last:border-0 hover:bg-[#111111] transition-colors cursor-pointer flex gap-3 ${notif.is_read ? 'opacity-70' : ''}`}
                      onClick={() => {
                        if (!notif.is_read) markRead.mutate(notif.id);
                        if (notif.link) {
                          navigate(notif.link);
                          setOpen(false);
                        }
                      }}
                    >
                      <div className="shrink-0 mt-0.5 p-1.5 rounded-full bg-[#1A1A1A] border border-[#333333]">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-white tracking-tight mb-0.5">{notif.title}</div>
                        <div className="text-[12px] text-[#A1A1AA] leading-snug">{notif.message}</div>
                        <div className="text-[10px] text-[#71717A] mt-1.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </div>
                      </div>
                      {!notif.is_read && (
                        <div className="shrink-0">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-2 border-t border-[#222222] bg-[#0F0F0F]">
              <button 
                onClick={() => { navigate('/notifications'); setOpen(false); }}
                className="w-full py-1.5 text-center text-[12px] font-medium text-[#A1A1AA] hover:text-white transition-colors"
              >
                View All Notifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
