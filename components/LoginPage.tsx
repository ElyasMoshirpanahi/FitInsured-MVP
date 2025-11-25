import React, { useState } from 'react';
import { Footprints, Loader2, Mail, KeyRound } from 'lucide-react';
import type { User as UserType } from '../types';
import { login } from '../services/api';

interface LoginPageProps {
  onLogin: (user: UserType) => void;
  onStartSignup: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onStartSignup }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setIsLoggingIn(true);
    setError('');
    try {
      const user = await login(email, password);
      onLogin(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#0d0f12] p-4 relative overflow-hidden">
       {/* Background accent */}
       <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#2e8dee] opacity-5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#161b22] border border-gray-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col justify-between items-center p-8 min-h-[600px] z-10">
        
        <div className="text-center w-full pt-8">
          <div className="flex justify-center items-center w-24 h-24 bg-[#0d0f12] border border-gray-700 rounded-full mx-auto shadow-lg shadow-black/50">
            <Footprints className="w-12 h-12 text-[#2e8dee]" />
          </div>
          <h1 className="text-4xl font-extrabold text-white text-center mt-6 mb-3">
            Welcome Back
          </h1>
          <p className="text-gray-400 text-center text-lg">Log in to your Fitcoin wallet.</p>
        </div>

        <div className="w-full">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 block w-full p-3 bg-[#0d0f12] border border-gray-700 rounded-lg text-white focus:ring-1 focus:ring-[#2e8dee] focus:border-[#2e8dee] transition-all outline-none placeholder-gray-600" placeholder="you@example.com" required />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 block w-full p-3 bg-[#0d0f12] border border-gray-700 rounded-lg text-white focus:ring-1 focus:ring-[#2e8dee] focus:border-[#2e8dee] transition-all outline-none placeholder-gray-600" placeholder="••••••••" required />
              </div>
            </div>

            {error && <p className="text-sm text-red-400 text-center bg-red-900/20 p-2 rounded">{error}</p>}

            <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-[#2e8dee] hover:bg-[#39b5ff] text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-[#2e8dee]/20 flex justify-center items-center transition-all disabled:bg-gray-700 disabled:text-gray-500"
            >
                {isLoggingIn ? <Loader2 className="w-6 h-6 animate-spin"/> : "Log In"}
            </button>
          </form>
        </div>

        <div className="w-full pb-4 text-center">
          <p className="text-gray-500">
            Don't have an account?{' '}
            <button onClick={onStartSignup} className="font-bold text-[#39b5ff] hover:underline hover:text-white transition">
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;