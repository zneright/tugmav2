import { useState } from 'react';
import {
  Settings, Bell, Save, ChevronRight
} from 'lucide-react';

export default function EmployerSettings() {
  const [activeTab, setActiveTab] = useState('notifications');

  // State to manage which notifications are checked
  const [notifications, setNotifications] = useState({
    newApplicants: true,
    dailyDigest: false,
    marketing: true
  });

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    // In a real app, this would send an API request to CodeIgniter
    alert("Notification preferences saved successfully!");
  };

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-in pb-10">

      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
          <Settings className="text-purple-600" /> Settings
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your platform preferences and email notifications.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">

        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 flex flex-col gap-1 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                }`}
            >
              <div className="flex items-center gap-3">
                {tab.icon} {tab.label}
              </div>
              {activeTab === tab.id && <ChevronRight size={16} />}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm min-h-[400px]">

          {/* TAB: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  Email Preferences
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Control when and how Tugma contacts you. We will send updates directly to your registered email address.
                </p>
              </div>

              <div className="space-y-6">

                {/* Preference 1 */}
                <div className="flex items-start justify-between bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <div className="pr-4">
                    <h4 className="font-bold text-zinc-900 dark:text-white">New Applicants</h4>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      Get an email immediately as soon as a student applies to one of your active job postings.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifications.newApplicants}
                      onChange={() => handleToggle('newApplicants')}
                    />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Preference 2 */}
                <div className="flex items-start justify-between bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <div className="pr-4">
                    <h4 className="font-bold text-zinc-900 dark:text-white">Daily Digest</h4>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      Receive a single daily summary email of all activity, views, and applications on your postings.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifications.dailyDigest}
                      onChange={() => handleToggle('dailyDigest')}
                    />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Preference 3 */}
                <div className="flex items-start justify-between bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <div className="pr-4">
                    <h4 className="font-bold text-zinc-900 dark:text-white">Platform Updates</h4>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      Receive news about new platform features, maintenance windows, and recruiting tips.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifications.marketing}
                      onChange={() => handleToggle('marketing')}
                    />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>

              </div>

              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-8 py-3 rounded-xl text-sm font-black transition-all shadow-lg shadow-purple-500/25 active:scale-95 uppercase tracking-wider"
                >
                  <Save size={18} className="text-white" /> Save Preferences
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}