import React from 'react';
import { clsx } from 'clsx';

// 经典花色 SVG 路径
const SuitPaths = {
  hearts: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  diamonds: "M12 2L22 12L12 22L2 12Z", 
  clubs: "M12,2C9,2,6.5,4,6.5,6.5C6.5,8,7.3,9.3,8.5,10c-2,0.5-3.5,2.3-3.5,4.5c0,2.5,2,4.5,4.5,4.5c0.8,0,1.5-0.2,2.1-0.6L11,22h2l-0.6-3.6c0.6,0.4,1.3,0.6,2.1,0.6c2.5,0,4.5-2,4.5-4.5c0-2.2-1.5-4-3.5-4.5c1.2-0.7,2-2,2-3.5C17.5,4,15,2,12,2z", 
  spades: "M12,2c0,0-6,7-6,11.5c0,3,2.5,5.5,5.5,5.5c0.8,0,1.5-0.2,2.1-0.6L13,22h-2l-0.6-3.6c0.6,0.4,1.3,0.6,2.1,0.6c3,0,5.5-2.5,5.5-5.5C18,9,12,2,12,2z"
};

const getSuitColor = (suit) => {
  if (suit === 'hearts' || suit === 'diamonds') return '#ef4444'; // Red-500
  return '#1e293b'; // Slate-800
};

const Card = ({ rank, suit, hidden = false, className }) => {
  if (hidden) {
    return (
      <div className={clsx(
        "relative w-full h-full bg-blue-900 rounded-[4px] border border-slate-600 shadow-md overflow-hidden",
        className
      )}>
        {/* 牌背纹理 */}
        <div className="absolute inset-0 bg-[#1e3a8a]" 
             style={{
               backgroundImage: `repeating-linear-gradient(45deg, #172554 25%, transparent 25%, transparent 75%, #172554 75%, #172554), repeating-linear-gradient(45deg, #172554 25%, #1e3a8a 25%, #1e3a8a 75%, #172554 75%, #172554)`,
               backgroundPosition: '0 0, 10px 10px',
               backgroundSize: '20px 20px'
             }}
        ></div>
        <div className="absolute inset-1 border-2 border-blue-400/20 rounded-[2px]"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-blue-950/50 flex items-center justify-center border border-white/10">
                <span className="text-white/20 font-serif text-[10px]">♠</span>
            </div>
        </div>
      </div>
    );
  }

  const color = getSuitColor(suit);
  const path = SuitPaths[suit];

  return (
    <div className={clsx(
      "relative w-full h-full bg-white rounded-[4px] shadow-sm border border-slate-300 select-none overflow-hidden",
      className
    )}>
      {/* 左上角: 数字 */}
      <div className="absolute top-0.5 left-1">
        <span className="text-base font-bold font-serif leading-none" style={{ color }}>{rank}</span>
      </div>

      {/* 右下角: 花色 */}
      <div className="absolute bottom-0.5 right-0.5">
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill={color}>
          <path d={path} />
        </svg>
      </div>
    </div>
  );
};

export default Card;
