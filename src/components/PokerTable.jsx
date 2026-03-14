import React, { useEffect, useRef } from 'react';
import Card from './Card';
import { playRandomChip, playRandomCardSlide } from '../utils/SoundManager';

const PokerTable = ({ communityCards, pot }) => {
  const prevPotRef = useRef(pot);
  const prevCommunityCardsLengthRef = useRef(communityCards.length);

  useEffect(() => {
    if (pot > prevPotRef.current) {
        playRandomChip();
    }
    prevPotRef.current = pot;
  }, [pot]);

  useEffect(() => {
    if (communityCards.length > prevCommunityCardsLengthRef.current) {
        playRandomCardSlide();
    }
    prevCommunityCardsLengthRef.current = communityCards.length;
  }, [communityCards]);

  return (
    <div className="poker-table-area relative w-full h-full flex flex-col items-center justify-center p-8">
      
      {/* Community Cards Area */}
      <div className="community-row relative w-full flex items-center justify-center gap-4 mb-24 z-10">
          
          {/* Flop (3 Cards) */}
          <div className="flex items-center justify-center gap-2 px-6 py-4 bg-black/20 rounded-2xl border-2 border-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-sm min-w-[240px] min-h-[130px]">
            {[0, 1, 2].map((i) => (
              <div key={`flop-${i}`} id={`community-card-${i}`} className="w-[71px] h-[95px]">
                  {communityCards[i] ? (
                      <div className="w-full h-full shadow-lg transition-all duration-300 hover:-translate-y-2">
                        <Card rank={communityCards[i].rank} suit={communityCards[i].suit} className="w-full h-full" />
                      </div>
                  ) : (
                      <div id={`community-placeholder-${i}`} className="w-full h-full border-2 border-dashed border-white/20 rounded-[4px] bg-white/5 opacity-30"></div>
                  )}
              </div>
            ))}
          </div>

          {/* Turn (1 Card) */}
          <div className="flex items-center justify-center px-4 py-4 bg-black/20 rounded-2xl border-2 border-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-sm min-w-[100px] min-h-[130px]">
              <div id="community-card-3" className="w-[71px] h-[95px]">
                  {communityCards[3] ? (
                      <div className="w-full h-full shadow-lg transition-all duration-300 hover:-translate-y-2">
                        <Card rank={communityCards[3].rank} suit={communityCards[3].suit} className="w-full h-full" />
                      </div>
                  ) : (
                      <div id="community-placeholder-3" className="w-full h-full border-2 border-dashed border-white/20 rounded-[4px] bg-white/5 opacity-30"></div>
                  )}
              </div>
          </div>

          {/* River (1 Card) */}
          <div className="flex items-center justify-center px-4 py-4 bg-black/20 rounded-2xl border-2 border-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-sm min-w-[100px] min-h-[130px]">
              <div id="community-card-4" className="w-[71px] h-[95px]">
                  {communityCards[4] ? (
                      <div className="w-full h-full shadow-lg transition-all duration-300 hover:-translate-y-2">
                        <Card rank={communityCards[4].rank} suit={communityCards[4].suit} className="w-full h-full" />
                      </div>
                  ) : (
                      <div id="community-placeholder-4" className="w-full h-full border-2 border-dashed border-white/20 rounded-[4px] bg-white/5 opacity-30"></div>
                  )}
              </div>
          </div>
      </div>
      
    </div>
  );
};

export default PokerTable;
