
import React from 'react';
import { Footprints, Zap, Moon, Bike, Award } from 'lucide-react';

interface LandingPageProps {
  onStartSignup: () => void;
  onStartLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartSignup, onStartLogin }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white font-sans p-4 sm:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">
          
          {/* Left Side: Illustration */}
          <div className="relative h-80 md:h-auto md:aspect-square flex items-center justify-center">
             <Footprints className="absolute w-1/2 h-1/2 text-green-400 opacity-90" />
             <Zap className="absolute top-1/4 left-1/4 w-1/5 h-1/5 text-yellow-400 -rotate-12" />
             <Moon className="absolute bottom-1/4 right-1/4 w-1/4 h-1/4 text-blue-400 rotate-12" />
             <Bike className="absolute top-1/4 right-1/4 w-1/3 h-1/3 text-red-400 rotate-6" />
             <Award className="absolute bottom-1/4 left-1/4 w-1/5 h-1/5 text-purple-400 rotate-12" />
          </div>

          {/* Right Side: Content */}
          <div className="text-center md:text-left flex flex-col items-center md:items-start space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-800 leading-tight">
              The fun, effective way to get rewarded for your health!
            </h1>
            <div className="w-full max-w-xs space-y-4">
              <button
                onClick={onStartSignup}
                className="w-full bg-green-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg border-b-4 border-green-700 transform transition hover:scale-105"
              >
                GET STARTED
              </button>
              <button
                onClick={onStartLogin}
                className="w-full bg-white text-sky-500 font-bold py-4 px-6 rounded-2xl shadow-lg border-2 border-gray-200 transform transition hover:scale-105"
              >
                I ALREADY HAVE AN ACCOUNT
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
