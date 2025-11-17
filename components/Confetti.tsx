
import React, { useEffect, useState } from 'react';

interface ConfettiProps {
  onComplete: () => void;
}

const Confetti: React.FC<ConfettiProps> = ({ onComplete }) => {
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsDone(true);
      onComplete();
    }, 3000); // Animation duration matches CSS

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (isDone) {
    return null;
  }

  const confettiPieces = Array.from({ length: 150 }).map((_, index) => {
    const style = {
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 2}s`,
      backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
    };
    return <div key={index} className="confetti-piece" style={style}></div>;
  });

  return (
    <>
      <style>{`
        .confetti-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
          z-index: 9999;
        }
        .confetti-piece {
          position: absolute;
          width: 8px;
          height: 25px;
          opacity: 0;
          top: -50px;
          animation: drop 3s linear forwards;
        }
        @keyframes drop {
          0% {
            transform: translateY(0vh) rotateZ(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotateZ(720deg);
            opacity: 0;
          }
        }
      `}</style>
      <div className="confetti-container">{confettiPieces}</div>
    </>
  );
};

export default Confetti;
