import { useState } from 'react';
import { Mail, Lock, X, AlertCircle, User, Building, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- FIREBASE IMPORTS ---
import { auth, googleProvider } from '../firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup
} from 'firebase/auth';

import bgImage from '../assets/Background Image.png';
import tugmaLogo from '../assets/tugma_logo_white.png';

type SignUpRole = 'student' | 'employer';

export default function Auth() {
  // Master View State
  const [isLogin, setIsLogin] = useState(true);
  const [signUpRole, setSignUpRole] = useState<SignUpRole>('student');

  // --- FORM STATES ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Sign Up Specific States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState('1-10');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const navigate = useNavigate();

  // =========================================================
  //  1. UNIFIED AUTHENTICATION LOGIC
  // =========================================================
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // =======================================
        // UNIFIED SIGN IN (Handles ALL roles)
        // =======================================
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUid = userCredential.user.uid;

        const response = await fetch(`http://localhost:8080/api/users/role/${firebaseUid}`);
        if (response.ok) {
          const data = await response.json();
          const trueRole = data.role;
          // Smart Routing based on database role!
          navigate(trueRole === 'student' ? '/dashboard' : trueRole === 'employer' ? '/employer/dashboard' : '/admin/dashboard');
        } else {
          // Fallback if DB fetch fails
          navigate('/dashboard');
        }

      } else {
        // =======================================
        // DYNAMIC SIGN UP (Student or Employer)
        // =======================================
        if (password !== confirmPassword) {
          setError("Passwords do not match!");
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const payload = {
          firebase_uid: user.uid,
          email: user.email,
          role: signUpRole,
          firstName: firstName || null,
          lastName: lastName || null,
          companyName: signUpRole === 'employer' ? companyName : null,
          companySize: signUpRole === 'employer' ? companySize : null,
        };

        const response = await fetch('http://localhost:8080/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Failed to save user to database");

        navigate(signUpRole === 'student' ? '/dashboard' : '/employer/dashboard');
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

  // =========================================================
  //  2. SOCIAL LOGIN LOGIC (Google)
  // =========================================================
  const handleSocialLogin = async (provider: any) => {
    setError('');
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const roleResponse = await fetch(`http://localhost:8080/api/users/role/${user.uid}`);

      if (roleResponse.ok) {
        // User exists -> Smart Route
        const data = await roleResponse.json();
        const trueRole = data.role;
        navigate(trueRole === 'student' ? '/dashboard' : trueRole === 'employer' ? '/employer/dashboard' : '/admin/dashboard');
      } else {
        // New User -> Register them based on current view
        const targetRole = isLogin ? 'student' : signUpRole; // Default to student if logging in
        const nameParts = user.displayName ? user.displayName.split(' ') : [''];

        const payload = {
          firebase_uid: user.uid,
          email: user.email,
          role: targetRole,
          firstName: nameParts[0] || null,
          lastName: nameParts.slice(1).join(' ') || null,
          companyName: null,
          companySize: null
        };

        const registerResponse = await fetch('http://localhost:8080/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!registerResponse.ok) throw new Error("Failed to sync social login with database.");

        navigate(targetRole === 'student' ? '/dashboard' : '/employer/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message.replace('Firebase: ', ''));
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="h-screen w-full flex font-sans bg-[#0a0310] overflow-hidden">

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
            </div>
            <button onClick={() => setShowTermsModal(false)} className="w-full mt-6 py-3 rounded-xl text-white font-semibold bg-[#261445] hover:bg-[#311b59] transition-colors text-sm">
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* =========================================
          LEFT SIDE: FULL IMAGE (DESKTOP ONLY)
          ========================================= */}
      <div className="hidden lg:flex w-1/2 h-full relative bg-cover bg-right" style={{ backgroundImage: `url('${bgImage}')` }}>
        {/* Desktop Logo */}
        <div className="absolute top-8 left-10 z-20">
          <img src={tugmaLogo} alt="Tugma Logo" className="h-28 object-contain" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0310] via-transparent to-transparent opacity-80"></div>
        <div className="absolute bottom-16 left-10 z-10">
          <h1 className="text-4xl xl:text-[42px] font-black text-white leading-[1.2] tracking-tight">
            SIGN IN TO YOUR <br />
            <span className="text-[#913ceb]">ADVENTURE!</span>
          </h1>
        </div>
      </div>

      {/* =========================================
          RIGHT SIDE: FORM AREA
          ========================================= */}
      <div className="w-full lg:w-1/2 h-full flex flex-col overflow-y-auto custom-scrollbar bg-[#0a0310]">

        {/* Mobile Logo (Only visible on small screens, sits natively at top) */}
        <div className="lg:hidden w-full flex justify-center pt-8 pb-2 shrink-0">
          <img src={tugmaLogo} alt="Tugma Logo" className="h-20 object-contain" />
        </div>

        {/* Top Nav (Sign In / Sign Up toggle) */}
        <div className="flex justify-end px-6 lg:px-10 pt-4 lg:pt-8 shrink-0">
          <span className="hidden sm:inline text-white/60 text-xs font-medium mr-2">
            {isLogin ? "DON'T HAVE AN ACCOUNT?" : "ALREADY HAVE AN ACCOUNT?"}
          </span>
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-[#913ceb] hover:text-[#a855f7] text-xs font-bold transition-colors uppercase tracking-wider"
          >
            {isLogin ? 'Create an Account' : 'Sign In Here'}
          </button>
        </div>

        {/* --- FORM CONTAINER --- */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 py-8 max-w-[460px] mx-auto w-full">

          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-wide uppercase">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-white/50 text-sm mb-8">
            {isLogin ? 'Enter your details to access your portal.' : 'Join Tugma and discover your next match.'}
          </p>

          {/* DYNAMIC ROLE TOGGLE (Only visible on Sign Up) */}
          {!isLogin && (
            <div className="flex p-1 bg-[#1b0e2f] rounded-xl mb-6 animate-in fade-in duration-300">
              <button
                type="button"
                onClick={() => setSignUpRole('student')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${signUpRole === 'student' ? 'bg-[#913ceb] text-white shadow-md' : 'text-white/50 hover:text-white'}`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setSignUpRole('employer')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${signUpRole === 'employer' ? 'bg-[#913ceb] text-white shadow-md' : 'text-white/50 hover:text-white'}`}
              >
                Employer
              </button>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">

            {/* ----- STUDENT SIGN UP FIELDS ----- */}
            {!isLogin && signUpRole === 'student' && (
              <div className="flex gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="w-1/2">
                  <label className="block text-xs font-bold text-white mb-2 tracking-wide">First Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-white transition-colors" />
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Jane" className="w-full pl-11 pr-4 py-3 bg-[#1b0e2f] rounded-xl focus:ring-2 focus:ring-[#913ceb]/50 outline-none text-white text-sm placeholder-white/40 transition-all" />
                  </div>
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-bold text-white mb-2 tracking-wide">Last Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-white transition-colors" />
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Doe" className="w-full pl-11 pr-4 py-3 bg-[#1b0e2f] rounded-xl focus:ring-2 focus:ring-[#913ceb]/50 outline-none text-white text-sm placeholder-white/40 transition-all" />
                  </div>
                </div>
              </div>
            )}

            {/* ----- EMPLOYER SIGN UP FIELDS ----- */}
            {!isLogin && signUpRole === 'employer' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-xs font-bold text-white mb-2 tracking-wide">Rep First Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-white transition-colors" />
                      <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Jane" className="w-full pl-11 pr-4 py-3 bg-[#1b0e2f] rounded-xl focus:ring-2 focus:ring-[#913ceb]/50 outline-none text-white text-sm placeholder-white/40 transition-all" />
                    </div>
                  </div>
                  <div className="w-1/2">
                    <label className="block text-xs font-bold text-white mb-2 tracking-wide">Rep Last Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-white transition-colors" />
                      <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Doe" className="w-full pl-11 pr-4 py-3 bg-[#1b0e2f] rounded-xl focus:ring-2 focus:ring-[#913ceb]/50 outline-none text-white text-sm placeholder-white/40 transition-all" />
                    </div>
                  </div>
                </div>

                <div className="w-full">
                  <label className="block text-xs font-bold text-white mb-2 tracking-wide">Company Name</label>
                  <div className="relative group">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-white transition-colors" />
                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required placeholder="Acme Corp" className="w-full pl-11 pr-4 py-3 bg-[#1b0e2f] rounded-xl focus:ring-2 focus:ring-[#913ceb]/50 outline-none text-white text-sm placeholder-white/40 transition-all" />
                  </div>
                </div>

                <div className="w-full">
                  <label className="block text-xs font-bold text-white mb-2 tracking-wide">Company Size</label>
                  <div className="relative group">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-white transition-colors" />
                    <select
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-[#1b0e2f] rounded-xl focus:ring-2 focus:ring-[#913ceb]/50 outline-none text-white text-sm transition-all appearance-none"
                    >
                      <option value="1-10">1-10 Employees</option>
                      <option value="11-50">11-50 Employees</option>
                      <option value="51-200">51-200 Employees</option>
                      <option value="201-500">201-500 Employees</option>
                      <option value="500+">500+ Employees</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="w-full">
              <label className="block text-xs font-bold text-white mb-2 tracking-wide">
                Email address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-white transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#1b0e2f] rounded-xl focus:ring-2 focus:ring-[#913ceb]/50 outline-none text-white text-sm placeholder-white/40 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
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
                  className="w-full pl-11 pr-4 py-3 bg-[#1b0e2f] rounded-xl focus:ring-2 focus:ring-[#913ceb]/50 outline-none text-white text-sm placeholder-white/40 transition-all"
                />
              </div>
            </div>

            {/* Confirm Password (Hidden on Login) */}
            {!isLogin && (
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
                    className="w-full pl-11 pr-4 py-3 bg-[#1b0e2f] rounded-xl focus:ring-2 focus:ring-[#913ceb]/50 outline-none text-white text-sm placeholder-white/40 transition-all"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-2 text-red-400 text-xs">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-[15px] bg-gradient-to-r from-[#6d3bd9] to-[#4f6edb] hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md shadow-purple-900/20"
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </div>
          </form>

          {/* SOCIAL LOGINS (Google) */}
          <div className="relative flex items-center my-6">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-white/50 text-[11px] font-medium uppercase">
              Or continue with
            </span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <div className="w-full mb-6">
            <button
              type="button"
              onClick={() => handleSocialLogin(googleProvider)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#261445] hover:bg-[#311b59] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
          </div>

          {!isLogin && (
            <p className="text-[11px] text-white/50 text-center pb-4">
              By registering you agree to our <button type="button" onClick={() => setShowTermsModal(true)} className="text-[#913ceb] hover:text-[#a855f7] font-medium hover:underline transition-colors">Terms and Conditions</button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}