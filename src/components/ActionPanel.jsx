import React, { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronUp, ChevronDown } from 'lucide-react';
import Card from './Card';

const ActionPanel = ({ 
  onAction, 
  amountToCall = 0,
  minBet = 20, 
  maxBet = 2000, 
  bigBlind = 20,
  disabled = false,
  myCards = []
}) => {
  const [betAmount, setBetAmount] = useState(minBet);
  
  // 安全范围校验
  const safeMinBet = Math.min(minBet, maxBet);
  
  React.useEffect(() => {
      if (!disabled) {
          setBetAmount(safeMinBet);
      }
  }, [disabled, safeMinBet]);

  const handleBetChange = (amount) => {
    if (disabled) return;
    const newAmount = Math.max(safeMinBet, Math.min(maxBet, amount));
    setBetAmount(newAmount);
  };

  const handleActionClick = (type, val) => {
    if (disabled) return;
    if (onAction) onAction(type, val);
  };

  return (
    <div className="action-panel w-full h-full flex flex-col justify-end items-center p-4 relative">
      <div className="action-top-row relative w-full flex items-end justify-center mb-6 z-10">
          <div className="hand-cards-row group flex justify-center items-end h-[120px] gap-2">
              {myCards.map((card, idx) => (
                 <div 
                    key={idx}
                    id={`my-card-${idx}`}
                    className={clsx(
                        "w-[71px] h-[95px] relative perspective-1000 cursor-pointer transition-all duration-300 group-hover:-translate-y-6",
                        card.selected ? "-translate-y-6" : ""
                    )}
                 >
                    <div className="w-full h-full relative preserve-3d transition-transform duration-500 group-hover:[transform:rotateY(180deg)]">
                        <div className="absolute inset-0 backface-hidden">
                            <Card hidden={true} className="w-full h-full shadow-lg" />
                        </div>
                        <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)]">
                            <Card rank={card.rank} suit={card.suit} className="w-full h-full shadow-lg" />
                        </div>
                    </div>
                 </div>
              ))}
              {myCards.length === 0 && (
                  <div className="text-white/30 font-['m6x11plus'] text-xl">等待发牌...</div>
              )}
          </div>
      </div>

      {/* 操作按钮组 (Actions) */}
      <div className="action-buttons-row flex gap-4 mb-4 z-20">
          {/* FOLD */}
          <button 
            onClick={() => handleActionClick('fold')}
            disabled={disabled}
            className={clsx(
                "px-8 py-3 rounded-lg border-b-4 text-white font-['m6x11plus'] text-2xl uppercase transition-all active:translate-y-1 active:border-b-0 active:mt-1",
                disabled 
                    ? "bg-slate-600 border-slate-800 cursor-not-allowed opacity-50" 
                    : "bg-[#e53e3e] border-[#c53030] hover:brightness-110 shadow-lg"
            )}
          >
            弃牌
          </button>

          {/* CHECK / CALL */}
          <button 
            onClick={() => handleActionClick(amountToCall > 0 ? 'call' : 'check')}
            disabled={disabled}
            className={clsx(
                "px-8 py-3 rounded-lg border-b-4 text-white font-['m6x11plus'] text-2xl uppercase transition-all active:translate-y-1 active:border-b-0 active:mt-1 min-w-[140px]",
                disabled 
                    ? "bg-slate-600 border-slate-800 cursor-not-allowed opacity-50" 
                    : "bg-[#3182ce] border-[#2b6cb0] hover:brightness-110 shadow-lg"
            )}
          >
            {amountToCall > 0 ? `跟注 ${amountToCall}` : '过牌'}
          </button>

          {/* RAISE */}
          <div className="relative group">
              <button 
                onClick={() => handleActionClick(amountToCall > 0 ? 'raise' : 'bet', betAmount)}
                disabled={disabled}
                className={clsx(
                    "px-8 py-3 rounded-lg border-b-4 text-[#1a202c] font-['m6x11plus'] text-2xl uppercase transition-all active:translate-y-1 active:border-b-0 active:mt-1 font-bold min-w-[140px]",
                    disabled 
                        ? "bg-slate-600 border-slate-800 cursor-not-allowed opacity-50 text-white" 
                        : "bg-[#f59e0b] border-[#d97706] hover:brightness-110 shadow-lg"
                )}
              >
                加注 {betAmount}
              </button>
              
              {/* Raise Slider / Controls (Hover to show or separate UI?) */}
              {/* 为了简化 Weblatro 风格，我们可以在按钮旁边放加减 */}
              {!disabled && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-black/80 p-2 rounded border border-white/20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                      <div className="flex justify-between items-center text-white font-['m6x11plus']">
                          <button onClick={() => handleBetChange(betAmount - bigBlind)} className="p-1 hover:bg-white/20 rounded"><ChevronDown size={16}/></button>
                          <span>{betAmount}</span>
                          <button onClick={() => handleBetChange(betAmount + bigBlind)} className="p-1 hover:bg-white/20 rounded"><ChevronUp size={16}/></button>
                      </div>
                      <input 
                        type="range" 
                        min={minBet} 
                        max={maxBet} 
                        step={bigBlind}
                        value={betAmount}
                        onChange={(e) => handleBetChange(Number(e.target.value))}
                        className="w-full accent-[#f59e0b] h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      />
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default ActionPanel;
