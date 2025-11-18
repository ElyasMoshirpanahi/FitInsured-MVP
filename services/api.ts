
import type {
  User,
  WalletSummary,
  CommunitySummary,
  JobStatus,
  Challenge,
  FeedItem,
  DailyFitcoin,
  Activity,
} from '../types';
import { JobState } from '../types';

/**
 * NOTE: This is a MOCK API layer for the Fitcoin Wallet frontend demo.
 * It simulates a backend database using localStorage for persistence across sessions.
 * This version has been refactored to be stateless to prevent data sync issues.
 */

// --- LOCALSTORAGE KEYS ---
const MOCK_USERS_STORAGE_KEY = 'fitcoinMockUsers';
const MOCK_WALLETS_STORAGE_KEY = 'fitcoinMockWallets';

// --- STATELESS LOCALSTORAGE HELPERS ---
const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (e) {
    console.error(`Failed to load from localStorage key "${key}"`, e);
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, data: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save to localStorage key "${key}"`, e);
  }
};

// --- NEW FITCOIN METRIC CONSTANTS ---
const FITCOIN_METRICS: {
  [key: string]: { [key: string]: { unit: string; value_per_fitcoin: number } };
} = {
  "base_metrics": {
    "steps": { "unit": "steps", "value_per_fitcoin": 1000 },
    "workout_minutes": { "unit": "minutes", "value_per_fitcoin": 30 },
    "sleep_hours": { "unit": "hours", "value_per_fitcoin": 7 },
    "health_score": { "unit": "score_points", "value_per_fitcoin": 5 }
  },
  "strava_metrics": {
    "run_distance": { "unit": "kilometers", "value_per_fitcoin": 2 },
    "cycle_distance": { "unit": "kilometers", "value_per_fitcoin": 4 },
    "moving_time": { "unit": "minutes", "value_per_fitcoin": 15 },
    "elevation_gain": { "unit": "meters", "value_per_fitcoin": 100 },
    "active_calories": { "unit": "kcal", "value_per_fitcoin": 100 },
    "heart_rate_zone_time": { "unit": "minutes_in_zone_3_plus", "value_per_fitcoin": 10 }
  },
  "samsung_health_metrics": {
    "steps": { "unit": "steps", "value_per_fitcoin": 1000 },
    "active_time": { "unit": "minutes", "value_per_fitcoin": 20 },
    "active_calories": { "unit": "kcal", "value_per_fitcoin": 150 },
    "floors_climbed": { "unit": "floors", "value_per_fitcoin": 10 },
    "sleep_hours": { "unit": "hours", "value_per_fitcoin": 7 },
    "sleep_score": { "unit": "score_points", "value_per_fitcoin": 10 },
    "water_intake": { "unit": "ml", "value_per_fitcoin": 500 }
  },
  "google_fit_metrics": {
    "move_minutes": { "unit": "minutes", "value_per_fitcoin": 20 },
    "heart_points": { "unit": "points", "value_per_fitcoin": 10 }
  },
  "fitbit_metrics": {
    "steps": { "unit": "steps", "value_per_fitcoin": 1000 },
    "run_distance": { "unit": "kilometers", "value_per_fitcoin": 2 },
    "cycle_distance": { "unit": "kilometers", "value_per_fitcoin": 4 },
    "active_minutes": { "unit": "minutes", "value_per_fitcoin": 20 },
    "floors_climbed": { "unit": "floors", "value_per_fitcoin": 10 },
    "active_calories": { "unit": "kcal", "value_per_fitcoin": 150 },
    "sleep_hours": { "unit": "hours", "value_per_fitcoin": 7 }
  },
  "apple_health_metrics": {
    "exercise_minutes": { "unit": "minutes", "value_per_fitcoin": 30 },
    "active_kcal": { "unit": "kcal", "value_per_fitcoin": 200 },
    "stand_hours": { "unit": "hours", "value_per_fitcoin": 2 }
  },
  "wearables_metrics": { 
    "active_zone_minutes": { "unit": "minutes", "value_per_fitcoin": 10 },
    "swim_distance": { "unit": "meters", "value_per_fitcoin": 500 },
    "mindfulness_minutes": { "unit": "minutes", "value_per_fitcoin": 10 },
    "resting_heart_rate_improvement": { "unit": "percent_improvement", "value_per_fitcoin": 5 }
  }
};


// --- MOCKED CHALLENGES & FEED & JOBS (In-memory, reset on refresh) ---
const MOCK_CHALLENGES: Challenge[] = [
  { id: 'c1', name: 'The 10k Step Streak (7 days)', reward: 500, status: 'Not Joined', progress: 0, icon: 'Footprints', participants: 1258 },
  { id: 'c2', name: '7 Nights of Quality Sleep', reward: 300, status: 'Joined', progress: 85, icon: 'Moon', participants: 973 },
  { id: 'c3', name: 'Weekend Warrior Run', reward: 750, status: 'Not Joined', progress: 0, icon: 'Zap', participants: 450 },
];
const MOCK_FEED: FeedItem[] = [
  { id: 'f1', user: 'FitnessFanatic88', action: 'completed the 7 Nights of Quality Sleep challenge!', type: 'challenge', timestamp: '10m ago', icon: 'Moon' },
  { id: 'f2', user: 'WalkerQueen', action: 'just reached the Silver Savings Tier!', type: 'savings', timestamp: '35m ago', icon: 'TrendingUp' },
  { id: 'f3', user: 'You', action: 'logged a simulated activity and earned 12.5 FIT.', type: 'activity', timestamp: '1h ago', icon: 'Zap' },
  { id: 'f4', user: 'GymBroSam', action: 'redeemed a Personalized Meal Plan.', type: 'marketplace', timestamp: '2h ago', icon: 'Apple' },
  { id: 'f5', user: 'NewbieRunner', action: 'just joined the Weekend Warrior Run challenge!', type: 'challenge', timestamp: '3h ago', icon: 'Zap' },
];
const mockJobs: Record<string, { status: JobState; progress: number; result?: Partial<JobStatus>; userId: string }> = {};

// --- HELPERS ---
const generateRandomStats = (): DailyFitcoin[] => {
  const today = new Date();
  const last7Days: DailyFitcoin[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last7Days.push({
      date: d.toISOString().split('T')[0],
      fitcoinEarned: Math.floor(Math.random() * 45) + 5,
    });
  }
  return last7Days;
};

function createInitialWalletForUser(userId: string): WalletSummary {
  const wallets = loadFromStorage<Record<string, WalletSummary>>(MOCK_WALLETS_STORAGE_KEY, {});
  const todayDate = new Date().toISOString().split('T')[0];

  const newWallet: WalletSummary = {
    userId,
    balance: 3,
    stakedAmount: 0,
    today: { date: todayDate, fitcoinEarned: 0, activities: [] },
    last7Days: generateRandomStats(),
  };

  wallets[userId] = newWallet;
  saveToStorage(MOCK_WALLETS_STORAGE_KEY, wallets);
  return newWallet;
}

// --- API FUNCTIONS ---

/**
 * NOTE ON PRODUCTION ARCHITECTURE:
 * Connecting directly to a database like MongoDB from a frontend application is a major security risk.
 * It would expose your database credentials to anyone using the app.
 * The correct approach is to have a backend API (e.g., using Node.js/Express) that handles database interactions.
 * The frontend then communicates with this secure API.
 *
 * The code below uses localStorage for demonstration purposes. The commented-out sections
 * show placeholder logic for how you would call a backend API.
 */
export const signup = async (
  displayName: string,
  email: string,
  password: string,
  primaryProvider: string,
  personaId: string
): Promise<User> => {
  /*
  // --- PRODUCTION LOGIC PLACEHOLDER (using a backend API) ---
  // In a real application, you would make an API call like this.
  // The backend would handle password hashing and saving the user to MongoDB.

  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, email, password, primaryProvider, personaId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Signup failed');
    }

    const newUser: User = await response.json();
    // The backend would also create the initial wallet.
    return newUser;

  } catch (error) {
    console.error('Signup API call failed:', error);
    throw error;
  }
  */

  // --- MOCK LOGIC (for frontend demo using localStorage) ---
  const users = loadFromStorage<User[]>(MOCK_USERS_STORAGE_KEY, []);
  if (users.some((u) => u.email === email)) {
    throw new Error('A user with this email already exists.');
  }

  const now = new Date().toISOString();
  const newUser: User = {
    userId: crypto.randomUUID(),
    displayName,
    email,
    password,
    authProvider: 'email',
    primaryProvider,
    connectedProviders: [{ provider: primaryProvider, status: 'mock', lastSyncAt: null }],
    personaId,
    createdAt: now,
    updatedAt: now,
  };

  users.push(newUser);
  saveToStorage(MOCK_USERS_STORAGE_KEY, users);
  createInitialWalletForUser(newUser.userId);
  return newUser;
};

export const login = async (email: string, password: string): Promise<User> => {
  /*
  // --- PRODUCTION LOGIC PLACEHOLDER (using a backend API) ---
  // The backend would verify credentials against the MongoDB database.

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Invalid email or password.');
    }

    const user: User = await response.json();
    // The backend might also return a session token (e.g., JWT) to be stored in cookies or localStorage.
    return user;

  } catch (error) {
    console.error('Login API call failed:', error);
    throw error;
  }
  */

  // --- MOCK LOGIC (for frontend demo using localStorage) ---
  const users = loadFromStorage<User[]>(MOCK_USERS_STORAGE_KEY, []);
  const user = users.find((u) => u.email === email);

  if (!user || user.password !== password) {
    throw new Error('Invalid email or password.');
  }
  return user;
};

export const getWalletSummary = async (userId: string): Promise<WalletSummary> => {
  const wallets = loadFromStorage<Record<string, WalletSummary>>(MOCK_WALLETS_STORAGE_KEY, {});
  let wallet = wallets[userId];

  if (!wallet) {
    wallet = createInitialWalletForUser(userId);
  }
  return wallet;
};

const generateMockActivities = (userId: string): Activity[] => {
    const users = loadFromStorage<User[]>(MOCK_USERS_STORAGE_KEY, []);
    const user = users.find(u => u.userId === userId);
    const providerId = user?.primaryProvider || 'wearables';
    const providerKey = `${providerId}_metrics`;
    const providerMetrics = FITCOIN_METRICS[providerKey] || FITCOIN_METRICS.wearables_metrics;
    
    const metricKeys = Object.keys(providerMetrics);
    const numActivities = Math.floor(Math.random() * 4) + 1;
    const selectedKeys = metricKeys.sort(() => 0.5 - Math.random()).slice(0, numActivities);

    return selectedKeys.map(key => {
        const metricInfo = providerMetrics[key];
        let value: number;
        if (metricInfo.unit.includes('steps')) value = Math.floor(Math.random() * 8000) + 1000;
        else if (metricInfo.unit.includes('minutes')) value = Math.floor(Math.random() * 50) + 10;
        else if (metricInfo.unit.includes('kilometers')) value = parseFloat((Math.random() * 9 + 1).toFixed(1));
        else if (metricInfo.unit.includes('hours')) value = parseFloat((Math.random() * 3 + 6).toFixed(1));
        else if (metricInfo.unit.includes('kcal')) value = Math.floor(Math.random() * 400) + 50;
        else value = Math.floor(Math.random() * 90) + 10;

        const fitcoin = parseFloat((value / metricInfo.value_per_fitcoin).toFixed(2));
        let icon = 'Zap';
        if (key.includes('run') || key.includes('steps') || key.includes('walk')) icon = 'Footprints';
        if (key.includes('cycle') || key.includes('bike')) icon = 'Bike';
        if (key.includes('sleep')) icon = 'Moon';
        
        const title = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        return { title, fitcoin, metric: `${value.toLocaleString()} ${metricInfo.unit}`, icon };
    });
};

export const simulateActivity = async (userId: string): Promise<{ jobId: string }> => {
  const jobId = `job_${Date.now()}`;
  mockJobs[jobId] = { status: JobState.RUNNING, progress: 0, userId };
  return { jobId };
};

export const getJobStatus = async (jobId: string): Promise<JobStatus> => {
  const job = mockJobs[jobId];
  if (!job) return { jobId, status: JobState.FAILED };

  if (job.status === JobState.RUNNING) {
    job.progress += 34;
    if (job.progress >= 100) {
      job.status = JobState.COMPLETED;
      
      const wallets = loadFromStorage<Record<string, WalletSummary>>(MOCK_WALLETS_STORAGE_KEY, {});
      const currentWallet = wallets[job.userId];
      
      const generatedActivities = generateMockActivities(job.userId);
      const fitcoinDelta = generatedActivities.reduce((sum, act) => sum + act.fitcoin, 0);

      const todayDate = new Date().toISOString().split('T')[0];
      const updatedToday = { ...currentWallet.today };
      if (updatedToday.date !== todayDate) {
        updatedToday.date = todayDate;
        updatedToday.fitcoinEarned = 0;
        updatedToday.activities = [];
      }
      updatedToday.fitcoinEarned += fitcoinDelta;
      updatedToday.activities.push(...generatedActivities);

      const newBalance = currentWallet.balance + fitcoinDelta;
      
      currentWallet.balance = newBalance;
      currentWallet.today = updatedToday;
      saveToStorage(MOCK_WALLETS_STORAGE_KEY, wallets);

      job.result = { fitcoinDelta, newBalance, generatedActivities };
      return { jobId, status: JobState.COMPLETED, ...job.result };
    }
    return { jobId, status: JobState.RUNNING };
  }

  return { jobId, status: job.status, ...(job.result ?? {}) };
};

export const getCommunitySummary = async (): Promise<CommunitySummary> => ({
  totalUsers: 12458,
  totalFitcoinThisWeek: 890123,
  avgDailyPerUser: 25.7,
  leaderboard: [
    { userId: 'user1', displayName: 'FitnessFanatic88', weeklyFitcoin: 1550 },
    { userId: 'user2', displayName: 'WalkerQueen', weeklyFitcoin: 1420 },
    { userId: 'user3', displayName: 'GymBroSam', weeklyFitcoin: 1210 },
    { userId: 'user4', displayName: 'You', weeklyFitcoin: 980 },
  ],
});

export const getChallenges = async (): Promise<Challenge[]> => JSON.parse(JSON.stringify(MOCK_CHALLENGES));
export const getCommunityFeed = async (): Promise<FeedItem[]> => JSON.parse(JSON.stringify(MOCK_FEED));

export const joinChallenge = async (userId: string, challengeId: string): Promise<void> => {
  const challenge = MOCK_CHALLENGES.find((c) => c.id === challengeId);
  if (challenge && challenge.status === 'Not Joined') {
    challenge.status = 'Joined';
    challenge.progress = 5;
    challenge.participants = (challenge.participants || 0) + 1;

    MOCK_FEED.unshift({
      id: crypto.randomUUID(),
      user: 'You',
      action: `just joined the ${challenge.name} challenge!`,
      type: 'challenge',
      timestamp: 'Just now',
      icon: challenge.icon,
    });
  }
};

export const redeemItem = async (userId: string, cost: number): Promise<void> => {
  const wallets = loadFromStorage<Record<string, WalletSummary>>(MOCK_WALLETS_STORAGE_KEY, {});
  const wallet = wallets[userId];
  if (wallet.balance < cost) throw new Error('Insufficient funds.');
  
  wallet.balance -= cost;
  saveToStorage(MOCK_WALLETS_STORAGE_KEY, wallets);
};

export const stakeCoins = async (userId: string, amount: number): Promise<void> => {
  const wallets = loadFromStorage<Record<string, WalletSummary>>(MOCK_WALLETS_STORAGE_KEY, {});
  const wallet = wallets[userId];
  if (wallet.balance < amount) throw new Error('Insufficient funds to stake.');

  wallet.balance -= amount;
  wallet.stakedAmount += amount;
  saveToStorage(MOCK_WALLETS_STORAGE_KEY, wallets);
};