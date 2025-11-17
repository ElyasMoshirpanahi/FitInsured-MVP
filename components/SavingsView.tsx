
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
      <div className="bg-white p-5 rounded-xl shadow-lg border-t-4 border-green-500">
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
          <TrendingUp className="w-6 h-6 mr-2 text-green-600" />
          FIT Savings & Tiers
        </h3>
        <p className="text-sm text-gray-500">Stake your Fitcoin to earn an annual yield and unlock benefits.</p>
      </div>

      <div className={`p-4 rounded-xl shadow-md bg-white border-l-4 ${currentTier.color}`}>
          <p className="text-sm font-medium text-gray-600">Current Tier</p>
          <div className="flex justify-between items-center mt-1">
            <span className="text-2xl font-bold text-green-700 flex items-center">
              <Star className={`w-5 h-5 mr-1.5 ${currentTier.color.replace('border-', 'text-')}`} fill="currentColor" />
              {currentTier.name}
            </span>
             <p className="text-lg">APY: <span className="font-bold text-indigo-600">{currentTier.apy}%</span></p>
          </div>
          <p className="text-sm text-gray-600 mt-2">Total Staked: <span className="font-bold">{stakedAmount.toLocaleString()} FIT</span></p>
      </div>

       <div className="bg-white p-5 rounded-xl shadow-md">
          <h4 className="text-lg font-semibold mb-3">Staking Programs</h4>
          <p className="text-sm text-gray-500 mb-4">Choose a preset amount or enter a custom value to stake. Minimum 10 FIT.</p>
          
          <div className="flex space-x-2 mb-4">
              {PRESET_STAKE_AMOUNTS.map(amount => (
                  <button
                    key={amount}
                    onClick={() => handleStake(amount)}
                    disabled={isStaking || balance < amount}
                    className="flex-1 px-4 py-3 font-bold rounded-lg transition bg-indigo-100 text-indigo-700 hover:bg-indigo-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
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
              className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Min 10 FIT"
            />
            <button
              onClick={() => handleStake(stakeAmount)}
              disabled={isStaking || isCustomStakeInvalid}
              className="w-32 px-6 py-3 font-bold rounded-lg transition bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {isStaking ? <Loader2 className="w-5 h-5 animate-spin" /> : stakeSuccess ? <CheckCircle className="w-5 h-5" /> : 'Stake'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Available to Stake: {balance.toLocaleString()} FIT</p>
          {stakeSuccess && <p className="text-sm text-green-600 font-semibold text-center mt-4 animate-fade-in">Congratulations! Your FIT has been staked successfully.</p>}
        </div>
    </div>
  );
};

export default SavingsView;
