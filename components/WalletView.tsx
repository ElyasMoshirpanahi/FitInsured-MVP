

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { User, WalletSummary, Challenge, JobStatus, Activity } from '../types';
import { JobState } from '../types';
import { simulateActivity, getJobStatus, getChallenges } from '../services/api';
import { Loader2, Activity as ActivityIcon, BarChart3, TrendingUp, AlertCircle, Zap, Info, Footprints, Moon, Bike, Award, Repeat } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface WalletViewProps {
  user: User;
  summary: WalletSummary | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  navigateToCommunity: () => void;
}

const IconMap: { [key: string]: React.ElementType } = {
  Footprints,
  Moon,
  Zap,
  Bike,
};

const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef(callback);
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};

// Animated number component
const AnimatedBalance = ({ endValue }: { endValue: number }) => {
    const [currentValue, setCurrentValue] = useState(endValue);
    const prevValueRef = useRef(endValue);

    useEffect(() => {
        const startValue = prevValueRef.current;
        const end = endValue;
        if (startValue === end) {
            setCurrentValue(end); // Ensure value is correct if it hasn't changed
            return;
        };

        const duration = 1000; // 1 second animation
        let startTime: number | null = null;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            const animatedValue = startValue + (end - startValue) * percentage;
            
            setCurrentValue(animatedValue);

            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                 setCurrentValue(end); // Ensure it ends on the exact value
                 prevValueRef.current = end;
            }
        };

        requestAnimationFrame(animate);

    }, [endValue]);

    return <>{currentValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</>;
};

const ReportModal: React.FC<{
    jobResult: JobStatus | null;
    onClose: () => void;
}> = ({ jobResult, onClose }) => {
    const [step, setStep] = useState<'reporting' | 'calculating' | 'results'>('reporting');

    useEffect(() => {
        if (step === 'reporting') {
            const timer = setTimeout(() => setStep('calculating'), 2500 + (jobResult?.generatedActivities?.length || 0) * 150);
            return () => clearTimeout(timer);
        }
        if (step === 'calculating') {
            const timer = setTimeout(() => setStep('results'), 2000);
            return () => clearTimeout(timer);
        }
    }, [step, jobResult]);
    
    const renderContent = () => {
        switch(step) {
            case 'reporting':
                return (
                    <>
                        <h3 className="text-lg font-bold text-gray-800 text-center mb-2">Syncing Activity...</h3>
                        <p className="text-sm text-gray-500 text-center mb-4">Found {jobResult?.generatedActivities?.length || 0} new activities.</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto p-1">
                            {jobResult?.generatedActivities?.map((act, i) => {
                                const Icon = IconMap[act.icon] || Zap;
                                return (
                                <div key={i} className="flex items-center bg-gray-100 p-2 rounded-md animate-fade-in" style={{animationDelay: `${i * 150}ms`, opacity: 0, animationFillMode: 'forwards'}}>
                                    <Icon className="w-5 h-5 text-indigo-500 mr-3"/>
                                    <span className="font-semibold text-gray-700">{act.title}:</span>
                                    <span className="ml-auto text-gray-600">{act.metric}</span>
                                </div>
                                )
                            })}
                        </div>
                    </>
                );
            case 'calculating':
                 return (
                    <div className="flex flex-col items-center justify-center h-48 animate-fade-in">
                         <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                         <p className="text-lg font-bold text-gray-800 mt-4">Calculating Fitcoins...</p>
                    </div>
                 );
            case 'results':
                return (
                    <div className="flex flex-col items-center justify-center h-48 text-center animate-fade-in">
                        <Award className="w-12 h-12 text-green-500" />
                        <h3 className="text-2xl font-extrabold text-gray-800 mt-3">Congratulations!</h3>
                        <p className="text-gray-600 mt-1">You've earned</p>
                        <p className="text-4xl font-bold text-green-600 my-2 animate-pop-in">{(jobResult?.fitcoinDelta ?? 0).toFixed(2)} FIT</p>
                        <p className="text-sm text-gray-500 mt-3">Great work! Come back in 1 hour to sync again and earn more.</p>
                        <button onClick={onClose} className="mt-4 bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg text-sm">Done</button>
                    </div>
                );
        }
    }

    return (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
                {renderContent()}
            </div>
        </div>
    );
};


const WalletView: React.FC<WalletViewProps> = ({ user, summary, isLoading, error, onRefresh, navigateToCommunity }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [pollingDelay, setPollingDelay] = useState<number | null>(null);
  const [suggestedChallenges, setSuggestedChallenges] = useState<Challenge[]>([]);
  
  const [jobResult, setJobResult] = useState<JobStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBalanceAnimating, setIsBalanceAnimating] = useState(false);

  const [displayCurrency, setDisplayCurrency] = useState<'fit' | 'matic'>('fit');
  // Use a simulated, hardcoded price for MATIC to ensure stability and avoid API errors.
  const maticPrice = 0.58; 
  
  const COOLDOWN_STORAGE_KEY = `fitcoinSyncCooldown_${user.userId}`;
  const [cooldownTime, setCooldownTime] = useState<number | null>(null);

  useEffect(() => {
    const expiryTimestamp = localStorage.getItem(COOLDOWN_STORAGE_KEY);
    if (expiryTimestamp) {
      const remaining = Math.round((parseInt(expiryTimestamp, 10) - Date.now()) / 1000);
      if (remaining > 0) {
        setCooldownTime(remaining);
      } else {
        localStorage.removeItem(COOLDOWN_STORAGE_KEY);
      }
    }
  }, [COOLDOWN_STORAGE_KEY]);

  useEffect(() => {
    if (cooldownTime === null || cooldownTime <= 0) return;

    const timer = setInterval(() => {
      setCooldownTime(prev => {
        if (prev !== null && prev > 1) {
          return prev - 1;
        } else {
          localStorage.removeItem(COOLDOWN_STORAGE_KEY);
          return null;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownTime, COOLDOWN_STORAGE_KEY]);


  useEffect(() => {
    const fetchSuggestions = async () => {
        if (summary && summary.today.activities.length === 0) {
            const allChallenges = await getChallenges();
            setSuggestedChallenges(allChallenges.filter(c => c.status === 'Not Joined').slice(0, 2));
        }
    };
    fetchSuggestions();
  }, [summary]);

  const pollJobStatus = useCallback(async () => {
    if (!jobId) return;

    const status = await getJobStatus(jobId);

    if (status.status === JobState.COMPLETED) {
      setPollingDelay(null);
      setJobId(null);
      setJobResult(status);
      setIsModalOpen(true);
      setIsSimulating(false);
    } else if (status.status === JobState.FAILED) {
      setPollingDelay(null);
      setJobId(null);
      setIsSimulating(false);
      // You could add an error toast here
    }
  }, [jobId]);

  useInterval(pollJobStatus, pollingDelay);

  const handleSyncData = async () => {
    setIsSimulating(true);
    try {
      const { jobId: newJobId } = await simulateActivity(user.userId);
      setJobId(newJobId);
      setPollingDelay(1500); // Start polling
    } catch (err) {
      setIsSimulating(false);
       // You could add an error toast here
    }
  };
  
  const handleModalClose = () => {
      setIsModalOpen(false);
      setJobResult(null);
      onRefresh();

      // Set cooldown for 1 hour
      const expiry = Date.now() + 60 * 60 * 1000;
      localStorage.setItem(COOLDOWN_STORAGE_KEY, expiry.toString());
      setCooldownTime(3600); // 3600 seconds

      // Trigger the flash animation
      setIsBalanceAnimating(true);
      setTimeout(() => setIsBalanceAnimating(false), 1500); // Match animation duration
  };

  const formatCooldown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const chartData = summary?.last7Days.map(d => ({
    name: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
    fitcoin: d.fitcoinEarned,
  })) || [];

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <div className="text-center text-red-500 p-4"><AlertCircle className="mx-auto mb-2" />{error}</div>;
  }

  if (!summary) {
    return <div className="text-center text-gray-500 p-4">No wallet summary available.</div>;
  }
  
  const weeklyTotal = summary.last7Days.reduce((sum, day) => sum + day.fitcoinEarned, 0);
  const isOnCooldown = cooldownTime !== null && cooldownTime > 0;
  
  const maticAmount = summary.balance / 10;
  const usdValue = maticPrice ? maticAmount * maticPrice : null;

  return (
    <div className="space-y-6">
      {isModalOpen && <ReportModal jobResult={jobResult} onClose={handleModalClose}/>}
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        
        @keyframes pop-in {
            0% { opacity: 0; transform: scale(0.8); }
            100% { opacity: 1; transform: scale(1); }
        }
        .animate-pop-in { animation: pop-in 0.5s ease-out forwards; }

        @keyframes balance-flash {
            0% { background-color: #4f46e5; } /* bg-indigo-600 */
            50% { background-color: #6d63f5; } /* a lighter indigo */
            100% { background-color: #4f46e5; }
        }
        .balance-flash-anim {
            animation: balance-flash 1.5s ease-out;
        }
      `}</style>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-6 lg:items-center">
        <header className={`relative bg-indigo-600 p-6 rounded-xl shadow-lg text-white transition-colors duration-300 ${isBalanceAnimating ? 'balance-flash-anim' : ''}`}>
          <div className="flex justify-between items-center">
              <p className="text-sm font-light opacity-80">Total Balance</p>
              <div title="You can earn a maximum of 50 FIT per day from activities to ensure fairness." className="flex items-center cursor-help">
                <p className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">Cap: 50 FIT/day</p>
                <Info className="w-4 h-4 ml-1.5 opacity-70" />
              </div>
          </div>
          <button 
            onClick={() => setDisplayCurrency(c => c === 'fit' ? 'matic' : 'fit')} 
            className="w-full text-left focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg py-1 -my-1"
            aria-label="Toggle currency display"
          >
            <h2 className="text-5xl font-extrabold my-2 flex items-baseline flex-wrap">
              <AnimatedBalance endValue={displayCurrency === 'fit' ? summary.balance : maticAmount} />
              <span className="text-2xl font-medium opacity-90 ml-2">{displayCurrency === 'fit' ? 'FIT' : 'MATIC'}</span>
              {usdValue != null && (
                <span className="text-xl font-light opacity-80 ml-4">
                  ≈ ${usdValue.toFixed(2)} USD
                </span>
              )}
            </h2>
          </button>
           <div className="text-sm font-light opacity-80 h-5 mt-1">
             <span>Based on 1 MATIC ≈ ${maticPrice.toFixed(2)} USD</span>
          </div>
          <div className="absolute bottom-2 right-2 text-white/50 flex items-center text-xs pointer-events-none">
            <Repeat className="w-3 h-3 mr-1" />
            <span>Tap to convert</span>
          </div>
        </header>
        
        <div className="mt-6 lg:mt-0">
          <button 
            onClick={handleSyncData} 
            disabled={isSimulating || isOnCooldown} 
            className={`w-full font-bold py-4 px-6 rounded-lg flex items-center justify-center shadow-lg transform transition disabled:scale-100 lg:py-6
              ${isOnCooldown 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-green-500 text-white hover:scale-105 hover:bg-green-600'
              }`
            }
          >
            {isSimulating ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                Syncing...
              </>
            ) : isOnCooldown ? (
               <>
                <span role="img" aria-label="hourglass" className="mr-3 text-xl">⏳</span>
                Next sync in {formatCooldown(cooldownTime)}
              </>
            ) : (
               <>
                <Zap className="w-6 h-6 mr-3" />
                Sync Activity Data
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow-md">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><ActivityIcon className="w-5 h-5 mr-2 text-indigo-600" />Today's Activities</h3>
        {summary.today.activities.length > 0 ? (
          <div className="space-y-3">
            {summary.today.activities.map((activity, index) => {
              const Icon = IconMap[activity.icon] || BarChart3;
              const iconColors: { [key: string]: string } = {
                Footprints: 'bg-pink-100 text-pink-600',
                Zap: 'bg-yellow-100 text-yellow-600',
                Bike: 'bg-green-100 text-green-600',
                Moon: 'bg-blue-100 text-blue-600',
              };
              const colorClasses = iconColors[activity.icon] || 'bg-gray-100 text-gray-600';

              return (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full ${colorClasses}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold text-gray-800">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.metric}</p>
                    </div>
                  </div>
                  <p className="font-bold text-green-600">+ {(activity.fitcoin ?? 0).toFixed(2)} FIT</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
             <p className="text-sm text-gray-600 mb-4">No activities logged yet today. Join a challenge to get started!</p>
             <div className="space-y-3">
                {suggestedChallenges.map(c => {
                    const Icon = IconMap[c.icon] || Zap;
                    return (
                        <div key={c.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg text-left">
                            <div className="flex items-center">
                                <Icon className="w-5 h-5 text-indigo-500 mr-3" />
                                <div>
                                    <p className="font-semibold text-gray-800">{c.name}</p>
                                    <p className="text-xs text-green-600 font-medium">Reward: {c.reward} FIT</p>
                                </div>
                            </div>
                        </div>
                    )
                })}
             </div>
              <button onClick={navigateToCommunity} className="mt-4 bg-indigo-100 text-indigo-700 font-semibold py-2 px-4 rounded-lg text-sm">
                View All Challenges
              </button>
          </div>
        )}
      </div>

       <div className="bg-white p-4 rounded-xl shadow-md">
        <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />Last 7 Days</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
              <Tooltip cursor={{fill: 'rgba(239, 246, 255, 0.5)'}} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }} />
              <Bar dataKey="fitcoin" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default WalletView;