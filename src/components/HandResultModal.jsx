import React from 'react';
import { clsx } from 'clsx';
import Card from './Card';

const HandResultModal = ({ winners, onContinue, myPlayer, communityCards = [], players = [], showdown = false }) => {
  if (!winners || winners.length === 0) return null;

  const alivePlayers = players.filter((player) => {
    if (player.status === 'fold') return false;
    if (!player.cards || player.cards.length === 0) return false;
    return player.cards.every(card => card.revealed);
  });

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
          {showdown && (
            <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 space-y-4">
              <div>
                <div className="text-xs text-slate-400 mb-2">公共牌</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {communityCards.map((card, idx) => (
                    <div key={`board-${idx}`} className="w-10 h-14">
                      <Card rank={card.rank} suit={card.suit} />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400 mb-2">存活玩家手牌</div>
                <div className="space-y-2">
                  {alivePlayers.map((player, idx) => (
                    <div key={`alive-${idx}`} className="flex items-center justify-between bg-slate-800/70 rounded-lg px-3 py-2 border border-white/5">
                      <span className="text-sm font-semibold text-white">{player.name}</span>
                      <div className="flex items-center gap-1.5">
                        {player.cards.map((card, cardIdx) => (
                          <div key={`alive-${idx}-card-${cardIdx}`} className="w-9 h-12">
                            <Card rank={card.rank} suit={card.suit} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {winners.map((winner, idx) => (
            <div 
                key={idx} 
                className={clsx(
                    "flex items-center justify-between p-4 rounded-xl border transition-all",
                    winner.name === myPlayer?.name
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
                        {winner.handRankText ? winner.handRankText : (winner.handRank !== undefined ? `牌型等级: ${winner.handRank}` : '赢家')}
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
