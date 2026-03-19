import { useState } from 'react';
import { Mail, Briefcase, ShieldAlert, Lock, X, ArrowLeft, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- FIREBASE IMPORTS ---
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// IMPORT YOUR ASSETS HERE
import bgImage from '../assets/Background Image.png';
import tugmaLogo from '../assets/tugma_logo_white.png';

type AuthView = 'student' | 'employer' | 'admin';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [authView, setAuthView] = useState<AuthView>('student');

  // --- FORM STATES ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- LOADING & ERROR STATES ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const navigate = useNavigate();

  // --- THE REAL FIREBASE LOGIC ---
  const handleAuth = async (e: React.FormEvent, role: AuthView) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // ==========================
        //        SIGN IN FLOW
        // ==========================
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // Let's fetch their document to make sure we route them to the RIGHT dashboard
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const trueRole = userDoc.data().role;
          if (trueRole === 'student') navigate('/dashboard');
          else if (trueRole === 'employer') navigate('/employer/dashboard');
          else if (trueRole === 'admin') navigate('/admin/dashboard');
        } else {
          // Fallback if doc doesn't exist
          navigate(role === 'student' ? '/dashboard' : role === 'employer' ? '/employer/dashboard' : '/admin/dashboard');
        }

      } else {
        // ==========================
        //        SIGN UP FLOW
        // ==========================
        if (role === 'student' && password !== confirmPassword) {
          setError("Passwords do not match!");
          setLoading(false);
          return;
        }

        // 1. Create the account in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Set up initial blank profile data based on their role
        let initialProfileData = {};
        if (role === 'student') {
          initialProfileData = {
            name: "", title: "", location: "", school: "", about: "", skills: [],
            avatarUrl: "", coverUrl: "", ojt: { status: "Actively Looking", requiredHours: 450, completedHours: 0 }
          };
        } else if (role === 'employer') {
          initialProfileData = {
            companyName: "", tagline: "", about: "", perks: [], location: "", website: "", contactEmail: email, logoUrl: "", bannerUrl: ""
          };
        } else if (role === 'admin') {
          initialProfileData = { name: "New Admin", accessLevel: "moderator" };
        }

        // 3. Save to Firestore Database
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: role,
          createdAt: serverTimestamp(),
          isProfileComplete: false,
          profile: initialProfileData
        });

        // 4. Send them to their dashboard
        if (role === 'student') navigate('/dashboard');
        else if (role === 'employer') navigate('/employer/dashboard');
        else if (role === 'admin') navigate('/admin/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      // Clean up Firebase error messages for the UI
      if (err.code === 'auth/email-already-in-use') setError('Email is already registered.');
      else if (err.code === 'auth/invalid-credential') setError('Invalid email or password.');
      else if (err.code === 'auth/weak-password') setError('Password must be at least 6 characters.');
      else setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex font-sans bg-[#0a0310] relative overflow-hidden">

      {/* --- MODALS OMITTED FOR BREVITY, KEEP YOUR EXISTING ONES HERE --- */}

      <div className="absolute top-6 left-6 lg:top-8 lg:left-10 z-20">
        <img src={tugmaLogo} alt="Tugma Logo" className="h-28 md:h-28 w-30 object-contain" />
      </div>

      <div className="hidden lg:flex w-1/2 h-full relative bg-cover bg-right" style={{ backgroundImage: `url('${bgImage}')` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0310] via-transparent to-transparent opacity-80"></div>
        <div className="absolute bottom-16 left-10 z-10">
          <h1 className="text-4xl xl:text-[42px] font-black text-white leading-[1.2] tracking-tight">
            SIGN IN TO YOUR <br />
            <span className="text-[#913ceb]">ADVENTURE!</span>
          </h1>
        </div>
      </div>

      <div className="w-full lg:w-1/2 h-full overflow-y-auto flex flex-col items-center justify-center px-6 sm:px-12 py-20 lg:py-0 relative bg-[#0a0310]">

        {authView === 'student' && (
          <div className="absolute top-8 right-6 lg:right-10 text-white text-xs font-semibold tracking-wide">
            <span className="hidden sm:inline text-white/60 font-medium mr-2">
              {isLogin ? "DON'T HAVE AN ACCOUNT?" : "HAVE AN ACCOUNT?"}
            </span>
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-[#913ceb] hover:text-[#a855f7] transition-colors uppercase tracking-wider"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        )}

        <div className="w-full max-w-[380px] my-auto pb-20 lg:pb-0">

          {authView !== 'student' && (
            <button
              onClick={() => { setAuthView('student'); setIsLogin(true); setError(''); }}
              className="flex items-center gap-2 text-white/50 hover:text-white mb-6 text-xs font-medium transition-colors"
            >
              <ArrowLeft size={14} /> Back to Student Login
            </button>
          )}

          <h2 className="text-3xl sm:text-4xl font-black text-white mb-8 tracking-wide uppercase">
            {authView === 'admin' ? 'Admin Access' : authView === 'employer' ? 'Employer Portal' : (isLogin ? 'SIGN IN' : 'SIGN UP')}
          </h2>

          {/* ======================= THE FORM ======================= */}
          <form onSubmit={(e) => handleAuth(e, authView)}>
            <div className="flex flex-col space-y-4 min-h-[240px] justify-start">

              <div className="w-full">
                <label className="block text-xs font-bold text-white mb-2 tracking-wide">
                  {isLogin || authView !== 'student' ? 'Sign in with email address' : 'Register your email address'}
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-white transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Yourname@gmail.com"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-[#1b0e2f] rounded-xl focus:ring-2 focus:ring-[#913ceb]/50 outline-none text-white text-sm placeholder-white/40 transition-all border border-transparent"
                  />
                </div>
              </div>

              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-white tracking-wide">Password</label>
                  {isLogin && (
                    <button type="button" onClick={() => setShowForgotModal(true)} className="text-[11px] font-medium text-[#913ceb] hover:text-[#a855f7] hover:underline transition-colors">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-white transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-[#1b0e2f] rounded-xl focus:ring-2 focus:ring-[#913ceb]/50 outline-none text-white text-sm placeholder-white/40 transition-all border border-transparent"
                  />
                </div>
              </div>

              {!isLogin && authView === 'student' && (
                <div className="w-full animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs font-bold text-white mb-2 tracking-wide">Confirm Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-white transition-colors" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-[#1b0e2f] rounded-xl focus:ring-2 focus:ring-[#913ceb]/50 outline-none text-white text-sm placeholder-white/40 transition-all border border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ERROR MESSAGE DISPLAY */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-2 text-red-400 text-xs">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-[15px] bg-gradient-to-r from-[#6d3bd9] to-[#4f6edb] hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md shadow-purple-900/20"
              >
                {loading ? 'Processing...' : (authView === 'admin' ? 'Access Console' : authView === 'employer' ? 'Enter Portal' : (isLogin ? 'Sign in' : 'Sign up'))}
              </button>
            </div>
          </form>

          {/* OMITTED SOCIAL LOGINS FOR BREVITY, KEEP YOURS HERE */}

        </div>

        {authView === 'student' && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-5 text-[13px] whitespace-nowrap">
            <button
              onClick={() => { setAuthView('employer'); setIsLogin(true); setError(''); }}
              className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
            >
              <Briefcase size={14} /> Employer Portal
            </button>
            <div className="w-px h-4 bg-white/10 mt-0.5"></div>
            <button
              onClick={() => { setAuthView('admin'); setIsLogin(true); setError(''); }}
              className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
            >
              <ShieldAlert size={14} /> Admin Access
            </button>
          </div>
        )}

      </div>
    </div>
  );
}