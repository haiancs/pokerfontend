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
  const [showRaiseSlider, setShowRaiseSlider] = useState(false);
  const [betAmount, setBetAmount] = useState(minBet);
  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches;
  });

  const safeMaxBet = Math.max(1, maxBet);
  const safeMinBet = Math.max(1, Math.min(minBet, safeMaxBet));

  React.useEffect(() => {
    if (!disabled) {
      setBetAmount(safeMinBet);
    }
  }, [disabled, safeMinBet]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mediaQuery = window.matchMedia('(pointer: coarse)');
    const updateTouchState = () => setIsTouchDevice(mediaQuery.matches);
    updateTouchState();
    mediaQuery.addEventListener?.('change', updateTouchState);
    window.addEventListener('resize', updateTouchState);
    return () => {
      mediaQuery.removeEventListener?.('change', updateTouchState);
      window.removeEventListener('resize', updateTouchState);
    };
  }, []);

  const handleBetChange = (amount) => {
    if (disabled) return;
    const newAmount = Math.max(safeMinBet, Math.min(safeMaxBet, amount));
    setBetAmount(newAmount);
  };

  const handleActionClick = (type, val) => {
    if (disabled) return;
    if (onAction) onAction(type, val);
    setShowRaiseSlider(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (showRaiseSlider && !e.target.closest('.raise-control-group')) {
        setShowRaiseSlider(false);
      }
    };
    if (showRaiseSlider) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showRaiseSlider]);

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

      <div className="action-buttons-row flex gap-4 mb-4 z-20">
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

        <div className="relative raise-control-group">
          <button
            onClick={() => {
              if (isTouchDevice && !showRaiseSlider) {
                setShowRaiseSlider(true);
                return;
              }
              handleActionClick('raise', betAmount);
            }}
            disabled={disabled}
            className={clsx(
              "px-8 py-3 rounded-lg border-b-4 text-[#1a202c] font-['m6x11plus'] text-2xl uppercase transition-all active:translate-y-1 active:border-b-0 active:mt-1 font-bold min-w-[140px]",
              disabled
                ? "bg-slate-600 border-slate-800 cursor-not-allowed opacity-50 text-white"
                : "bg-[#f59e0b] border-[#d97706] hover:brightness-110 shadow-lg"
            )}
            onMouseEnter={() => !isTouchDevice && setShowRaiseSlider(true)}
            onMouseLeave={() => !isTouchDevice && setShowRaiseSlider(false)}
          >
            加注 {betAmount}
          </button>

          <div
            className={clsx(
              "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[min(18rem,calc(100vw-1.5rem))] bg-black/90 p-3 rounded-xl border border-white/20 flex flex-col gap-3 transition-all duration-200 origin-bottom z-40",
              showRaiseSlider ? "opacity-100 pointer-events-auto scale-100" : "opacity-0 pointer-events-none scale-95"
            )}
            onMouseEnter={() => !isTouchDevice && setShowRaiseSlider(true)}
            onMouseLeave={() => !isTouchDevice && setShowRaiseSlider(false)}
          >
            <div className="flex justify-between items-center text-white font-['m6x11plus']">
              <button onClick={() => handleBetChange(betAmount - bigBlind)} className="p-2 hover:bg-white/20 rounded-lg active:scale-95 transition-transform"><ChevronDown size={20} /></button>
              <span className="text-xl font-bold text-[#f59e0b]">${betAmount}</span>
              <button onClick={() => handleBetChange(betAmount + bigBlind)} className="p-2 hover:bg-white/20 rounded-lg active:scale-95 transition-transform"><ChevronUp size={20} /></button>
            </div>
            <input
              type="range"
              min={safeMinBet}
              max={safeMaxBet}
              step={bigBlind}
              value={betAmount}
              onChange={(e) => handleBetChange(Number(e.target.value))}
              className="w-full accent-[#f59e0b] h-4 bg-slate-700 rounded-lg appearance-none cursor-pointer touch-none"
            />
            {isTouchDevice && (
              <div className="pt-1 border-t border-white/10 mt-1">
                <button
                  onClick={() => {
                    handleActionClick('raise', betAmount);
                    setShowRaiseSlider(false);
                  }}
                  className="w-full py-2 bg-[#f59e0b] text-black font-bold rounded-lg uppercase"
                >
                  确认
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionPanel;
