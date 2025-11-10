import React, { useState } from 'react';
import { AvaLogo } from './Icons';

interface AuthProps {
  onAuthSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }
    // Simulate registration
    const newUser = { fullName, email }; 
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem(`user_auth_${email}`, password); // Insecure, for demo only
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] p-4 font-sans animate-fade-in">
        <div className="w-full max-w-md">
            <div className="text-center mb-8">
                <AvaLogo className="w-20 h-auto mx-auto mb-4" />
                <h1 className="text-2xl font-semibold">
                    {isLogin ? 'Welcome back' : 'Create your account'}
                </h1>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    Welcome to Ava - Your Intelligent Companion
                </p>
            </div>
            
            <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                
                {!isLogin && (
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
                    />
                )}
                <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
                />
                <div className="relative">
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
                    />
                    {isLogin && (
                       <a href="#" onClick={(e) => {e.preventDefault(); alert("Password reset functionality is not yet implemented.");}} className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                           Forgot password?
                       </a>
                    )}
                </div>
                {!isLogin && (
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
                    />
                )}
                
                <button 
                    type="submit"
                    className="w-full bg-[var(--color-accent)] text-white font-semibold py-3 rounded-md hover:bg-[var(--color-accent-hover)] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    {isLogin ? 'Log in' : 'Sign up'}
                </button>
            </form>
            
            <p className="text-center text-sm text-[var(--color-text-secondary)] mt-6">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button onClick={() => { setMode(isLogin ? 'register' : 'login'); setError(''); }} className="font-semibold text-[var(--color-text-primary)] hover:underline ml-1">
                    {isLogin ? 'Sign up' : 'Log in'}
                </button>
            </p>
        </div>
        <style>{`
            @keyframes fade-in {
                from { opacity: 0; transform: scale(0.98); }
                to { opacity: 1; transform: scale(1); }
            }
            .animate-fade-in {
                animation: fade-in 0.5s ease-out forwards;
            }
        `}</style>
    </div>
  );
};

export default Auth;
