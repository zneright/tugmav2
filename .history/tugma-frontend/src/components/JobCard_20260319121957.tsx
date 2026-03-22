import { MapPin, Bookmark, ExternalLink } from 'lucide-react';

interface JobCardProps {
  company: string;
  logoInitial: string;
  title: string;
  location: string;
  description: string;
  postedTime: string;
}

export default function JobCard({ company, logoInitial, title, location, description, postedTime }: JobCardProps) {
  return (
    <article className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header: Company & Time */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-md bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 flex items-center justify-center font-bold text-xl text-purple-700 dark:text-purple-400">
            {logoInitial}
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white leading-tight hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer transition-colors">
              {company}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{postedTime}</p>
          </div>
        </div>
      </div>

      {/* Body: Job Details */}
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white mb-2">{title}</h2>
        <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 mb-3">
          <MapPin size={16} />
          {location}
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-3 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Footer: Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
        <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
          <ExternalLink size={16} />
          Apply Now
        </button>
        <button className="p-2 text-zinc-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700">
          <Bookmark size={20} />
        </button>
      </div>
    </article>
  );
}