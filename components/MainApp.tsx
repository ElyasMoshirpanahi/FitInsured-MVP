
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
  const activeClasses = isActive ? "text-indigo-600" : "text-gray-500 hover:text-gray-700";
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
    <nav className="hidden lg:flex flex-col w-64 border-r border-gray-200 p-4 space-y-4 flex-shrink-0 bg-white">
        <div className="p-4 text-center">
            <UserIcon className="w-10 h-10 text-indigo-600 mx-auto mb-2" />
            <h1 className="text-lg font-bold text-gray-800 truncate" title={user.displayName}>{user.displayName}</h1>
            <p className="text-sm text-gray-500">Fitcoin Wallet</p>
        </div>
        <div className="flex-grow">
            {NAV_ITEMS.map(item => (
                <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${
                        currentView === item.id ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <item.icon className="w-5 h-5 mr-3" strokeWidth={currentView === item.id ? 2.5 : 2} />
                    <span className="font-semibold text-sm">{item.label}</span>
                </button>
            ))}
        </div>
        <div className="border-t border-gray-200 pt-4">
             <button onClick={onLogout} className="w-full flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200">
                <LogOut className="w-5 h-5 mr-3" />
                <span className="font-semibold text-sm">Logout</span>
            </button>
        </div>
    </nav>
);

const MobileNavBar: React.FC<{ currentView: string; setCurrentView: (view: string) => void; }> = ({ currentView, setCurrentView }) => (
    <nav className="sticky bottom-0 z-10 flex-shrink-0 flex justify-around items-center h-16 bg-white border-t border-gray-200 lg:hidden">
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
        return <AskView />;
      case 'wallet':
      default:
        return <WalletView user={user} summary={summary} isLoading={isLoading} error={error} onRefresh={fetchSummary} navigateToCommunity={() => setCurrentView('community')} />;
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50 p-0 sm:p-4 font-sans">
      {showNotification && (
        <NotificationToast
            title="New Challenge Available!"
            message="Join the 'Weekend Warrior Run' and earn up to 750 FIT."
            onDismiss={() => setShowNotification(false)}
        />
      )}
      <div className="w-full h-full bg-white sm:shadow-xl sm:rounded-2xl flex flex-col sm:h-auto sm:min-h-[700px] sm:max-h-[90vh] sm:max-w-md md:max-w-2xl lg:flex-row lg:max-w-7xl">
        <DesktopSidebar user={user} currentView={currentView} setCurrentView={setCurrentView} onLogout={onLogout} />

        <div className="flex flex-col flex-1 overflow-hidden">
            <header className="p-4 pt-8 bg-white border-b border-gray-100 sticky top-0 z-10 flex justify-between items-center lg:hidden">
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
            
            <MobileNavBar currentView={currentView} setCurrentView={setCurrentView} />
        </div>
      </div>
    </div>
  );
};

export default MainApp;