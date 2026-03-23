import React, { useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import Card from './Card';

const InfoPanel = ({ 
    players = []
}) => {
    const scrollRef = useRef(null);
    const activeRowRef = useRef(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    const activeIndex = players.findIndex((player) => player.isActive);
    const shouldUseCircularOrder = isOverflowing && players.length > 0 && activeIndex !== -1;

    const displayPlayers = useMemo(() => {
        if (!shouldUseCircularOrder) {
            return players;
        }

        const len = players.length;
        const middleIndex = Math.floor(len / 2);
        const start = ((activeIndex - middleIndex) % len + len) % len;
        return Array.from({ length: len }, (_, i) => players[(start + i) % len]);
    }, [players, shouldUseCircularOrder, activeIndex]);

    useEffect(() => {
        const scrollEl = scrollRef.current;
        if (!scrollEl) return;

        const updateOverflow = () => {
            setIsOverflowing(scrollEl.scrollHeight > scrollEl.clientHeight + 1);
        };

        updateOverflow();
        const resizeObserver = new ResizeObserver(updateOverflow);
        resizeObserver.observe(scrollEl);
        return () => resizeObserver.disconnect();
    }, [players.length]);

    useEffect(() => {
        if (!shouldUseCircularOrder) {
            return;
        }

        const scrollEl = scrollRef.current;
        const activeEl = activeRowRef.current;
        if (!scrollEl || !activeEl) {
            return;
        }

        const targetTop = activeEl.offsetTop - scrollEl.clientHeight / 2 + activeEl.clientHeight / 2;
        scrollEl.scrollTo({
            top: Math.max(0, targetTop),
            behavior: 'smooth'
        });
    }, [shouldUseCircularOrder, displayPlayers]);

    return (
        <aside className="info-panel w-[280px] h-full flex flex-col gap-2 p-3 bg-black/30 border-r-2 border-white/10 backdrop-blur-sm z-10 overflow-hidden">
            <div className="relative h-full min-h-0">
                <div
                    ref={scrollRef}
                    className={clsx(
                        "flex flex-col gap-1.5 h-full pr-1",
                        isOverflowing ? "overflow-y-auto scrollbar-thin" : "overflow-y-hidden"
                    )}
                >
                    {displayPlayers.map((player) => {
                    const isMe = player.isMe;
                    const isActive = player.isActive;
                    const isFolded = player.status === 'fold';
                    
                    return (
                        <div 
                            key={player.id || player.socketId}
                            ref={isActive ? activeRowRef : null}
                            className={clsx(
                                "flex justify-between items-center p-1.5 rounded border transition-all duration-200 origin-center",
                                isMe 
                                    ? "bg-[#f59e0b]/20 border-[#f59e0b]" 
                                    : (isActive ? "bg-[#ef4444]/20 border-[#ef4444]" : "bg-white/10 border-white/10"),
                                isActive && "shadow-[0_0_0_1px_rgba(239,68,68,0.35)]",
                                isFolded && "opacity-45 grayscale saturate-0 scale-[0.9] blur-[0.5px] bg-slate-700/30 border-slate-500/40"
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

                {shouldUseCircularOrder && (
                    <>
                        <div className="pointer-events-none absolute left-0 right-0 top-0 h-8 bg-gradient-to-b from-[#020617]/95 via-[#020617]/60 to-transparent" />
                        <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-8 bg-gradient-to-t from-[#020617]/95 via-[#020617]/60 to-transparent" />
                    </>
                )}
            </div>
        </aside>
    );
};

export default InfoPanel;
