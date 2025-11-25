import React, { useState, useEffect } from 'react';
import { Loader2, Trophy, Users, AlertCircle, Footprints, Moon, Zap, MessageSquare, TrendingUp, Apple } from 'lucide-react';
import type { CommunitySummary, User, Challenge, FeedItem } from '../types';
import { getCommunitySummary, getChallenges, getCommunityFeed, joinChallenge } from '../services/api';

interface CommunityViewProps {
  user: User;
}

const IconMap: { [key: string]: React.ElementType } = {
  Footprints,
  Moon,
  Zap,
  TrendingUp,
  Apple
};

const ChallengeCard: React.FC<{ challenge: Challenge; onJoin: (id: string) => void; }> = ({ challenge, onJoin }) => {
    const Icon = IconMap[challenge.icon] || Zap;
    const isJoined = challenge.status === 'Joined';

    return (
        <div className={`bg-[#161b22] p-4 rounded-xl shadow-md border-b-4 transition-all ${isJoined ? 'border-[#2e8dee]' : 'border-gray-700'}`}>
            <div className="flex items-start justify-between">
                <div className="flex items-center">
                    <div className={`p-3 rounded-full ${isJoined ? 'bg-[#2e8dee]/20' : 'bg-gray-800'}`}>
                        <Icon className={`w-6 h-6 ${isJoined ? 'text-[#2e8dee]' : 'text-gray-500'}`} />
                    </div>
                    <div className="ml-4">
                        <p className="font-bold text-gray-200">{challenge.name}</p>
                        <p className="text-xs text-gray-500">{challenge.participants?.toLocaleString()} participants</p>
                    </div>
                </div>
                 <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-bold text-[#39b5ff] text-lg">{challenge.reward} FIT</p>
                    <button
                        onClick={() => !isJoined && onJoin(challenge.id)}
                        disabled={isJoined}
                        className={`mt-1 text-xs font-bold px-3 py-1 rounded-full transition ${isJoined ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md hover:from-green-400 hover:to-green-500'}`}
                    >
                        {isJoined ? 'Joined' : 'Join'}
                    </button>
                </div>
            </div>
             {isJoined && (
                <div className="mt-3 pt-3 border-t border-dashed border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">Progress: {challenge.progress}%</p>
                    <div className="w-full bg-gray-700 rounded-full h-1.5"><div className="bg-[#2e8dee] h-1.5 rounded-full transition-all duration-500" style={{ width: `${challenge.progress}%` }}></div></div>
                </div>
            )}
        </div>
    );
};

const FeedPost: React.FC<{ post: FeedItem }> = ({ post }) => {
    const Icon = IconMap[post.icon] || Zap;

    let colorClass = 'text-[#2e8dee] bg-[#2e8dee]/10';
    if (post.type === 'challenge') colorClass = 'text-purple-400 bg-purple-500/10';
    if (post.type === 'savings') colorClass = 'text-green-400 bg-green-500/10';
    if (post.type === 'marketplace') colorClass = 'text-orange-400 bg-orange-500/10';
    if (post.type === 'activity') colorClass = 'text-pink-400 bg-pink-500/10';

    return (
        <div className="flex items-start space-x-3 p-3 bg-[#161b22] rounded-xl shadow-sm border border-gray-800">
            <div className={`p-2 rounded-full ${colorClass}`}>
                <Icon className={`w-5 h-5`} />
            </div>
            <div className="flex-grow">
                <p className="text-sm text-gray-300 leading-snug">
                    <span className="font-bold text-white">{post.user}</span> {post.action}
                </p>
                <p className="text-xs text-gray-500 mt-1">{post.timestamp}</p>
            </div>
        </div>
    );
};


export const CommunityView: React.FC<CommunityViewProps> = ({ user }) => {
  const [summary, setSummary] = useState<CommunitySummary | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = async () => {
      try {
        setIsLoading(true);
        const [summaryData, challengesData, feedData] = await Promise.all([
            getCommunitySummary(),
            getChallenges(),
            getCommunityFeed(),
        ]);
        setSummary(summaryData);
        setChallenges(challengesData);
        setFeed(feedData);
      } catch (err) {
        setError("Failed to load community data.");
      } finally {
        setIsLoading(false);
      }
    };


  useEffect(() => {
    fetchData();
  }, []);

  const handleJoinChallenge = async (challengeId: string) => {
    // Optimistic UI update
    const originalChallenges = [...challenges];
    const originalFeed = [...feed];

    const challengeToJoin = challenges.find(c => c.id === challengeId);
    if (!challengeToJoin) return;
    
    setChallenges(prev =>
      prev.map(c =>
        c.id === challengeId ? { ...c, status: 'Joined', progress: 5, participants: (c.participants || 0) + 1 } : c
      )
    );
    setFeed(prevFeed => [
        {
            id: crypto.randomUUID(),
            user: 'You',
            action: `just joined the ${challengeToJoin.name} challenge!`,
            type: 'challenge',
            timestamp: 'Just now',
            icon: challengeToJoin.icon
        },
        ...prevFeed
    ]);

    try {
        await joinChallenge(user.userId, challengeId);
    } catch (error) {
        // Revert on failure
        console.error("Failed to join challenge:", error);
        setChallenges(originalChallenges);
        setFeed(originalFeed);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-[#2e8dee]" /></div>;
  }

  if (error) {
    return <div className="text-center text-red-400 p-4"><AlertCircle className="mx-auto mb-2" />{error}</div>;
  }

  if (!summary) {
    return <div className="text-center text-gray-500 p-4">No community data available.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-[#161b22] p-5 rounded-xl shadow-lg border-t-4 border-purple-500">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center">
          <Users className="w-6 h-6 mr-2 text-purple-400" /> Fitcoin Community
        </h3>
        <p className="text-sm text-gray-400">Connect, compete, and celebrate progress with fellow members.</p>
      </div>

      <div>
        <h4 className="text-lg font-bold text-white mb-4 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-blue-400" /> Activity Feed
        </h4>
        <div className="space-y-3">
          {feed.map(post => <FeedPost key={post.id} post={post} />)}
        </div>
      </div>
      
      <div>
        <h4 className="text-lg font-bold text-white mb-4 flex items-center">
          <Footprints className="w-5 h-5 mr-2 text-[#2e8dee]" /> Active Challenges
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map(challenge => (
            <ChallengeCard key={challenge.id} challenge={challenge} onJoin={handleJoinChallenge} />
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-lg font-bold text-white mb-4 flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" /> Weekly Leaderboard
        </h4>
        <div className="space-y-2">
          {summary.leaderboard.map((entry, index) => {
            const isCurrentUser = entry.displayName === 'You';
            return (
              <div 
                key={entry.userId} 
                className={`flex items-center justify-between p-3 rounded-xl transition ${isCurrentUser ? 'bg-purple-900/20 ring-1 ring-purple-500 shadow-md' : 'bg-[#161b22] shadow-sm border border-gray-800'}`}
              >
                <div className="flex items-center">
                  <span className={`text-xl font-extrabold w-6 text-center 
                    ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-gray-600'}
                  `}>{index + 1}</span>
                  <p className={`ml-3 font-semibold ${isCurrentUser ? 'text-purple-300' : 'text-gray-200'}`}>
                    {entry.displayName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-[#39b5ff]">{entry.weeklyFitcoin} FIT</p>
                  <p className="text-xs text-gray-500">This Week</p>
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-sm text-center text-gray-600 mt-4">Leaderboard resets weekly.</p>
      </div>
    </div>
  );
};