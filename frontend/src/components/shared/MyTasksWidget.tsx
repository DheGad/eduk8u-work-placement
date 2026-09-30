import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import apiClient from '@/api/client';
import { useNavigate } from 'react-router-dom';

export default function MyTasksWidget() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => (await apiClient.get('/tasks/my-tasks')).data.tasks
  });

  if (isLoading) return <div className="p-4 text-center text-slate-500">Loading your tasks...</div>;

  const tasks = data || [];

  return (
    <div className="card h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-indigo-500" />
          My Tasks
        </h3>
        <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
          {tasks.length} Pending
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {tasks.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500 h-full">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
            <p className="font-medium text-slate-700">You're all caught up!</p>
            <p className="text-sm">No pending tasks require your attention.</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {tasks.map((task: any) => (
              <li 
                key={task.id} 
                className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                onClick={() => task.link && navigate(task.link)}
              >
                <div className="mt-0.5">
                  <Circle className="w-5 h-5 text-slate-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" /> Due: {task.due}
                    </span>
                    {task.priority === 'high' && (
                      <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                        <AlertCircle className="w-3 h-3" /> High Priority
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
