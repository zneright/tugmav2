import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

export default function StatCard({ title, value, icon }: StatCardProps) {  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-5 hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-default group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</h3>
        </div>
        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300 group-hover:bg-purple-50 group-hover:text-purple-600 dark:group-hover:bg-purple-500/10 dark:group-hover:text-purple-400 transition-colors">
          {icon}
        </div>
      </div>
    </div>
  );
}