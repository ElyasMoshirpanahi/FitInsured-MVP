import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import OnboardingPage from './components/OnboardingPage';
import MainApp from './components/MainApp';
import type { User } from './types';

const LoadingScreen = () => (
  <div className="flex justify-center items-center min-h-screen bg-gray-50">
    <div className="w-full max-w-md bg-white shadow-xl rounded-2xl h-[800px] md:h-[90vh] flex flex-col items-center justify-center">
      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      <p className="text-gray-600 mt-4">Initializing Fitcoin Wallet...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authFlow, setAuthFlow] = useState<'landing' | 'login' | 'signup'>('landing');

  useEffect(() => {
    const storedUser = localStorage.getItem('fitcoinUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    localStorage.setItem('fitcoinUser', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('fitcoinUser');
    setUser(null);
    setAuthFlow('landing');
  };

  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (user) {
    return <MainApp user={user} onLogout={handleLogout} />;
  }

  switch (authFlow) {
    case 'signup':
      return <OnboardingPage onLogin={handleLogin} onBackToLogin={() => setAuthFlow('login')} />;
    case 'login':
      return <LoginPage onLogin={handleLogin} onStartSignup={() => setAuthFlow('signup')} />;
    case 'landing':
    default:
      return <LandingPage onStartSignup={() => setAuthFlow('signup')} onStartLogin={() => setAuthFlow('login')} />;
  }
};

export default App;