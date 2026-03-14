import React from 'react';
import { clsx } from 'clsx';
import Card from './Card';

const InfoPanel = ({ 
    players = []
}) => {
    return (
        <aside className="info-panel w-[280px] h-full flex flex-col gap-2 p-3 bg-black/30 border-r-2 border-white/10 backdrop-blur-sm z-10 overflow-y-auto">
            <div className="flex flex-col gap-1.5">
                {players.map((player) => {
                    const isMe = player.isMe;
                    const isActive = player.isActive;
                    const isFolded = player.status === 'fold';
                    
                    return (
                        <div 
                            key={player.id || player.socketId}
                            className={clsx(
                                "flex justify-between items-center p-1.5 rounded border transition-colors",
                                isMe 
                                    ? "bg-[#f59e0b]/20 border-[#f59e0b]" 
                                    : (isActive ? "bg-[#ef4444]/20 border-[#ef4444]" : "bg-white/10 border-white/10"),
                                isFolded && "opacity-60"
                            )}
                        >
                            <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-200 text-xs truncate font-bold">
                                                {player.name} {isMe && "(Me)"}
                                            </span>
                                            <div className="flex gap-1">
                                                {player.isDealer && <span className="px-1 bg-yellow-500 text-black text-[10px] font-bold rounded">D</span>}
                                                {player.isSB && <span className="px-1 bg-blue-500 text-white text-[10px] font-bold rounded">SB</span>}
                                                {player.isBB && <span className="px-1 bg-purple-500 text-white text-[10px] font-bold rounded">BB</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="font-['m6x11plus'] text-[#f59e0b] text-base">
                                                ${player.stack}
                                            </span>
                                            {player.bet > 0 && (
                                                <span className="bg-black/40 px-1.5 py-0.5 rounded text-xs text-slate-300">
                                                    下注: {player.bet}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-0.5 ml-2 relative min-h-[32px] items-center">
                                        <div id={`player-card-${player.id || player.socketId}-0`} className={clsx("w-[24px] h-[32px] transition-opacity duration-300", isFolded && "invisible opacity-0")}>
                                            <Card hidden={true} className="w-full h-full shadow-sm" />
                                        </div>
                                        <div id={`player-card-${player.id || player.socketId}-1`} className={clsx("w-[24px] h-[32px] transition-opacity duration-300", isFolded && "invisible opacity-0")}>
                                            <Card hidden={true} className="w-full h-full shadow-sm" />
                                        </div>
                                        {isFolded && (
                                            <span className="absolute inset-0 flex items-center justify-center bg-[#e53e3e] px-1.5 py-0.5 rounded text-[10px] text-white font-bold uppercase z-10">
                                                弃牌
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </aside>
    );
};

export default InfoPanel;
