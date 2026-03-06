import React, { useMemo } from 'react';
import Card from './Card';
import PlayerSeat from './PlayerSeat';
import { clsx } from 'clsx';

const PokerTable = ({ players, communityCards, pot, dealerIndex }) => {
  const playerCount = players.length;

  // 坐标系统：top%, left%
  // 页面允许上下滚动，因此使用 min-h 增加垂直空间
  // 关键调整：
  // 1. 横向进一步收缩：Left Range 20% - 80% (原 15% - 85%)，避免宽屏下太散，窄屏下溢出。
  // 2. 纵向紧凑化：Top Range 15% - 85% (原 10% - 90%)，减少上下留白。
  // 3. 整体 min-h 调整为 700px (原 900px)，更紧凑。
  
  const positions = useMemo(() => {
    // 基础配置
    
    // 6人桌: 上下各1，左右各2
    const pos6 = [
      { top: 85, left: 50, side: 'bottom' },  // 1. Hero (Bottom)
      { top: 65, left: 20, side: 'left' },    // 2. Left Below
      { top: 35, left: 20, side: 'left' },    // 3. Left Above
      { top: 15, left: 50, side: 'top' },     // 4. Top
      { top: 35, left: 80, side: 'right' },   // 5. Right Above
      { top: 65, left: 80, side: 'right' },   // 6. Right Below
    ];

    // 7人桌: 上下各1，左2 (1上1下)，右3 (1下2上)
    const pos7Refined = [
      { top: 85, left: 50, side: 'bottom' },  // 1. Hero
      { top: 68, left: 20, side: 'left' },    // 2. Left Below
      { top: 32, left: 20, side: 'left' },    // 3. Left Above
      { top: 15, left: 50, side: 'top' },     // 4. Top
      { top: 25, left: 80, side: 'right' },   // 5. Right Above 1
      { top: 40, left: 80, side: 'right' },   // 6. Right Above 2
      { top: 68, left: 80, side: 'right' },   // 7. Right Below
    ];


  // 8人桌: 上下各1，左3 (1下2上)，右3 (1下2上)
  const pos8 = [
    { top: 85, left: 50, side: 'bottom' },  // 1. Hero
    { top: 68, left: 20, side: 'left' },    // 2. Left Below
    { top: 38, left: 20, side: 'left' },    // 3. Left Above 2 (Lower)
    { top: 22, left: 20, side: 'left' },    // 4. Left Above 1 (Higher)
    { top: 15, left: 50, side: 'top' },     // 5. Top
    { top: 22, left: 80, side: 'right' },   // 6. Right Above 1
    { top: 38, left: 80, side: 'right' },   // 7. Right Above 2
    { top: 68, left: 80, side: 'right' },   // 8. Right Below
  ];

  // 9人桌: 下1 (Hero)，左4 (2下2上)，右4 (2下2上)
  const pos9 = [
    { top: 85, left: 50, side: 'bottom' },  // 1. Hero (Bottom)
    
    // Left Side
    { top: 75, left: 16, side: 'left' },    // 2. Left Below 2 (Lower)
    { top: 58, left: 16, side: 'left' },    // 3. Left Below 1 (Higher)
    
    { top: 42, left: 16, side: 'left' },    // 4. Left Above 2 (Lower)
    { top: 25, left: 16, side: 'left' },    // 5. Left Above 1 (Higher)
    
    // Right Side
    { top: 25, left: 84, side: 'right' },   // 6. Right Above 1
    { top: 42, left: 84, side: 'right' },   // 7. Right Above 2
    
    { top: 58, left: 84, side: 'right' },   // 8. Right Below 1
    { top: 75, left: 84, side: 'right' },   // 9. Right Below 2
  ];

  let currentConfig;
  if (playerCount <= 6) currentConfig = pos6;
  else if (playerCount === 7) currentConfig = pos7Refined;
  else if (playerCount === 8) currentConfig = pos8;
  else currentConfig = pos9;

  return currentConfig.slice(0, playerCount).map(p => ({
    top: `${p.top}%`,
    left: `${p.left}%`,
    side: p.side, 
    transform: 'translate(-50%, -50%)'
  }));

}, [playerCount]);

return (
  <div className="relative w-full min-h-[700px] flex items-center justify-center pb-32 pt-10">
    
    <div className="absolute top-16 bottom-16 left-4 right-4 rounded-[100px] border-[12px] border-[#0a1f35] bg-[#133a5e] shadow-2xl opacity-90 pointer-events-none"></div>
    
    <div className="absolute top-24 bottom-24 left-10 right-10 rounded-[80px] border-2 border-yellow-500/10 opacity-50 pointer-events-none"></div>

    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-10 w-full">
      
      <div className="bg-[#0f172a]/90 backdrop-blur-sm px-6 py-1.5 rounded-full shadow-lg border border-yellow-500/20 flex items-center gap-2">
        <span className="text-[10px] text-yellow-500 uppercase tracking-widest font-bold">POT</span>
        <span className="text-xl font-bold text-white tracking-wide">{pot}</span>
      </div>

      <div className="flex items-center justify-center gap-3 px-6 py-3 bg-black/20 rounded-2xl border border-white/5 backdrop-blur-md">
        {communityCards.map((card, idx) => (
          <div key={idx} className="w-14 h-20 shadow-2xl transition-all duration-500">
              <Card 
                rank={card.rank} 
                suit={card.suit} 
                className="w-full h-full text-lg" 
              />
          </div>
        ))}
        {[...Array(5 - communityCards.length)].map((_, idx) => (
          <div key={`placeholder-${idx}`} className="w-14 h-20 border-2 border-dashed border-white/10 rounded-[4px] bg-white/5"></div>
        ))}
      </div>
    </div>

    {players.map((player, idx) => {
      const posStyle = positions[idx] || { top: '50%', left: '50%', display: 'none' };
      // Check if this player is dealer
      // The dealerIndex is based on original array index. 
      // But 'player' here is from reordered array.
      // We need to know if player.originalIndex === dealerIndex.
      // But we need 'dealerIndex' passed to PokerTable? Yes.
      // Or we can just check player.originalIndex in PokerTable if we pass dealerIndex prop.
      
      return (
        <div 
          key={player.id} 
          className="absolute transition-all duration-700 ease-out z-20"
          style={{ 
            top: posStyle.top,
            left: posStyle.left,
            transform: posStyle.transform
           }}
        >
          <PlayerSeat 
            player={player} 
            positionStyle={positions[idx]} 
            side={posStyle.side} 
            isHero={idx === 0} 
            isActive={player.isActive}
            isDealer={player.originalIndex === dealerIndex}
          />
        </div>
      );
    })}
  </div>
);
};

export default PokerTable;
