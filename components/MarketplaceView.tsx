

// Fix: Corrected syntax error in React import.
import React, { useState } from 'react';
import type { MarketplaceItem } from '../types';
import { Store, Shield, Watch, Apple, CheckCircle, Loader2, Dumbbell, GlassWater, Flower, Cookie, Sparkles } from 'lucide-react';
import Confetti from './Confetti';

interface MarketplaceViewProps {
  balance: number;
  onRedeem: (cost: number) => Promise<void>;
}

const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  { id: 'm4', name: 'Healthy Smoothie Voucher', category: 'Nutrition Partner', cost: 5, description: 'Redeem for one free smoothie at HealthyBites Cafe.', icon: 'GlassWater' },
  { id: 'm5', name: 'Online Yoga Class', category: 'Wellness App', cost: 10, description: 'Access a premium online yoga session from ZenFlow.', icon: 'Flower' },
  { id: 'm6', name: 'Meditation App Trial', category: 'Wellness App', cost: 10, description: 'Unlock a 1-month premium trial for the CalmMind app.', icon: 'Sparkles' },
  { id: 'm7', name: 'Protein Bar Pack', category: 'Snack Company', cost: 20, description: 'Get a variety pack of 5 protein bars shipped to you.', icon: 'Cookie' },
  { id: 'm8', name: '1-Week Gym Pass', category: 'Fitness Center', cost: 30, description: 'Get a free 7-day pass to any partner gym.', icon: 'Dumbbell' },
  { id: 'm3', name: 'Personalized Meal Plan', category: 'Health Provider', cost: 800, description: 'Get a 4-week custom nutrition plan.', icon: 'Apple' },
  { id: 'm1', name: 'Insurance Premium Waiver', category: 'Insurance Company', cost: 1500, description: 'Waive one month of your yearly premium.', icon: 'Shield' },
  { id: 'm2', name: '50% Wearable Discount', category: 'Wearable Company', cost: 5000, description: 'Claim 50% off the latest smart device.', icon: 'Watch' },
];

const IconMap: { [key: string]: React.ElementType } = {
  Shield, Watch, Apple, Dumbbell, GlassWater, Flower, Cookie, Sparkles
};

const MarketplaceView: React.FC<MarketplaceViewProps> = ({ balance, onRedeem }) => {
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [redeemedId, setRedeemedId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const handleRedeem = async (item: MarketplaceItem) => {
    if (balance < item.cost) return;
    setRedeemingId(item.id);
    await onRedeem(item.cost);
    setRedeemingId(null);
    setRedeemedId(item.id);
    setShowConfetti(true);
    setTimeout(() => setRedeemedId(null), 2500); // Reset after animation
  };

  return (
    <div className="space-y-6">
      {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}
      <div className="bg-white p-5 rounded-xl shadow-lg border-t-4 border-orange-500">
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
          <Store className="w-6 h-6 mr-2 text-orange-600" />
          Provider Rewards Hub
        </h3>
        <p className="text-sm text-gray-500">Use your Fitcoin to claim exclusive rewards from our partners.</p>
      </div>

      <div className="space-y-4">
        {MARKETPLACE_ITEMS.map(item => {
          const Icon = IconMap[item.icon];
          const canAfford = balance >= item.cost;
          const isRedeeming = redeemingId === item.id;
          const isRedeemed = redeemedId === item.id;

          return (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-md flex flex-col">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-full"><Icon className="w-6 h-6 text-orange-600" /></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-indigo-600">{item.category}</p>
                    <h4 className="text-lg font-extrabold text-gray-800">{item.name}</h4>
                  </div>
                </div>
                <p className={`font-extrabold text-xl ${canAfford ? 'text-orange-600' : 'text-gray-400'}`}>
                  {item.cost.toLocaleString()} FIT
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-dashed border-gray-200 flex justify-between items-center">
                <p className="text-sm text-gray-700 pr-4">{item.description}</p>
                 <button
                    onClick={() => handleRedeem(item)}
                    disabled={!canAfford || isRedeeming || isRedeemed}
                    className={`w-28 text-sm font-bold px-4 py-2 rounded-lg transition-all duration-300 transform flex-shrink-0 flex justify-center items-center
                      ${isRedeemed ? 'bg-green-500 text-white scale-105' : 
                      (canAfford ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600 hover:scale-105' : 'bg-gray-200 text-gray-500 cursor-not-allowed')}
                    `}
                >
                    {isRedeeming ? <Loader2 className="w-5 h-5 animate-spin"/> : isRedeemed ? <CheckCircle className="w-5 h-5" /> : (canAfford ? 'Redeem' : 'Locked')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketplaceView;
