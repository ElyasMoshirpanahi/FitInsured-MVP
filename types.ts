export interface User {
  userId: string;
  displayName: string;
  email: string;
  password?: string; // Note: In a real app, the password would not be sent to/stored on the client.
  authProvider: string;
  primaryProvider: string;
  connectedProviders: {
    provider: string;
    status: string;
    lastSyncAt: string | null;
  }[];
  personaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  title: string;
  fitcoin: number;
  metric: string; // Changed from distanceKm to a flexible string (e.g., "4,200 steps", "5.2 km")
  icon: string;
}

export interface DailyFitcoin {
  date: string;
  fitcoinEarned: number;
}

export interface WalletSummary {
  userId: string;
  balance: number;
  stakedAmount: number;
  today: {
    date: string;
    fitcoinEarned: number;
    activities: Activity[];
  };
  last7Days: DailyFitcoin[];
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  weeklyFitcoin: number;
}

export interface CommunitySummary {
  totalUsers: number;
  totalFitcoinThisWeek: number;
  avgDailyPerUser: number;
  leaderboard: LeaderboardEntry[];
}

export enum JobState {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  FAILED = "FAILED",
  COMPLETED = "COMPLETED"
}

export interface JobStatus {
  jobId: string;
  status: JobState;
  fitcoinDelta?: number;
  newBalance?: number;
  generatedActivities?: Activity[]; // Added to carry the results of the sync
}

export interface MarketplaceItem {
  id: string;
  name: string;
  category: string;
  cost: number;
  description: string;
  icon: string;
}

export interface SavingsTier {
  name: string;
  minStake: number;
  apy: number;
  color: string;
}

export interface Challenge {
  id: string;
  name: string;
  reward: number;
  status: 'Joined' | 'Not Joined';
  progress: number;
  icon: string;
  participants?: number;
}

export interface FeedItem {
  id: string;
  user: string;
  action: string;
  type: 'challenge' | 'savings' | 'activity' | 'marketplace';
  timestamp: string;
  icon: string;
}