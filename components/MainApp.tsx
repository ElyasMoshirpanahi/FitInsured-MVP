
import React, { useState, useEffect, useCallback } from 'react';
import type { User, WalletSummary } from '../types';
import { Wallet, Users, LogOut, User as UserIcon, Store, TrendingUp } from 'lucide-react';
import WalletView from './WalletView';
import { CommunityView } from './CommunityView';
import SavingsView from './SavingsView';
import MarketplaceView from './MarketplaceView';
import NotificationToast from './NotificationToast';
import { getWalletSummary, redeemItem, stakeCoins } from '../services/api';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, isActive, onClick }) => {
  const activeClasses = isActive ? "text-indigo-600" : "text-gray-500 hover:text-gray-700";
  return (
    <button onClick={onClick} className={`flex flex-col items-center p-2 transition-colors duration-200 w-1/4 ${activeClasses}`}>
      <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 1.5} />
      <span className="text-xs mt-1 font-medium">{label}</span>
    </button>
  );
};

interface MainAppProps {
  user: User;
  onLogout: () => void;
}

const MainApp: React.FC<MainAppProps> = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState('wallet');
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Simulate a notification appearing after a delay
    const timer = setTimeout(() => {
        setShowNotification(true);
    }, 20000); // 20 seconds delay

    return () => clearTimeout(timer);
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getWalletSummary(user.userId);
      if (data) {
        setSummary(data);
      } else {
        setError("Could not load wallet data.");
      }
    } catch (err) {
      setError("An error occurred while fetching wallet data.");
    } finally {
      setIsLoading(false);
    }
  }, [user.userId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);
  
  const handleRedeem = async (cost: number) => {
    if (summary && summary.balance >= cost) {
      try {
        await redeemItem(user.userId, cost);
        await fetchSummary(); // Re-fetch to get latest balance
      } catch (err) {
        console.error("Redemption failed", err);
      }
    }
  };
  
  const handleStake = async (amount: number) => {
    if (summary && summary.balance >= amount) {
       try {
        await stakeCoins(user.userId, amount);
        await fetchSummary(); // Re-fetch to get latest balance
      } catch (err) {
        console.error("Staking failed", err);
      }
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'savings':
        return <SavingsView balance={summary?.balance ?? 0} stakedAmount={summary?.stakedAmount ?? 0} onStake={handleStake} />;
      case 'marketplace':
        return <MarketplaceView balance={summary?.balance ?? 0} onRedeem={handleRedeem} />;
      case 'community':
        return <CommunityView user={user} />;
      case 'wallet':
      default:
        return <WalletView user={user} summary={summary} isLoading={isLoading} error={error} onRefresh={fetchSummary} navigateToCommunity={() => setCurrentView('community')} />;
    }
  };

  return (
    <div className="flex justify-center min-h-screen bg-gray-50 p-4 font-sans">
      {showNotification && (
        <NotificationToast
            title="New Challenge Available!"
            message="Join the 'Weekend Warrior Run' and earn up to 750 FIT."
            onDismiss={() => setShowNotification(false)}
        />
      )}
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl overflow-hidden flex flex-col h-[800px] md:h-[90vh]">
        <header className="p-4 pt-8 bg-white border-b border-gray-100 sticky top-0 z-10 flex justify-between items-center">
          <div className="flex items-center">
            <UserIcon className="w-6 h-6 text-indigo-600 mr-2" />
            <h1 className="text-xl font-bold text-gray-800">{user.displayName}'s Wallet</h1>
          </div>
          <button onClick={onLogout} title="Logout" className="text-gray-500 hover:text-indigo-600 transition">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-grow p-4 overflow-y-auto bg-gray-50/50">
          {renderContent()}
        </main>

        <nav className="flex justify-around items-center h-16 bg-white border-t border-gray-200">
          <NavItem icon={Wallet} label="Wallet" isActive={currentView === 'wallet'} onClick={() => setCurrentView('wallet')} />
          <NavItem icon={TrendingUp} label="Savings" isActive={currentView === 'savings'} onClick={() => setCurrentView('savings')} />
          <NavItem icon={Store} label="Market" isActive={currentView === 'marketplace'} onClick={() => setCurrentView('marketplace')} />
          <NavItem icon={Users} label="Community" isActive={currentView === 'community'} onClick={() => setCurrentView('community')} />
        </nav>
      </div>
    </div>
  );
};

export default MainApp;
