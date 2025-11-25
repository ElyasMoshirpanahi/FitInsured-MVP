import React, { useState, useMemo } from 'react';
import type { SavingsTier } from '../types';
import { Star, TrendingUp, Loader2, CheckCircle } from 'lucide-react';
import Confetti from './Confetti';

interface SavingsViewProps {
  balance: number;
  stakedAmount: number;
  onStake: (amount: number) => Promise<void>;
}

const SAVINGS_TIERS: SavingsTier[] = [
  { name: 'Bronze', minStake: 0, apy: 5, color: 'border-amber-700' },
  { name: 'Silver', minStake: 1000, apy: 8, color: 'border-slate-400' },
  { name: 'Gold', minStake: 5000, apy: 12, color: 'border-yellow-500' },
];

const PRESET_STAKE_AMOUNTS = [25, 50, 100];

const TIERS_WITH_BENEFITS: (SavingsTier & { benefits: string[] })[] = [
  { ...SAVINGS_TIERS[0], benefits: ['Standard 5% APY', 'Access to all community challenges'] },
  { ...SAVINGS_TIERS[1], benefits: ['Increased 8% APY', 'Access to exclusive Silver+ rewards in Marketplace'] },
  { ...SAVINGS_TIERS[2], benefits: ['Highest 12% APY', 'Access to Gold-only challenges & rewards', 'Monthly 25 FIT bonus drop'] },
];

const TierProgressVisual: React.FC<{ stakedAmount: number, tiers: SavingsTier[] }> = ({ stakedAmount, tiers }) => {
    const getProgress = (tierIndex: number) => {
        if (stakedAmount >= tiers[tierIndex + 1].minStake) return 100;
        if (stakedAmount < tiers[tierIndex].minStake) return 0;

        const tierStart = tiers[tierIndex].minStake;
        const tierEnd = tiers[tierIndex+1].minStake;
        const progress = ((stakedAmount - tierStart) / (tierEnd - tierStart)) * 100;
        return Math.max(0, Math.min(progress, 100));
    };

    return (
        <div className="space-y-2">
            <p className="text-sm font-medium text-gray-400">Your progress to the next tier:</p>
            <div className="flex items-center w-full space-x-2">
                {tiers.slice(0, -1).map((tier, index) => {
                    const nextTier = tiers[index + 1];
                    const progress = getProgress(index);
                    const isActive = stakedAmount >= tier.minStake && stakedAmount < nextTier.minStake;
                    
                    return (
                        <React.Fragment key={tier.name}>
                             <div className={`text-center flex-shrink-0 ${stakedAmount >= tier.minStake ? 'font-bold text-[#2e8dee]' : 'text-gray-600'}`}>
                                <Star className={`w-6 h-6 mx-auto ${stakedAmount >= tier.minStake ? tier.color.replace('border-','text-') : 'text-gray-700'}`} fill="currentColor" />
                                <span className="text-xs">{tier.name}</span>
                            </div>
                            {index < tiers.length - 2 && (
                                <div className="flex-grow pt-2.5">
                                    <div className="w-full bg-gray-800 rounded-full h-1.5 relative">
                                        <div className="bg-[#2e8dee] h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                        {isActive && <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-[#2e8dee] rounded-full" style={{ left: `${progress}%` }}></div>}
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>{tier.minStake}</span>
                                        <span>{nextTier.minStake}</span>
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
                <div className={`text-center flex-shrink-0 ${stakedAmount >= tiers[tiers.length - 1].minStake ? 'font-bold text-[#2e8dee]' : 'text-gray-600'}`}>
                    <Star className={`w-6 h-6 mx-auto ${stakedAmount >= tiers[tiers.length - 1].minStake ? tiers[tiers.length-1].color.replace('border-','text-') : 'text-gray-700'}`} fill="currentColor" />
                    <span className="text-xs">{tiers[tiers.length-1].name}</span>
                </div>
            </div>
        </div>
    );
};


const SavingsView: React.FC<SavingsViewProps> = ({ balance, stakedAmount, onStake }) => {
  const [stakeInput, setStakeInput] = useState('10');
  const [isStaking, setIsStaking] = useState(false);
  const [stakeSuccess, setStakeSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const currentTier = useMemo(() => 
    [...SAVINGS_TIERS].reverse().find(tier => stakedAmount >= tier.minStake) || SAVINGS_TIERS[0],
    [stakedAmount]
  );
  
  const handleStake = async (amountToStake: number) => {
    if (isNaN(amountToStake) || amountToStake < 10 || amountToStake > balance) {
      return;
    }
    setIsStaking(true);
    setStakeSuccess(false);
    try {
      await onStake(amountToStake);
      setStakeSuccess(true);
      setShowConfetti(true);
      setStakeInput('10'); // Reset input
      setTimeout(() => setStakeSuccess(false), 2500); // Reset success state
    } catch (error) {
      console.error("Staking failed", error);
      // Handle error display if needed
    } finally {
      setIsStaking(false);
    }
  };

  const stakeAmount = parseInt(stakeInput, 10);
  const isCustomStakeInvalid = isNaN(stakeAmount) || stakeAmount < 10 || stakeAmount > balance;

  return (
    <div className="space-y-6">
      {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}
      <div className="bg-[#161b22] p-5 rounded-xl shadow-lg border-t-4 border-green-500">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center">
          <TrendingUp className="w-6 h-6 mr-2 text-green-500" />
          FIT Savings & Tiers
        </h3>
        <p className="text-sm text-gray-400">Stake your Fitcoin to earn an annual yield and unlock benefits.</p>
      </div>

      <div className="p-4 rounded-xl shadow-md bg-[#161b22] border border-gray-800 space-y-4">
          <div className={`border-l-4 ${currentTier.color} pl-4`}>
            <p className="text-sm font-medium text-gray-400">Current Tier</p>
            <div className="flex justify-between items-center mt-1">
                <span className="text-2xl font-bold text-white flex items-center">
                <Star className={`w-5 h-5 mr-1.5 ${currentTier.color.replace('border-', 'text-')}`} fill="currentColor" />
                {currentTier.name}
                </span>
                <p className="text-lg text-gray-300">APY: <span className="font-bold text-[#39b5ff]">{currentTier.apy}%</span></p>
            </div>
            <p className="text-sm text-gray-400 mt-1">Total Staked: <span className="font-bold text-white">{stakedAmount.toLocaleString()} FIT</span></p>
          </div>
          <div className="pt-4 border-t border-gray-800">
             <TierProgressVisual stakedAmount={stakedAmount} tiers={SAVINGS_TIERS} />
          </div>
      </div>

       <div className="bg-[#161b22] p-5 rounded-xl shadow-md border border-gray-800">
          <h4 className="text-lg font-semibold mb-3 text-white">Staking Programs</h4>
          <p className="text-sm text-gray-400 mb-4">Choose a preset amount or enter a custom value to stake. Minimum 10 FIT.</p>
          
          <div className="flex space-x-2 mb-4">
              {PRESET_STAKE_AMOUNTS.map(amount => (
                  <button
                    key={amount}
                    onClick={() => handleStake(amount)}
                    disabled={isStaking || balance < amount}
                    className="flex-1 px-4 py-3 font-bold rounded-lg transition bg-[#0d0f12] text-[#2e8dee] border border-[#2e8dee]/30 hover:bg-[#2e8dee] hover:text-white disabled:bg-gray-800 disabled:text-gray-600 disabled:border-transparent disabled:cursor-not-allowed"
                  >
                      Stake {amount} FIT
                  </button>
              ))}
          </div>

          <div className="flex space-x-2">
            <input
              type="number"
              value={stakeInput}
              onChange={(e) => setStakeInput(e.target.value)}
              min="10"
              max={balance}
              className="flex-grow p-3 bg-[#0d0f12] border border-gray-700 text-white rounded-lg focus:ring-1 focus:ring-[#2e8dee] focus:border-[#2e8dee] outline-none"
              placeholder="Min 10 FIT"
            />
            <button
              onClick={() => handleStake(stakeAmount)}
              disabled={isStaking || isCustomStakeInvalid}
              className="w-32 px-6 py-3 font-bold rounded-lg transition bg-[#2e8dee] text-white hover:bg-[#39b5ff] disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed flex justify-center items-center shadow-lg shadow-[#2e8dee]/20"
            >
              {isStaking ? <Loader2 className="w-5 h-5 animate-spin" /> : stakeSuccess ? <CheckCircle className="w-5 h-5" /> : 'Stake'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Available to Stake: {balance.toLocaleString()} FIT</p>
          {stakeSuccess && <p className="text-sm text-green-400 font-semibold text-center mt-4 animate-fade-in">Congratulations! Your FIT has been staked successfully.</p>}
        </div>
      
      <div className="bg-[#161b22] p-5 rounded-xl shadow-md border border-gray-800">
        <h4 className="text-lg font-semibold mb-4 text-white">Tier Benefits</h4>
        <div className="space-y-3">
        {TIERS_WITH_BENEFITS.map(tier => {
            const isCurrent = tier.name === currentTier.name;
            return (
            <div key={tier.name} className={`p-4 rounded-lg border-2 transition ${isCurrent ? `${tier.color} bg-[#2e8dee]/5` : 'border-gray-800 bg-[#0d0f12]'}`}>
                <div className="flex justify-between items-center">
                <h5 className={`font-bold text-lg flex items-center ${tier.color.replace('border-', 'text-')}`}>
                    <Star className="w-5 h-5 mr-2" fill="currentColor"/> {tier.name}
                </h5>
                <p className="text-sm font-medium text-gray-500">Min. {tier.minStake.toLocaleString()} FIT</p>
                </div>
                <ul className="mt-3 text-sm text-gray-300 space-y-2">
                {tier.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>{benefit}</span>
                    </li>
                ))}
                </ul>
            </div>
            )
        })}
        </div>
      </div>

    </div>
  );
};

export default SavingsView;