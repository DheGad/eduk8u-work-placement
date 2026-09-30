import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  /** Icon to display (default: inbox) */
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
}

/**
 * Empty state component shown when a list or data set is empty.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-[#333333] rounded-xl bg-[#0A0A0A] w-full">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
        <Icon className="w-8 h-8 text-indigo-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-[17px] font-semibold text-white tracking-tight mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-[14px] text-[#A1A1AA] max-w-md leading-relaxed mb-6">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className={`h-9 px-4 rounded-md text-[13px] font-semibold transition-colors flex items-center shadow-sm ${
            action.variant === 'secondary'
              ? 'bg-[#1A1A1A] border border-[#333333] text-white hover:bg-[#222222]'
              : action.variant === 'ghost'
              ? 'bg-transparent text-[#A1A1AA] hover:text-white hover:bg-[#111111]'
              : 'bg-white text-black hover:bg-gray-100 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]'
          }`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
