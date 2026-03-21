import JobCard from '../components/JobCard';

// Mock Data for the social feed
const MOCK_FEED = [
  {
    id: 1,
    company: "Creative Studio PH",
    logoInitial: "C",
    title: "Web Design & Front-End Intern",
    location: "Malabon, Metro Manila (Hybrid)",
    description: "Looking for an IT student with a passion for web design to join our creative team. You will be helping us build responsive UI components using React and Tailwind CSS. Basic C# knowledge is a plus! 450 hours required.",
    postedTime: "2 hours ago"
  },
  {
    id: 2,
    company: "Commission on Appointments",
    logoInitial: "C",
    title: "System Development Trainee",
    location: "Pasay City, Metro Manila",
    description: "Seeking interns to assist in redesigning and maintaining our internal library management system. Experience with PHP, CodeIgniter, and modern UI/CSS redesigns preferred.",
    postedTime: "5 hours ago"
  },
  {
    id: 3,
    company: "TechNova Solutions",
    logoInitial: "T",
    title: "Junior React Developer (OJT)",
    location: "Remote",
    description: "Join our remote team as a React intern. You will work on real-world web applications, learning modern state management, Next.js, and Firebase integration.",
    postedTime: "1 day ago"
  }
];

export default function Home() {
  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-8 animate-in fade-in duration-500">
      
      {/* Feed Filter Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm flex items-center justify-between">
        <h2 className="font-semibold text-zinc-800 dark:text-zinc-200">Recommended for your skills</h2>
        <span className="text-sm text-purple-600 font-medium cursor-pointer hover:underline">Sort by: Recent</span>
      </div>

      {/* The Feed */}
      <div className="space-y-4">
        {MOCK_FEED.map((job) => (
          <JobCard 
            key={job.id} 
            company={job.company}
            logoInitial={job.logoInitial}
            title={job.title}
            location={job.location}
            description={job.description}
            postedTime={job.postedTime}
          />
        ))}
      </div>

    </div>
  );
}