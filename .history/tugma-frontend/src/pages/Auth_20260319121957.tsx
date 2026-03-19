import { useState } from 'react';
import { Mail, Briefcase, ShieldAlert, Lock, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// IMPORT YOUR ASSETS HERE
import bgImage from '../assets/Background Image.png'; 
import tugmaLogo from '../assets/tugma_logo_white.png';

type AuthView = 'student' | 'employer' | 'admin';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [authView, setAuthView] = useState<AuthView>('student');
  
  // Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const navigate = useNavigate();

const handleLogin = (e: React.FormEvent, role: string) => {
    e.preventDefault();
    if (role === 'student') navigate('/dashboard');
    else if (role === 'employer') navigate('/employer/dashboard'); // <-- Add this
    else if (role === 'admin') navigate('/admin/dashboard');
  };

  return (
    // Outer container: Fixed screen height to prevent ANY layout jumping
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
          LOGO (Top Left) - SCALED DOWN
          ========================================= */}
      <div className="absolute top-6 left-6 lg:top-8 lg:left-10 z-20">
        <img src={tugmaLogo} alt="Tugma Logo" className="h-28 md:h-28 w-30 object-contain" />
      </div>

      {/* =========================================
          LEFT SIDE: Full Image 
          ========================================= */}
      <div className="hidden lg:flex w-1/2 h-full relative bg-cover bg-right" style={{ backgroundImage: `url('${bgImage}')` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0310] via-transparent to-transparent opacity-80"></div>
        <div className="absolute bottom-16 left-10 z-10">
          {/* SCALED DOWN HEADING */}
          <h1 className="text-4xl xl:text-[42px] font-black text-white leading-[1.2] tracking-tight">
            SIGN IN TO YOUR <br />
            <span className="text-[#913ceb]">ADVENTURE!</span>
          </h1> 
        </div>
      </div>

      {/* =========================================
          RIGHT SIDE: Form Area 
          ========================================= */}
<div className="w-full lg:w-1/2 h-full overflow-y-auto flex flex-col items-center justify-center px-6 sm:px-12 py-20 lg:py-0 relative bg-[#0a0310]">        
        {/* Top Right Toggle */}
        {authView === 'student' && (
          <div className="absolute top-8 right-6 lg:right-10 text-white text-xs font-semibold tracking-wide">
            <span className="hidden sm:inline text-white/60 font-medium mr-2">
              {isLogin ? "DON'T HAVE AN ACCOUNT?" : "HAVE AN ACCOUNT?"}
            </span>
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-[#913ceb] hover:text-[#a855f7] transition-colors uppercase tracking-wider"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        )}

        {/* Form Container - SCALED DOWN WIDTH & MARGINS */}
        <div className="w-full max-w-[380px] my-auto pb-20 lg:pb-0">
          
          {/* Back Button for Admin/Employer */}
          {authView !== 'student' && (
            <button 
              onClick={() => { setAuthView('student'); setIsLogin(true); }}
              className="flex items-center gap-2 text-white/50 hover:text-white mb-6 text-xs font-medium transition-colors"
            >
              <ArrowLeft size={14} /> Back to Student Login
            </button>
          )}

          {/* SCALED DOWN FORM HEADING */}
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-8 tracking-wide uppercase">
            {authView === 'admin' ? 'Admin Access' : authView === 'employer' ? 'Employer Portal' : (isLogin ? 'SIGN IN' : 'SIGN UP')}
          </h2>

          <form onSubmit={(e) => handleLogin(e, authView)}>
            {/* THE FIX: Adjusted min-height for slimmer inputs */}
            <div className="flex flex-col space-y-4 min-h-[240px] justify-start">
              
              {/* Email Field */}
              <div className="w-full">
                <label className="block text-xs font-bold text-white mb-2 tracking-wide">
                  {isLogin || authView !== 'student' ? 'Sign in with email address' : 'Register your email address'}
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-white transition-colors" />
                  <input 
                    type="email" 
                    placeholder="Yourname@gmail.com" 
                    required
                    /* SCALED DOWN PADDING AND TEXT SIZE (py-3, text-sm) */
                    className="w-full pl-11 pr-4 py-3 bg-[#1b0e2f] rounded-xl focus:ring-2 focus:ring-[#913ceb]/50 outline-none text-white text-sm placeholder-white/40 transition-all border border-transparent"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-white tracking-wide">
                    Password
                  </label>
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
                    placeholder="••••••••" 
                    required
                    className="w-full pl-11 pr-4 py-3 bg-[#1b0e2f] rounded-xl focus:ring-2 focus:ring-[#913ceb]/50 outline-none text-white text-sm placeholder-white/40 transition-all border border-transparent"
                  />
                </div>
              </div>

              {/* Confirm Password Field (Only Student Sign Up) */}
              {!isLogin && authView === 'student' && (
                <div className="w-full animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs font-bold text-white mb-2 tracking-wide">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-white transition-colors" />
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      required
                      className="w-full pl-11 pr-4 py-3 bg-[#1b0e2f] rounded-xl focus:ring-2 focus:ring-[#913ceb]/50 outline-none text-white text-sm placeholder-white/40 transition-all border border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button 
                type="submit"
                className="w-full py-3 rounded-xl text-white font-semibold text-[15px] bg-gradient-to-r from-[#6d3bd9] to-[#4f6edb] hover:opacity-90 transition-opacity shadow-md shadow-purple-900/20"
              >
                {authView === 'admin' ? 'Access Console' : authView === 'employer' ? 'Enter Portal' : (isLogin ? 'Sign in' : 'Sign up')}
              </button>
            </div>
          </form>

          {/* Social Logins & Terms (Only show for Student View) */}
          {authView === 'student' && (
            <>
              <div className="relative flex items-center my-6">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-white/50 text-[11px] font-medium uppercase">
                  Or continue with
                </span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <div className="flex gap-3 mb-6">
                <button type="button" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#261445] hover:bg-[#311b59] text-white text-sm font-semibold rounded-xl transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </button>
                <button type="button" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#261445] hover:bg-[#311b59] text-white text-sm font-semibold rounded-xl transition-colors">
                  <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              </div>

              <p className="text-[11px] text-white/50 text-center mb-4">
                By registering you agree to our <button type="button" onClick={() => setShowTermsModal(true)} className="text-[#913ceb] hover:text-[#a855f7] font-medium hover:underline transition-colors">Terms and Conditions</button>
              </p>
            </>
          )}
        </div>

        {/* Portal Links - Centered at the bottom */}
        {authView === 'student' && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-5 text-[13px] whitespace-nowrap">
            <button 
              onClick={() => { setAuthView('employer'); setIsLogin(true); }}
              className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
            >
              <Briefcase size={14} /> Employer Portal
            </button>
            <div className="w-px h-4 bg-white/10 mt-0.5"></div>
            <button 
              onClick={() => { setAuthView('admin'); setIsLogin(true); }}
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