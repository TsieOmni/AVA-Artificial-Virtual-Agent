import React, { useState, useEffect } from 'react';
import { AvaLogo, UserIcon, TutorIcon, VideoCameraIcon, BookOpenIcon, EnvelopeIcon, LockClosedIcon } from './Icons';

interface AuthProps {
  onAuthSuccess: () => void;
}

const animatedFeatures = [
    {
      icon: <UserIcon className="w-12 h-12 text-white/80" />,
      title: 'Your Personal AI Companion',
      description: 'AVA adapts to you, learning your preferences for a truly personalized experience.',
    },
    {
      icon: <TutorIcon className="w-12 h-12 text-white/80" />,
      title: 'Unlock Your Potential',
      description: 'From academic tutoring to entrepreneurial guidance, our specialized agents are here to help you succeed.',
    },
    {
      icon: <VideoCameraIcon className="w-12 h-12 text-white/80" />,
      title: 'See the World Anew',
      description: 'Analyze your surroundings in real-time with our live video feed and interactive blackboard.',
    },
    {
      icon: <BookOpenIcon className="w-12 h-12 text-white/80" />,
      title: 'Your Knowledge, Amplified',
      description: 'Securely upload your documents to create a personalized knowledgebase for tailored answers.',
    },
];

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.223 0-9.657-3.356-11.303-7.918l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.011 35.39 44 30.134 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
    </svg>
);


const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimatingOut(true);
      setTimeout(() => {
        setActiveIndex(prevIndex => (prevIndex + 1) % animatedFeatures.length);
        setIsAnimatingOut(false);
      }, 700);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
    }
    const newUser = { fullName, email }; 
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem(`user_auth_${email}`, password);
    onAuthSuccess();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const storedPassword = localStorage.getItem(`user_auth_${email}`);
    const storedUserStr = localStorage.getItem('user');
    
    if (storedPassword && storedUserStr) {
      const storedUser = JSON.parse(storedUserStr);
      if (storedUser.email === email && storedPassword === password) {
        onAuthSuccess();
        return;
      }
    }
    setError('Invalid email or password.');
  };

  const isLogin = mode === 'login';
  const currentFeature = animatedFeatures[activeIndex];

  return (
    <div className="flex min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Left Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-sm">
          <AvaLogo className="w-12 h-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900">{isLogin ? 'Login' : 'Create an Account'}</h1>
          <p className="text-gray-500 mt-2 mb-8">{isLogin ? 'See your growth and get consulting support!' : 'Join us and turn your ideas into reality.'}</p>

          <button className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mb-4 text-gray-700 font-medium">
              <GoogleIcon />
              Sign in with Google
          </button>
          
          <div className="flex items-center my-6">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-sm">or Sign in with Email</span>
              <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-5">
            {error && <p className="text-red-500 text-sm text-center bg-red-100 p-3 rounded-lg">{error}</p>}
            
            {!isLogin && (
                 <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Full Name*</label>
                    <div className="relative">
                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"/>
                    </div>
                </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Email*</label>
              <div className="relative">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full py-3 px-4 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"/>
              </div>
            </div>

            <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Password*</label>
                <div className="relative">
                    <LockClosedIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input type="password" placeholder={isLogin ? '' : 'Min. 8 characters'} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full py-3 px-4 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]" />
                </div>
            </div>

            {!isLogin && (
                <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Confirm Password*</label>
                    <div className="relative">
                        <LockClosedIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full py-3 px-4 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"/>
                    </div>
                </div>
            )}
            
            {isLogin && (
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"/>
                        <label htmlFor="remember" className="text-gray-600">Remember me</label>
                    </div>
                    <a href="#" onClick={(e) => { e.preventDefault(); alert("Password reset is not implemented."); }} className="font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]">Forgot password?</a>
                </div>
            )}
            
            <button type="submit" className="w-full bg-[var(--color-accent)] text-white font-semibold py-3 rounded-lg hover:bg-[var(--color-accent-hover)] transition-all transform hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent)]">
              {isLogin ? 'Login' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            {isLogin ? "Not registered yet?" : 'Already have an account?'}
            <button onClick={() => { setMode(isLogin ? 'register' : 'login'); setError(''); }} className="font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] ml-1">
              {isLogin ? 'Create an Account' : 'Login'}
            </button>
          </p>
        </div>
      </div>

      {/* Right Side: Animation */}
      <div className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-[#171C2E] to-[#1F2437] p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-no-repeat bg-center" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"100%25\" height=\"100%25\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cdefs%3E%3Cpattern id=\"p\" width=\"100\" height=\"100\" patternUnits=\"userSpaceOnUse\" patternTransform=\"rotate(45)\"%3E%3Cpath id=\"a\" data-color=\"outline\" fill=\"none\" stroke=\"%232C3249\" stroke-width=\"1\" d=\"M0 0l100 100M100 0L0 100\"/%3E%3C/pattern%3E%3C/defs%3E%3Crect fill=\"url(%23p)\" width=\"100%25\" height=\"100%25\"/%3E%3C/svg%3E')" }}></div>
          <div className="relative z-10 w-full max-w-md text-center">
            <div className={`transition-all duration-700 ${isAnimatingOut ? 'animate-slide-out-fade' : 'animate-slide-in-fade'}`}>
                <div className="bg-white/10 w-24 h-24 rounded-2xl mx-auto flex items-center justify-center mb-6">
                    {currentFeature.icon}
                </div>
                <h2 className="text-3xl font-bold mb-4">{currentFeature.title}</h2>
                <p className="text-lg text-white/70">{currentFeature.description}</p>
            </div>
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {animatedFeatures.map((_, index) => (
                <div key={index} className={`w-2 h-2 rounded-full transition-all duration-300 ${activeIndex === index ? 'bg-white w-6' : 'bg-white/30'}`}></div>
            ))}
          </div>
      </div>
    </div>
  );
};

export default Auth;
