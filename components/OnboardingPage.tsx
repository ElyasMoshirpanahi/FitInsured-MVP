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
                    <h3 className="font-bold text-lg text-white">Create your account</h3>
                    <div>
                      <label htmlFor="displayName" className="block text-sm font-medium text-gray-400">Display Name</label>
                      <input type="text" id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 block w-full p-3 bg-[#0d0f12] border border-gray-700 rounded-lg text-white shadow-sm focus:ring-1 focus:ring-[#2e8dee] focus:border-[#2e8dee] outline-none" placeholder="Jane Doe" required />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-400">Email Address</label>
                      <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full p-3 bg-[#0d0f12] border border-gray-700 rounded-lg text-white shadow-sm focus:ring-1 focus:ring-[#2e8dee] focus:border-[#2e8dee] outline-none" placeholder="you@example.com" required />
                    </div>
                     <div>
                      <label htmlFor="password"  className="block text-sm font-medium text-gray-400">Password</label>
                      <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full p-3 bg-[#0d0f12] border border-gray-700 rounded-lg text-white shadow-sm focus:ring-1 focus:ring-[#2e8dee] focus:border-[#2e8dee] outline-none" placeholder="••••••••" required />
                    </div>
                     <div>
                      <label htmlFor="confirmPassword"  className="block text-sm font-medium text-gray-400">Confirm Password</label>
                      <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full p-3 bg-[#0d0f12] border border-gray-700 rounded-lg text-white shadow-sm focus:ring-1 focus:ring-[#2e8dee] focus:border-[#2e8dee] outline-none" placeholder="••••••••" required />
                    </div>
                    {password !== confirmPassword && confirmPassword && <p className="text-sm text-red-400">Passwords do not match.</p>}
                    <button type="button" onClick={() => setStep(2)} disabled={!displayName || !email || !password || password !== confirmPassword} className="w-full bg-[#2e8dee] text-white font-bold py-3 rounded-lg shadow-md hover:bg-[#39b5ff] disabled:bg-gray-700 disabled:text-gray-500 transition-all">Next</button>
                    <p className="text-center text-sm text-gray-500">
                        Already have an account?{' '}
                        <button type="button" onClick={onBackToLogin} className="font-semibold text-[#39b5ff] hover:underline">Log In</button>
                    </p>
                  </div>
              );
          case 2:
              return (
                  <div className="space-y-4 animate-fade-in">
                    <h3 className="font-bold text-lg text-white">Connect Your Health Data</h3>
                    <p className="text-sm text-gray-400">Select your primary data source. You can add more later.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {HEALTH_PROVIDERS.map(provider => (
                        <button type="button" key={provider.id} onClick={() => setPrimaryProvider(provider.id)} className={`p-4 border rounded-lg flex flex-col items-center justify-center transition ${primaryProvider === provider.id ? 'ring-2 ring-[#2e8dee] border-[#2e8dee] bg-[#2e8dee]/10' : 'border-gray-700 bg-[#0d0f12] hover:bg-gray-800'}`}>
                          <provider.icon className={`w-8 h-8 mb-2 ${primaryProvider === provider.id ? 'text-[#39b5ff]' : 'text-gray-500'}`} />
                          <span className={`font-semibold text-sm text-center ${primaryProvider === provider.id ? 'text-white' : 'text-gray-400'}`}>{provider.name}</span>
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={() => setStep(3)} disabled={!primaryProvider} className="w-full bg-[#2e8dee] text-white font-bold py-3 rounded-lg shadow-md hover:bg-[#39b5ff] disabled:bg-gray-700 disabled:text-gray-500 transition-all">Next</button>
                    <button type="button" onClick={() => setStep(1)} className="w-full text-center text-sm text-gray-500 hover:text-white">Back</button>
                  </div>
              );
            case 3:
                return (
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="font-bold text-lg text-white">What's your activity style?</h3>
                        <p className="text-sm text-gray-400">This helps us recommend relevant challenges.</p>
                        <div className="space-y-3">
                            {PERSONA_TYPES.map(persona => (
                                <button type="button" key={persona.id} onClick={() => setPersonaId(persona.id)} className={`p-4 border rounded-lg w-full text-left transition flex items-center ${personaId === persona.id ? 'ring-2 ring-[#2e8dee] border-[#2e8dee] bg-[#2e8dee]/10' : 'border-gray-700 bg-[#0d0f12] hover:bg-gray-800'}`}>
                                    <persona.icon className={`w-6 h-6 mr-4 ${personaId === persona.id ? 'text-[#39b5ff]' : 'text-gray-500'}`}/>
                                    <div>
                                        <p className={`font-bold ${personaId === persona.id ? 'text-white' : 'text-gray-300'}`}>{persona.name}</p>
                                        <p className="text-sm text-gray-500">{persona.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                        <button type="submit" disabled={!personaId || isLoading} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 flex justify-center items-center transition-all">
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Finish Setup & Enter Wallet'}
                        </button>
                        <button type="button" onClick={() => setStep(2)} className="w-full text-center text-sm text-gray-500 hover:text-white">Back</button>
                    </div>
                );
      }
  }
  
  if (showWelcome && signedUpUser) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#0d0f12] p-4 relative">
        {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}
        <style>{`
            @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        `}</style>
        <div className="w-full max-w-md bg-[#161b22] border border-gray-800 shadow-2xl rounded-2xl min-h-[500px] flex flex-col items-center justify-center p-8 text-center animate-fade-in z-10">
          <Award className="w-20 h-20 text-green-400 mb-6 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
          <h1 className="text-3xl font-extrabold text-white">Welcome, {signedUpUser.displayName}!</h1>
          <p className="text-lg text-gray-400 mt-2 mb-8">Here is your welcome gift.</p>
          <button
            onClick={handleClaimAndLogin}
            className="w-full max-w-xs bg-green-500 text-white font-bold py-4 px-6 rounded-lg shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:bg-green-400 transition transform hover:scale-105"
          >
            Claim 3 FIT & Enter Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#0d0f12] p-4">
      <div className="w-full max-w-md bg-[#161b22] border border-gray-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col min-h-[700px]">
        <header className="p-4 pt-8 bg-[#161b22] border-b border-gray-800 text-center">
          <h1 className="text-2xl font-extrabold text-white">Complete Your Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Step {step} of 3</p>
          <div className="w-full bg-gray-800 rounded-full h-1.5 mt-4">
              <div className="bg-[#2e8dee] h-1.5 rounded-full transition-all duration-500" style={{ width: `${(step/3)*100}%`}}></div>
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