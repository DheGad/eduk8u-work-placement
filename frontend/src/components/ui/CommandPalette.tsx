import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Search, FileText, Users, Building2, UserCheck, Settings, Home, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4 backdrop-blur-sm bg-black/50" onClick={() => setOpen(false)}>
      <div className="w-full max-w-[600px] overflow-hidden rounded-xl border border-[#222222] bg-[#0A0A0A] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <Command label="Command Menu" className="w-full bg-transparent flex flex-col">
          <div className="flex items-center border-b border-[#222222] px-4">
            <Search className="w-5 h-5 text-[#71717A] mr-2" />
            <Command.Input 
              className="flex-1 h-12 bg-transparent text-[15px] text-white placeholder-[#71717A] focus:outline-none"
              placeholder="Type a command or search..."
              autoFocus
            />
          </div>
          
          <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin">
            <Command.Empty className="py-6 text-center text-[13px] text-[#71717A]">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="px-2 text-[11px] font-medium text-[#71717A] py-1">
              <Command.Item onSelect={() => runCommand(() => navigate('/dashboard'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-[#D4D4D8] hover:bg-[#1A1A1A] hover:text-white cursor-pointer data-[selected=true]:bg-[#1A1A1A] data-[selected=true]:text-white">
                <Home className="w-4 h-4 text-emerald-500" />
                Dashboard
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => navigate('/placements'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-[#D4D4D8] hover:bg-[#1A1A1A] hover:text-white cursor-pointer data-[selected=true]:bg-[#1A1A1A] data-[selected=true]:text-white">
                <Activity className="w-4 h-4 text-blue-500" />
                Placements
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => navigate('/students'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-[#D4D4D8] hover:bg-[#1A1A1A] hover:text-white cursor-pointer data-[selected=true]:bg-[#1A1A1A] data-[selected=true]:text-white">
                <Users className="w-4 h-4 text-purple-500" />
                Students
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => navigate('/hosts'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-[#D4D4D8] hover:bg-[#1A1A1A] hover:text-white cursor-pointer data-[selected=true]:bg-[#1A1A1A] data-[selected=true]:text-white">
                <Building2 className="w-4 h-4 text-amber-500" />
                Host Facilities
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => navigate('/supervisors'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-[#D4D4D8] hover:bg-[#1A1A1A] hover:text-white cursor-pointer data-[selected=true]:bg-[#1A1A1A] data-[selected=true]:text-white">
                <UserCheck className="w-4 h-4 text-rose-500" />
                Supervisors
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Settings" className="px-2 text-[11px] font-medium text-[#71717A] py-1 mt-2">
              <Command.Item onSelect={() => runCommand(() => navigate('/settings/users'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-[#D4D4D8] hover:bg-[#1A1A1A] hover:text-white cursor-pointer data-[selected=true]:bg-[#1A1A1A] data-[selected=true]:text-white">
                <Settings className="w-4 h-4 text-[#A1A1AA]" />
                User Management
              </Command.Item>
            </Command.Group>
            
          </Command.List>
        </Command>
      </div>
    </div>
  );
};
