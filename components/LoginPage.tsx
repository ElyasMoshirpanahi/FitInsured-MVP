
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
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl overflow-hidden flex flex-col justify-between items-center p-8 min-h-[600px]">
        
        <div className="text-center w-full pt-12">
          <div className="flex justify-center items-center w-24 h-24 bg-indigo-100 rounded-full mx-auto">
            <Footprints className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-800 text-center mt-6 mb-3">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-center text-lg">Log in to your Fitcoin wallet.</p>
        </div>

        <div className="w-full">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="you@example.com" required />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="••••••••" required />
              </div>
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex justify-center items-center transition hover:bg-indigo-700 disabled:bg-gray-400"
            >
                {isLoggingIn ? <Loader2 className="w-6 h-6 animate-spin"/> : "Log In"}
            </button>
          </form>
        </div>

        <div className="w-full pb-8 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <button onClick={onStartSignup} className="font-bold text-indigo-600 hover:underline">
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
