import React from 'react';
import { Footprints, Zap, Moon, Bike, Award } from 'lucide-react';

interface LandingPageProps {
  onStartSignup: () => void;
  onStartLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartSignup, onStartLogin }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0d0f12] font-sans p-4 sm:p-8 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#2e8dee] opacity-10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#39b5ff] opacity-10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-7xl mx-auto z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">
          
          {/* Left Side: Illustration */}
          <div className="relative h-80 md:h-auto md:aspect-square flex items-center justify-center order-2 md:order-1">
             <div className="absolute inset-0 bg-gradient-to-tr from-[#2e8dee]/20 to-transparent rounded-full blur-3xl"></div>
             <Footprints className="absolute w-1/2 h-1/2 text-[#39b5ff] opacity-80 animate-pulse" style={{animationDuration: '3s'}} />
             <Zap className="absolute top-1/4 left-1/4 w-1/5 h-1/5 text-yellow-400 -rotate-12 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
             <Moon className="absolute bottom-1/4 right-1/4 w-1/4 h-1/4 text-purple-400 rotate-12 drop-shadow-[0_0_15px_rgba(192,132,252,0.5)]" />
             <Bike className="absolute top-1/4 right-1/4 w-1/3 h-1/3 text-red-400 rotate-6 opacity-60" />
             <Award className="absolute bottom-1/4 left-1/4 w-1/5 h-1/5 text-green-400 rotate-12 opacity-60" />
          </div>

          {/* Right Side: Content */}
          <div className="text-center md:text-left flex flex-col items-center md:items-start space-y-8 order-1 md:order-2">
            <div>
                <p className="text-[#39b5ff] font-bold tracking-widest uppercase text-sm mb-4">The Future of Health Insurance</p>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-2">
                Move.<br/>
                Earn.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2e8dee] to-[#39b5ff]">Thrive.</span>
                </h1>
                <p className="text-gray-400 text-lg md:text-xl mt-6 max-w-lg">
                    The fun, effective way to get rewarded for your health. Tokenize your activity and save on premiums.
                </p>
            </div>
            
            <div className="w-full max-w-xs space-y-4">
              <button
                onClick={onStartSignup}
                className="w-full bg-[#2e8dee] hover:bg-[#39b5ff] text-white font-bold py-4 px-6 rounded-xl shadow-[0_0_20px_rgba(46,141,238,0.3)] transition-all transform hover:scale-105"
              >
                GET STARTED
              </button>
              <button
                onClick={onStartLogin}
                className="w-full bg-transparent text-white font-bold py-4 px-6 rounded-xl border-2 border-gray-700 hover:border-[#39b5ff] hover:text-[#39b5ff] transition-all transform hover:scale-105"
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