import { useState } from 'react';
import { 
  Briefcase, XOctagon, Eye, Clock, Search, 
  Heart, Share2, MessageCircle, Bookmark, ChevronLeft, 
  ChevronRight,  ChevronDown, Send
} from 'lucide-react';
import StatCard from '../../components/StatCard';
import JobCard from '../../components/JobCard';

export default function Dashboard() {
  // State for the floating messaging widget
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Mock Data
  const feedPosts = [
    {
      id: 1, company: 'TechNova Solutions', avatar: 'T', time: '2 hours ago',
      content: "We had an amazing time at our annual hackathon! 🚀 Shoutout to all the interns who participated and built incredible AI prototypes. We are opening up 5 new internship slots next week, so keep your eyes peeled on our job board!",
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
      likes: 124, comments: 18
    },
    {
      id: 2, company: 'Creative Studio PH', avatar: 'C', time: '5 hours ago',
      content: "Hot take: Good UI is invisible. 🎨 We are currently looking for a UI/UX OJT who understands the balance between aesthetics and accessibility. Apply through our Tugma portal! No prior professional experience required, just a solid portfolio.",
      image: null,
      likes: 56, comments: 4
    }
  ];

  return (
    <div className="relative fade-in pb-10 h-full">
      
      {/* --- MAIN GRID LAYOUT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ========================================= */}
        {/* LEFT COLUMN: THE FEED (Takes up 8 columns) */}
        {/* ========================================= */}
        <section className="lg:col-span-8 space-y-6">


          <div className="space-y-6">
            {feedPosts.map((post) => (
              <div key={post.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-black">{post.avatar}</div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white hover:text-purple-600 cursor-pointer">{post.company}</h4>
                      <p className="text-xs text-zinc-500">{post.time}</p>
                    </div>
                  </div>
                  <button className="text-zinc-400 hover:text-purple-600 transition-colors"><Bookmark size={20} /></button>
                </div>

                <div className="px-4 pb-3">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line">{post.content}</p>
                </div>

                {post.image && (
                  <div className="w-full h-72 bg-zinc-100 dark:bg-zinc-800 border-t border-b border-zinc-100 dark:border-zinc-800">
                    <img src={post.image} alt="Post Attachment" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="p-4 flex items-center gap-6 bg-zinc-50/50 dark:bg-zinc-800/20">
                  <button className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-red-500 transition-colors group">
                    <Heart size={18} className="group-hover:fill-red-500" /> {post.likes}
                  </button>
                  <button className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-blue-500 transition-colors">
                    <MessageCircle size={18} /> {post.comments}
                  </button>
                  <button className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-emerald-500 transition-colors ml-auto">
                    <Share2 size={18} /> Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* ========================================== */}
        {/* RIGHT COLUMN: STATS & JOBS (Takes 4 columns) */}
        {/* ========================================== */}
        <section className="lg:col-span-4 space-y-6">
          
          {/* 1. The 2x2 Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={<Briefcase />} title="Applied" value="12" />
            <StatCard icon={<XOctagon />} title="Declined" value="2" />
            <StatCard icon={<Eye />} title="Profile Views" value="48" />
            <StatCard icon={<Clock />} title="Pending" value="5" />
          </div>

          {/* 2. Recent Jobs Carousel */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Recent Jobs For You</h2>
              <div className="flex items-center gap-1">
                <button className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><ChevronLeft size={16} /></button>
                <button className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><ChevronRight size={16} /></button>
              </div>
            </div>

            {/* Vertically stacked for the sidebar to look clean */}
            <div className="space-y-4">
              <JobCard company="TechNova" title="React Intern" location="Makati City" logoInitial="T" description="Looking for a React intern." postedTime="2h ago" />
              <JobCard company="Creative Studio" title="UI/UX OJT" location="BGC, Taguig" logoInitial="C" description="Design high-fidelity mockups." postedTime="5h ago" />
            </div>
            
            <button className="w-full mt-4 py-2 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 rounded-lg transition-colors">
              View all recommendations
            </button>
          </div>
        </section>

      </div>




    </div>
  );
}