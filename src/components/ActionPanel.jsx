import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Plus, Minus } from 'lucide-react';

const ActionPanel = ({ 
  onAction, 
  currentBet = 0, 
  amountToCall = 0,
  minBet = 20, 
  maxBet = 2000, 
  potSize = 50,
  disabled = false
}) => {
  const [betAmount, setBetAmount] = useState(minBet * 3); // 默认 3BB

  // 确保 betAmount 至少是 minBet
  React.useEffect(() => {
      if (betAmount < minBet) {
          setBetAmount(minBet);
      }
  }, [minBet]);

  const handleBetChange = (amount) => {
    if (disabled) return;
    const newAmount = Math.max(minBet, Math.min(maxBet, amount));
    setBetAmount(newAmount);
  };

  const handleActionClick = (type, val) => {
    if (disabled) return;
    onAction(type, val);
  };

  return (
    <div className={clsx("w-full bg-[#1a1f2e] text-white p-3 rounded-t-2xl shadow-2xl border-t border-white/10 pb-6 relative transition-all duration-300", disabled && "opacity-70 grayscale")}>
      {disabled && (
        <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-[2px] rounded-t-2xl flex items-center justify-center pointer-events-auto cursor-not-allowed">
            <span className="text-white/90 font-bold text-sm bg-black/50 px-4 py-2 rounded-full border border-white/10 shadow-lg animate-pulse">
                等待其他玩家行动...
            </span>
        </div>
      )}

      {/* 顶部提示 - 更紧凑 */}
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">🎮 操作</span>
        </div>
        <div className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors", disabled ? "bg-slate-700 text-slate-400" : "bg-[#d4b979] text-[#1a1f2e]")}>
          {disabled ? "等待中" : "轮到你了"}
        </div>
      </div>

      {/* 下注控制区 - 压缩高度 */}
      <div className="bg-[#252a3a] rounded-lg p-2 mb-2 border border-white/5">
        <div className="flex justify-between items-center mb-1">
          <span className="text-gray-400 text-[10px]">下注金额</span>
          <span className="text-green-500 text-[10px]">有效积分: {maxBet}</span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <button 
            onClick={() => handleBetChange(betAmount - 100)}
            className="text-gray-400 hover:text-white transition-colors p-1"
            disabled={disabled}
          >
            <span className="text-xs">-100</span>
          </button>
          <button 
            onClick={() => handleBetChange(betAmount - 20)}
            className="text-gray-400 hover:text-white transition-colors p-1"
            disabled={disabled}
          >
             <span className="text-xs">-20</span>
          </button>
          
          <div className="flex-1 bg-[#32384a] h-9 rounded-md flex items-center justify-center border border-blue-500/50 relative">
            <input 
              type="number" 
              value={betAmount}
              onChange={(e) => handleBetChange(parseInt(e.target.value) || 0)}
              className="bg-transparent text-center text-lg font-bold w-full focus:outline-none text-white leading-none"
              disabled={disabled}
            />
            <div className="absolute -bottom-3.5 text-[8px] text-gray-500">
              = {(betAmount / 20).toFixed(1)} BB
            </div>
          </div>

          <button 
            onClick={() => handleBetChange(betAmount + 20)}
            className="bg-blue-600 hover:bg-blue-500 w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs shadow-md active:scale-95 transition-all"
            disabled={disabled}
          >
            +20
          </button>
          <button 
            onClick={() => handleBetChange(betAmount + 100)}
            className="bg-blue-600 hover:bg-blue-500 w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs shadow-md active:scale-95 transition-all"
            disabled={disabled}
          >
            +100
          </button>
        </div>

        {/* 快捷按钮 - 更小 */}
        <div className="grid grid-cols-4 gap-1.5">
          {['最小', '3BB', '4BB', '5BB'].map((label, idx) => {
             const val = idx === 0 ? minBet : minBet * (idx + 2); // 简单映射: 0->min, 1->3bb, 2->4bb, 3->5bb
             return (
              <button 
                key={label}
                onClick={() => handleBetChange(val)}
                className="bg-[#32384a] hover:bg-[#3e455b] py-1.5 rounded-md text-[10px] font-medium text-gray-300 border border-white/5"
                disabled={disabled}
              >
                {label}
              </button>
             )
          })}
        </div>
      </div>

      {/* 主要操作按钮 - 高度减小 */}
      <div className="grid grid-cols-4 gap-2 h-10">
        <button 
          onClick={() => handleActionClick('fold')}
          className="bg-gray-600 hover:bg-gray-500 rounded-lg font-bold text-sm shadow-lg active:scale-95 transition-all"
          disabled={disabled}
        >
          弃牌
        </button>

        {/* Check Button */}
        {amountToCall === 0 && (
          <button 
            onClick={() => handleActionClick('check')}
            className="bg-yellow-600 hover:bg-yellow-500 text-slate-900 rounded-lg font-bold text-sm shadow-lg active:scale-95 transition-all"
            disabled={disabled}
          >
            过牌
          </button>
        )}

        {/* Call Button */}
        {amountToCall > 0 && (
          <button 
            onClick={() => handleActionClick('call')}
            className="bg-green-600 hover:bg-green-500 rounded-lg font-bold text-sm shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center leading-none gap-0.5"
            disabled={disabled}
          >
            <span>跟注</span>
            <span className="text-[10px] font-normal opacity-80">{amountToCall}</span>
          </button>
        )}
        
        {/* Placeholder if one button is hidden to keep layout? No, grid auto layout */}
        {/* If we want 3 buttons always visible, we might need col-span adjustment */}
        {/* Let's make "Raise" take remaining space or standard grid */}
        
        {/* Raise / All-in Button */}
        <div className="col-span-2">
            {betAmount >= maxBet ? (
            <button 
            onClick={() => handleActionClick('allin', maxBet)}
            className="w-full h-full bg-red-600 hover:bg-red-500 rounded-lg font-bold text-sm shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center leading-none gap-0.5"
            disabled={disabled}
            >
            <span>全下</span>
            <span className="text-[10px] font-normal opacity-80">{maxBet}</span>
            </button>
            ) : (
            <button 
                onClick={() => handleActionClick('raise', betAmount)}
                className="w-full h-full bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-sm shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center leading-none gap-0.5"
                disabled={disabled}
            >
                <span>下注</span>
                <span className="text-[10px] font-normal opacity-80">{betAmount}</span>
            </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default ActionPanel;
