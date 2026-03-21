import { useState } from 'react';
import { Mail, Briefcase, ShieldAlert, Lock, X, AlertCircle, User, Building, Users, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- FIREBASE IMPORTS ---
import { auth, googleProvider } from '../firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';

import bgImage from '../assets/Background Image.png';
import tugmaLogo from '../assets/tugma_logo_white.png';

type SignUpRole = 'student' | 'employer';
type AuthView = 'student' | 'employer' | 'admin';

export default function Auth() {
  // Master View State
  const [isLogin, setIsLogin] = useState(true);
  const [authView, setAuthView] = useState<AuthView>('student');
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

  // Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Password Reset States
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<{ text: string, type: 'success' | 'error' | '' }>({ text: '', type: '' });

  // Google Role Selection Modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<any>(null);

  const navigate = useNavigate();

  // 🔥 NEW: SILENT AUDIT LOGGER 🔥
  const logSystemEvent = (uid: string, action: string, details: string) => {
    fetch('http://localhost:8080/api/audit/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, action, details })
    }).catch(err => console.error("Audit log failed (silent):", err));
  };

  // =========================================================
  //  1. UNIFIED EMAIL / PASSWORD LOGIC
  // =========================================================
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin || authView === 'admin') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUid = userCredential.user.uid;

        const response = await fetch(`http://localhost:8080/api/users/role/${firebaseUid}`);
        if (response.ok) {
          const data = await response.json();
          const trueRole = data.role;

          // 🔥 LOG LOGIN 🔥
          logSystemEvent(firebaseUid, 'User Login', `Logged in via Email/Password as ${trueRole.toUpperCase()}`);

          navigate(trueRole === 'student' ? '/dashboard' : trueRole === 'employer' ? '/employer/dashboard' : '/admin/dashboard');
        } else {
          // 🔥 LOG LOGIN (Fallback) 🔥
          logSystemEvent(firebaseUid, 'User Login', `Logged in via Email/Password as ${authView.toUpperCase()}`);
          navigate(authView === 'student' ? '/dashboard' : authView === 'employer' ? '/employer/dashboard' : '/admin/dashboard');
        }

      } else {
        if (password !== confirmPassword) {
          setError("Passwords do not match!");
          setLoading(false);
          return;
        }

        // 1. Create in Firebase
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Save to MySQL
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

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          await user.delete();
          throw new Error(result.messages?.error || result.message || "Failed to save user to database");
        }

        // 🔥 LOG SIGN UP 🔥
        logSystemEvent(user.uid, 'Account Created', `Registered new ${signUpRole.toUpperCase()} account via Email/Password.`);

        navigate(signUpRole === 'student' ? '/dashboard' : '/employer/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError('Email is already registered.');
      else if (err.code === 'auth/invalid-credential') setError('Invalid email or password.');
      else if (err.code === 'auth/weak-password') setError('Password must be at least 6 characters.');
      else setError(`Server Error: ${err.message.replace('Firebase: ', '')}`);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  //  2. SOCIAL LOGIN (Google) - INTERCEPT NEW USERS
  // =========================================================
  const handleSocialLogin = async (provider: any) => {
    setError('');
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const roleResponse = await fetch(`http://localhost:8080/api/users/role/${user.uid}`);

      if (roleResponse.ok) {
        // Returning User -> Let them straight in!
        const data = await roleResponse.json();
        const trueRole = data.role;

        // 🔥 LOG GOOGLE LOGIN 🔥
        logSystemEvent(user.uid, 'User Login', `Logged in via Google SSO as ${trueRole.toUpperCase()}`);

        navigate(trueRole === 'student' ? '/dashboard' : trueRole === 'employer' ? '/employer/dashboard' : '/admin/dashboard');
      } else {
        // Brand New User -> PAUSE! Ask them who they are.
        setPendingGoogleUser(user);
        setShowRoleModal(true);
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

  // =========================================================
  //  3. FINISH GOOGLE SIGN UP AFTER ROLE SELECTION
  // =========================================================
  const finalizeGoogleSignUp = async (selectedRole: SignUpRole) => {
    if (!pendingGoogleUser) return;

    setLoading(true);
    setShowRoleModal(false);

    try {
      const nameParts = pendingGoogleUser.displayName ? pendingGoogleUser.displayName.split(' ') : [''];

      const payload = {
        firebase_uid: pendingGoogleUser.uid,
        email: pendingGoogleUser.email,
        role: selectedRole,
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

      const result = await registerResponse.json().catch(() => ({}));

      if (!registerResponse.ok) {
        throw new Error(result.messages?.error || result.message || "Failed to sync social login with database.");
      }

      // 🔥 LOG GOOGLE SIGN UP 🔥
      logSystemEvent(pendingGoogleUser.uid, 'Account Created', `Registered new ${selectedRole.toUpperCase()} account via Google SSO.`);

      navigate(selectedRole === 'student' ? '/dashboard' : '/employer/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(`Google Sync Error: ${err.message}`);
    } finally {
      setLoading(false);
      setPendingGoogleUser(null);
    }
  };

  // =========================================================
  //  4. HANDLE PASSWORD RESET
  // =========================================================
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;

    setLoading(true);
    setResetMessage({ text: '', type: '' });

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage({ text: 'Password reset link sent! Check your inbox.', type: 'success' });

      // 🔥 LOG FORGOT PASSWORD 🔥 (Uses 'SYSTEM' as uid since they aren't logged in)
      logSystemEvent('SYSTEM', 'Password Reset Requested', `A password reset link was sent to ${resetEmail}`);

      setTimeout(() => {
        setShowForgotModal(false);
        setResetEmail('');
        setResetMessage({ text: '', type: '' });
      }, 3000);

    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Failed to send reset email. Please try again.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        errorMsg = 'We could not find an account with that email address.';
      }
      setResetMessage({ text: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex font-sans bg-[#0a0310] overflow-hidden">

      {/* =========================================
          MODALS
          ========================================= */}

      {/* 🌟 THE ROLE SELECTION MODAL 🌟 */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#130924] border border-[#913ceb]/50 w-full max-w-sm rounded-3xl p-8 shadow-[0_0_40px_rgba(145,60,235,0.15)] relative flex flex-col items-center text-center">

            <div className="w-16 h-16 bg-[#1b0e2f] rounded-full flex items-center justify-center mb-4 border border-[#913ceb]/30">
              <svg className="w-8 h-8 text-[#913ceb]" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" />
              </svg>
            </div>

            <h3 className="text-2xl font-black text-white mb-2 tracking-wide">Almost There!</h3>
            <p className="text-sm text-white/60 mb-8">How would you like to use Tugma?</p>

            <div className="flex flex-col w-full gap-3">
              <button
                onClick={() => finalizeGoogleSignUp('student')}
                className="w-full py-3.5 rounded-xl text-white font-bold bg-[#261445] hover:bg-[#913ceb] border border-white/5 hover:border-transparent transition-all flex items-center justify-center gap-3 group shadow-lg"
              >
                <User size={18} className="text-white/50 group-hover:text-white transition-colors" />
                I am a Student
              </button>
              <button
                onClick={() => finalizeGoogleSignUp('employer')}
                className="w-full py-3.5 rounded-xl text-white font-bold bg-[#261445] hover:bg-[#913ceb] border border-white/5 hover:border-transparent transition-all flex items-center justify-center gap-3 group shadow-lg"
              >
                <Briefcase size={18} className="text-white/50 group-hover:text-white transition-colors" />
                I am an Employer
              </button>
            </div>

            <button
              onClick={() => {
                setShowRoleModal(false);
                setPendingGoogleUser(null);
                signOut(auth);
              }}
              className="mt-6 text-[11px] text-white/40 hover:text-white transition-colors uppercase tracking-wider font-semibold"
            >
              Cancel Registration
            </button>
          </div>
        </div>
      )}

      {/* 🔥 FORGOT PASSWORD MODAL 🔥 */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#130924] border border-[#913ceb]/30 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => { setShowForgotModal(false); setResetMessage({ text: '', type: '' }); }}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Reset Password</h3>
            <p className="text-sm text-white/60 mb-4">Enter your email and we'll send you a link to reset your password.</p>

            {resetMessage.text && (
              <div className={`p-3 mb-4 rounded-xl text-xs font-bold border flex items-center gap-2 ${resetMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                {resetMessage.type === 'error' && <AlertCircle size={14} className="shrink-0" />}
                {resetMessage.text}
              </div>
            )}

            <form onSubmit={handleResetPassword}>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Yourname@gmail.com"
                required
                className="w-full px-4 py-3 bg-[#1b0e2f] rounded-xl focus:ring-2 focus:ring-[#913ceb]/50 outline-none text-white placeholder-white/40 mb-4 text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold bg-[#913ceb] hover:bg-[#a855f7] transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
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

        <div className="lg:hidden w-full flex justify-center pt-8 pb-2 shrink-0">
          <img src={tugmaLogo} alt="Tugma Logo" className="h-20 object-contain" />
        </div>

        {/* Top Nav (Sign In / Sign Up toggle) */}
        {authView !== 'admin' && (
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
        )}

        {/* --- FORM CONTAINER --- */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 py-8 max-w-[460px] mx-auto w-full">

          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-wide uppercase">
            {authView === 'admin'
              ? 'Admin Access'
              : isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>

          <p className="text-white/50 text-sm mb-8">
            {authView === 'admin'
              ? 'Enter your system credentials.'
              : isLogin ? 'Enter your details to access your portal.' : 'Join Tugma and discover your next match.'}
          </p>

          {/* DYNAMIC ROLE TOGGLE (Only visible on Sign Up) */}
          {!isLogin && authView !== 'admin' && (
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
            {!isLogin && authView !== 'admin' && signUpRole === 'student' && (
              <div className="flex gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="w-1/2">
                  <label className="block text-xs font-bold text-white mb-2 tracking-wide">First Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-white transition-colors" />
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Jane" className="w-full pl-11 pr-4 py-3 bg-[#1b0e2f] rounded-xl focus:ring-2 focus:ring-[#913ceb]/50 outline-none text-white text-sm placeholder-white/40 transition-all border border-transparent" />
                  </div>
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-bold text-white mb-2 tracking-wide">Last Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-white transition-colors" />
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Doe" className="w-full pl-11 pr-4 py-3 bg-[#1b0e2f] rounded-xl focus:ring-2 focus:ring-[#913ceb]/50 outline-none text-white text-sm placeholder-white/40 transition-all border border-transparent" />
                  </div>
                </div>
              </div>
            )}

            {/* ----- EMPLOYER SIGN UP FIELDS ----- */}
            {!isLogin && authView !== 'admin' && signUpRole === 'employer' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-xs font-bold text-white mb-2 tracking-wide">Rep First Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-white transition-colors" />
                      <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Jane" className="w-full pl-11 pr-4 py-3 bg-[#1b0e2f] rounded-xl focus:ring-2 focus:ring-[#913ceb]/50 outline-none text-white text-sm placeholder-white/40 transition-all border border-transparent" />
                    </div>
                  </div>
                  <div className="w-1/2">
                    <label className="block text-xs font-bold text-white mb-2 tracking-wide">Rep Last Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-white transition-colors" />
                      <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Doe" className="w-full pl-11 pr-4 py-3 bg-[#1b0e2f] rounded-xl focus:ring-2 focus:ring-[#913ceb]/50 outline-none text-white text-sm placeholder-white/40 transition-all border border-transparent" />
                    </div>
                  </div>
                </div>

                <div className="w-full">
                  <label className="block text-xs font-bold text-white mb-2 tracking-wide">Company Name</label>
                  <div className="relative group">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-white transition-colors" />
                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required placeholder="Acme Corp" className="w-full pl-11 pr-4 py-3 bg-[#1b0e2f] rounded-xl focus:ring-2 focus:ring-[#913ceb]/50 outline-none text-white text-sm placeholder-white/40 transition-all border border-transparent" />
                  </div>
                </div>

                <div className="w-full">
                  <label className="block text-xs font-bold text-white mb-2 tracking-wide">Company Size</label>
                  <div className="relative group">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-white transition-colors" />
                    <select
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-[#1b0e2f] rounded-xl focus:ring-2 focus:ring-[#913ceb]/50 outline-none text-white text-sm transition-all appearance-none border border-transparent"
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
                  className="w-full pl-11 pr-4 py-3 bg-[#1b0e2f] rounded-xl focus:ring-2 focus:ring-[#913ceb]/50 outline-none text-white text-sm placeholder-white/40 transition-all border border-transparent"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-white tracking-wide">Password</label>
                {isLogin && authView !== 'admin' && (
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

            {/* Confirm Password (Hidden on Login and Admin) */}
            {!isLogin && authView !== 'admin' && (
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
                {loading ? 'Processing...' : (authView === 'admin' ? 'Access Console' : isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </div>
          </form>

          {/* SOCIAL LOGINS (Hidden for Admin) */}
          {authView !== 'admin' && (
            <>
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
            </>
          )}

        </div>

        {/* --- BOTTOM FOOTER --- */}
        <div className="flex-none h-16 w-full flex items-center justify-center px-6 pb-4">
          <div className="flex gap-5 text-[13px] whitespace-nowrap">
            {authView !== 'student' && authView !== 'employer' && (
              <button
                onClick={() => { setAuthView('student'); setIsLogin(true); setError(''); }}
                className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
              >
                <User size={14} /> User Portal
              </button>
            )}

            {authView !== 'admin' && (
              <>
                <button
                  onClick={() => { setAuthView('admin'); setIsLogin(true); setError(''); }}
                  className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
                >
                  <ShieldAlert size={14} /> Admin Access
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}