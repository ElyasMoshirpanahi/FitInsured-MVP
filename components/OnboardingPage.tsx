
import React, { useState } from 'react';
import { Loader2, User, Mail, BarChart3, Heart, Watch, Zap, Footprints, Moon, Bike, KeyRound, Award, HeartPulse, Activity } from 'lucide-react';
import { signup } from '../services/api';
import type { User as UserType } from '../types';
import Confetti from './Confetti';

interface OnboardingPageProps {
  onLogin: (user: UserType) => void;
  onBackToLogin: () => void;
}

const HEALTH_PROVIDERS = [
  { id: 'apple_health', name: 'Apple Health', icon: Heart },
  { id: 'fitbit', name: 'Fitbit', icon: Activity },
  { id: 'google_fit', name: 'Google Fit', icon: HeartPulse },
  { id: 'samsung_health', name: 'Samsung Health', icon: Watch },
  { id: 'strava', name: 'Strava', icon: BarChart3 },
  { id: 'wearables', name: 'Wearables', icon: Zap },
];

const PERSONA_TYPES = [
    { id: 'runner_heavy', name: 'Dedicated Runner', description: 'You live for the long run.', icon: Footprints },
    { id: 'yoga_master', name: 'Yoga Master', description: 'Finding balance and peace.', icon: Moon },
    { id: 'step_counter', name: ' Avid Walker', description: 'Walking is your way of life.', icon: Footprints },
    { id: 'gym_regular', name: 'Gym Regular', description: 'Lifting and cardio are your game.', icon: Bike },
];

const OnboardingPage: React.FC<OnboardingPageProps> = ({ onLogin, onBackToLogin }) => {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [primaryProvider, setPrimaryProvider] = useState('');
  const [personaId, setPersonaId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [showWelcome, setShowWelcome] = useState(false);
  const [signedUpUser, setSignedUpUser] = useState<UserType | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !email || !password || !primaryProvider || !personaId) return;
    if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
    }
    setError('');
    setIsLoading(true);
    try {
      const newUser = await signup(displayName, email, password, primaryProvider, personaId);
      setSignedUpUser(newUser);
      setShowWelcome(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleClaimAndLogin = () => {
    if (!signedUpUser) return;
    setShowConfetti(true);
    // Delay navigation slightly to let the confetti animation begin
    setTimeout(() => {
        onLogin(signedUpUser);
    }, 500);
  };
  
  const renderStep = () => {
      switch (step) {
          case 1:
              return (
                  <div className="space-y-4 animate-fade-in">
                    <h3 className="font-bold text-lg text-gray-800">Create your account</h3>
                    <div>
                      <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">Display Name</label>
                      <input type="text" id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Jane Doe" required />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                      <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="you@example.com" required />
                    </div>
                     <div>
                      <label htmlFor="password"  className="block text-sm font-medium text-gray-700">Password</label>
                      <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="••••••••" required />
                    </div>
                     <div>
                      <label htmlFor="confirmPassword"  className="block text-sm font-medium text-gray-700">Confirm Password</label>
                      <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="••••••••" required />
                    </div>
                    {password !== confirmPassword && confirmPassword && <p className="text-sm text-red-500">Passwords do not match.</p>}
                    <button type="button" onClick={() => setStep(2)} disabled={!displayName || !email || !password || password !== confirmPassword} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400">Next</button>
                    <p className="text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <button type="button" onClick={onBackToLogin} className="font-semibold text-indigo-600 hover:underline">Log In</button>
                    </p>
                  </div>
              );
          case 2:
              return (
                  <div className="space-y-4 animate-fade-in">
                    <h3 className="font-bold text-lg text-gray-800">Connect Your Health Data</h3>
                    <p className="text-sm text-gray-600">Select your primary data source. You can add more later.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {HEALTH_PROVIDERS.map(provider => (
                        <button type="button" key={provider.id} onClick={() => setPrimaryProvider(provider.id)} className={`p-4 border rounded-lg flex flex-col items-center justify-center transition ${primaryProvider === provider.id ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                          <provider.icon className="w-8 h-8 text-indigo-600 mb-2" />
                          <span className="font-semibold text-sm text-center text-gray-700">{provider.name}</span>
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={() => setStep(3)} disabled={!primaryProvider} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400">Next</button>
                    <button type="button" onClick={() => setStep(1)} className="w-full text-center text-sm text-gray-600 hover:text-indigo-600">Back</button>
                  </div>
              );
            case 3:
                return (
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="font-bold text-lg text-gray-800">What's your activity style?</h3>
                        <p className="text-sm text-gray-600">This helps us recommend relevant challenges.</p>
                        <div className="space-y-3">
                            {PERSONA_TYPES.map(persona => (
                                <button type="button" key={persona.id} onClick={() => setPersonaId(persona.id)} className={`p-4 border rounded-lg w-full text-left transition flex items-center ${personaId === persona.id ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                                    <persona.icon className="w-6 h-6 text-indigo-600 mr-4"/>
                                    <div>
                                        <p className="font-bold text-gray-800">{persona.name}</p>
                                        <p className="text-sm text-gray-600">{persona.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                        <button type="submit" disabled={!personaId || isLoading} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 flex justify-center items-center">
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Finish Setup & Enter Wallet'}
                        </button>
                        <button type="button" onClick={() => setStep(2)} className="w-full text-center text-sm text-gray-600 hover:text-indigo-600">Back</button>
                    </div>
                );
      }
  }
  
  if (showWelcome && signedUpUser) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
        {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}
        <style>{`
            @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        `}</style>
        <div className="w-full max-w-md bg-white shadow-xl rounded-2xl min-h-[500px] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
          <Award className="w-20 h-20 text-green-500 mb-6" />
          <h1 className="text-3xl font-extrabold text-gray-800">Welcome, {signedUpUser.displayName}!</h1>
          <p className="text-lg text-gray-600 mt-2 mb-8">Here is your welcome gift.</p>
          <button
            onClick={handleClaimAndLogin}
            className="w-full max-w-xs bg-green-500 text-white font-bold py-4 px-6 rounded-lg shadow-md hover:bg-green-600 transition transform hover:scale-105"
          >
            Claim 3 FIT & Enter Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl overflow-hidden flex flex-col min-h-[700px]">
        <header className="p-4 pt-8 bg-white border-b border-gray-100 text-center">
          <h1 className="text-2xl font-extrabold text-gray-800">Complete Your Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Step {step} of 3</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4">
              <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(step/3)*100}%`}}></div>
          </div>
        </header>
        <main className="flex-grow p-6 overflow-y-auto">
          <form onSubmit={handleSubmit}>
            {renderStep()}
          </form>
        </main>
      </div>
    </div>
  );
};

export default OnboardingPage;
