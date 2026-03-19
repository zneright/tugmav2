import { useState } from 'react';
import { 
  Settings, User, Bell, Shield, Users, 
  CreditCard, ChevronRight, Save, Plus, Trash2
} from 'lucide-react';

export default function EmployerSettings() {
  const [activeTab, setActiveTab] = useState('team');

  const tabs = [
    { id: 'account', label: 'Account Details', icon: <User size={18} /> },
    { id: 'team', label: 'Team Management', icon: <Users size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    // { id: 'billing', label: 'Plan & Billing', icon: <CreditCard size={18} /> },
  ];

  // Mock Team Members
  const team = [
    { id: 1, name: 'Sarah Connor', email: 'sarah@techflow.io', role: 'Admin', avatar: 'S' },
    { id: 2, name: 'John Doe', email: 'john@techflow.io', role: 'Recruiter', avatar: 'J' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-in">
      
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
          <Settings className="text-purple-600" /> Team Settings
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your account, team access, and platform preferences.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 flex flex-col gap-1 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
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
        <div className="flex-1 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm min-h-[500px]">
          
          {/* TAB: TEAM MANAGEMENT */}
          {activeTab === 'team' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Team Members</h2>
                  <p className="text-sm text-zinc-500">Invite colleagues to help manage applicants.</p>
                </div>
                <button className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90">
                  <Plus size={16} /> Invite Member
                </button>
              </div>

              <div className="space-y-4">
                {team.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black">
                        {member.avatar}
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900 dark:text-white leading-tight">{member.name}</h4>
                        <p className="text-xs text-zinc-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${member.role === 'Admin' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'}`}>
                        {member.role}
                      </span>
                      {member.role !== 'Admin' && (
                        <button className="text-zinc-400 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Email Preferences</h2>
                <p className="text-sm text-zinc-500">Control when and how Tugma contacts you.</p>
              </div>

              <div className="space-y-6">
                {[
                  { title: 'New Applicants', desc: 'Get an email as soon as a student applies to your job.' },
                  { title: 'Daily Digest', desc: 'A daily summary of all activity on your postings.' },
                  { title: 'Marketing & Updates', desc: 'Receive news about new platform features.' }
                ].map((pref, i) => (
                  <div key={i} className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-white">{pref.title}</h4>
                      <p className="text-sm text-zinc-500 mt-0.5">{pref.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={i !== 2} />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-purple-500/20">
                  <Save size={16} /> Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* TAB: ACCOUNT DETAILS */}
          {activeTab === 'account' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Personal Information</h2>
                <p className="text-sm text-zinc-500">Update your login details and security settings.</p>
              </div>
              
              <div className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Full Name</label>
                  <input type="text" defaultValue="Main Admin" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Email Address</label>
                  <input type="email" defaultValue="admin@techflow.io" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm" />
                </div>
                <button className="text-sm font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 mt-2">
                  <Shield size={16} /> Change Password
                </button>
              </div>
            </div>
          )}

          {/* TAB: BILLING (Placeholder) */}
          {activeTab === 'billing' && (
            <div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <CreditCard size={32} className="text-zinc-400" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Pro Plan Active</h3>
              <p className="text-zinc-500 mt-1 max-w-sm">You are currently on the Pro tier. Billing management will be available in the next update.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}