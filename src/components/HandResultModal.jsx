import React from 'react';
import { clsx } from 'clsx';

const HandResultModal = ({ winners, onContinue, myPlayer }) => {
  if (!winners || winners.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#1e293b] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="bg-[#0f172a] p-6 text-center border-b border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 to-transparent pointer-events-none"></div>
            <h2 className="text-2xl font-bold text-white relative z-10">本局结算</h2>
            <div className="text-sm text-slate-400 mt-1 relative z-10">Winner Takes All</div>
        </div>

        {/* Winners List */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {winners.map((winner, idx) => (
            <div 
                key={idx} 
                className={clsx(
                    "flex items-center justify-between p-4 rounded-xl border transition-all",
                    winner.id === myPlayer?.socketId 
                        ? "bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]" 
                        : "bg-slate-800/50 border-white/5"
                )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xl">
                    {idx === 0 ? '👑' : '🎉'}
                </div>
                <div>
                    <div className="font-bold text-white text-lg">{winner.name}</div>
                    <div className="text-xs text-slate-400">
                        {winner.handRank !== undefined ? `牌型等级: ${winner.handRank}` : '赢家'}
                    </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-green-400 font-mono">+{winner.amount}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Chips</div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-2 bg-[#1e293b]">
            <button 
                onClick={onContinue}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 group"
            >
                <span>继续下一局</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
            <div className="text-center mt-3 text-xs text-slate-500">
                点击继续以准备开始下一手牌
            </div>
        </div>
      </div>
    </div>
  );
};

export default HandResultModal;
