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
        // SIGN IN FLOW
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const trueRole = userDoc.data().role;
          if (trueRole === 'student') navigate('/dashboard');
          else if (trueRole === 'employer') navigate('/employer/dashboard');
          else if (trueRole === 'admin') navigate('/admin/dashboard');
        } else {
          navigate(role === 'student' ? '/dashboard' : role === 'employer' ? '/employer/dashboard' : '/admin/dashboard');
        }

      } else {
        // SIGN UP FLOW
        if (role === 'student' && password !== confirmPassword) {
          setError("Passwords do not match!");
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

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

        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: role,
          createdAt: serverTimestamp(),
          isProfileComplete: false,
          profile: initialProfileData
        });

        if (role === 'student') navigate('/dashboard');
        else if (role === 'employer') navigate('/employer/dashboard');
        else if (role === 'admin') navigate('/admin/dashboard');
      }
    } catch (err: any) {
      console.error(err);
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

      {/* =========================================
          MODALS
          ========================================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#130924] border border-[#913ceb]/30 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setShowForgotModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Reset Password</h3>
            <p className="text-sm text-white/60 mb-6">Enter your email and we'll send you a link to reset your password.</p>
            <input
              type="email"
              placeholder="Yourname@gmail.com"
              className="w-full px-4 py-3 bg-[#1b0e2f] rounded-xl focus:ring-2 focus:ring-[#913ceb]/50 outline-none text-white placeholder-white/40 mb-4 text-sm"
            />
            <button className="w-full py-3 rounded-xl text-white font-semibold bg-[#913ceb] hover:bg-[#a855f7] transition-colors text-sm">
              Send Reset Link
            </button>
          </div>
        </div>
      )}

      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#130924] border border-[#913ceb]/30 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative flex flex-col max-h-[80vh]">
            <button onClick={() => setShowTermsModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-white mb-4">Terms and Conditions</h3>
            <div className="overflow-y-auto pr-2 text-sm text-white/70 space-y-4 custom-scrollbar">
              <p>Welcome to Tugma. By accessing or using our platform, you agree to be bound by these terms.</p>
              <p><strong>1. User Accounts:</strong> You are responsible for safeguarding your password and any activities or actions under your account.</p>
              <p><strong>2. Acceptable Use:</strong> You agree not to misuse the platform. This includes not interfering with our services or trying to access them using a method other than the interface and the instructions that we provide.</p>
              <p><strong>3. Privacy:</strong> Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and share your information.</p>
              <p><strong>4. Termination:</strong> We may suspend or terminate your access to the services if you violate these terms or if we are required to do so by law.</p>
            </div>
            <button onClick={() => setShowTermsModal(false)} className="w-full mt-6 py-3 rounded-xl text-white font-semibold bg-[#261445] hover:bg-[#311b59] transition-colors text-sm">
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* =========================================
          MAIN LAYOUT
          ========================================= */}
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

          {/* Social Logins & Terms (Only show for Student View) */}
          
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