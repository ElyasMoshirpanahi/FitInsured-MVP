import React, { useState, useEffect, useCallback } from 'react';
import type { User, WalletSummary } from '../types';
import { Wallet, Users, LogOut, User as UserIcon, Store, TrendingUp, Bot } from 'lucide-react';
import WalletView from './WalletView';
import { CommunityView } from './CommunityView';
import SavingsView from './SavingsView';
import MarketplaceView from './MarketplaceView';
import NotificationToast from './NotificationToast';
import { getWalletSummary, redeemItem, stakeCoins } from '../services/api';
import AskView from './AskView';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, isActive, onClick }) => {
  const activeClasses = isActive ? "text-[#2e8dee]" : "text-gray-500 hover:text-gray-300";
  return (
    <button onClick={onClick} className={`flex flex-col items-center p-2 transition-colors duration-200 w-1/5 ${activeClasses}`}>
      <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 1.5} />
      <span className="text-xs mt-1 font-medium">{label}</span>
    </button>
  );
};

const NAV_ITEMS = [
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'savings', label: 'Savings', icon: TrendingUp },
  { id: 'marketplace', label: 'Market', icon: Store },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'ask', label: 'Ask', icon: Bot },
];

const DesktopSidebar: React.FC<{ user: User; currentView: string; setCurrentView: (view: string) => void; onLogout: () => void; }> = ({ user, currentView, setCurrentView, onLogout }) => (
    <nav className="hidden lg:flex flex-col w-64 border-r border-gray-800 p-4 space-y-4 flex-shrink-0 bg-[#161b22]">
        <div className="p-4 text-center">
            <div className="w-16 h-16 bg-[#0d0f12] rounded-full mx-auto mb-3 flex items-center justify-center border border-gray-700">
                 <UserIcon className="w-8 h-8 text-[#2e8dee]" />
            </div>
            <h1 className="text-lg font-bold text-white truncate" title={user.displayName}>{user.displayName}</h1>
            <p className="text-sm text-gray-500">Fitcoin Wallet</p>
        </div>
        <div className="flex-grow">
            {NAV_ITEMS.map(item => (
                <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center p-3 my-1 rounded-lg transition-all duration-200 border border-transparent ${
                        currentView === item.id 
                        ? 'bg-[#2e8dee]/10 text-[#39b5ff] border-[#2e8dee]/30' 
                        : 'text-gray-400 hover:bg-[#0d0f12] hover:text-white'
                    }`}
                >
                    <item.icon className="w-5 h-5 mr-3" strokeWidth={currentView === item.id ? 2.5 : 2} />
                    <span className="font-semibold text-sm">{item.label}</span>
                </button>
            ))}
        </div>
        <div className="border-t border-gray-800 pt-4">
             <button onClick={onLogout} className="w-full flex items-center p-3 rounded-lg text-gray-400 hover:bg-[#0d0f12] hover:text-red-400 transition-colors duration-200">
                <LogOut className="w-5 h-5 mr-3" />
                <span className="font-semibold text-sm">Logout</span>
            </button>
        </div>
    </nav>
);

const MobileNavBar: React.FC<{ currentView: string; setCurrentView: (view: string) => void; }> = ({ currentView, setCurrentView }) => (
    <nav className="sticky bottom-0 z-10 flex-shrink-0 flex justify-around items-center h-16 bg-[#161b22] border-t border-gray-800 lg:hidden">
        {NAV_ITEMS.map(item => <NavItem key={item.id} icon={item.icon} label={item.label} isActive={currentView === item.id} onClick={() => setCurrentView(item.id)} />)}
    </nav>
);

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
      case 'ask':
        // Pass user and summary to AskView for personalization
        return <AskView user={user} summary={summary} />;
      case 'wallet':
      default:
        return <WalletView user={user} summary={summary} isLoading={isLoading} error={error} onRefresh={fetchSummary} navigateToCommunity={() => setCurrentView('community')} />;
    }
  };

  const mainContentPadding = currentView === 'ask' ? '' : 'p-4';

  return (
    <div className="flex justify-center items-center h-screen bg-[#0d0f12] p-0 sm:p-4 font-sans text-gray-100">
      {showNotification && (
        <NotificationToast
            title="New Challenge Available!"
            message="Join the 'Weekend Warrior Run' and earn up to 750 FIT."
            onDismiss={() => setShowNotification(false)}
        />
      )}
      <div className="w-full h-full bg-[#0d0f12] sm:shadow-2xl sm:shadow-black sm:rounded-2xl flex flex-col sm:h-auto sm:min-h-[700px] sm:max-h-[90vh] sm:max-w-md md:max-w-2xl lg:flex-row lg:max-w-7xl border border-gray-800 overflow-hidden">
        <DesktopSidebar user={user} currentView={currentView} setCurrentView={setCurrentView} onLogout={onLogout} />

        <div className="flex flex-col flex-1 overflow-hidden">
            <header className="p-4 pt-8 bg-[#161b22] border-b border-gray-800 sticky top-0 z-10 flex justify-between items-center lg:hidden">
              <div className="flex items-center">
                <UserIcon className="w-6 h-6 text-[#2e8dee] mr-2" />
                <h1 className="text-xl font-bold text-white">{user.displayName}'s Wallet</h1>
              </div>
              <button onClick={onLogout} title="Logout" className="text-gray-400 hover:text-red-400 transition">
                <LogOut className="w-5 h-5" />
              </button>
            </header>

            <main className={`flex-grow overflow-y-auto bg-[#0d0f12] ${mainContentPadding}`}>
              {renderContent()}
            </main>
            
            <MobileNavBar currentView={currentView} setCurrentView={setCurrentView} />
        </div>
      </div>
    </div>
  );
};

export default MainApp;