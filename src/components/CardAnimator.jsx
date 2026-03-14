import React, { useState, useEffect, useRef } from 'react';
import { getCardBackStyle } from '../utils/cardUtils';

const CardAnimator = ({ communityCards = [], myHand = [], players = [] }) => {
  const [flyingCards, setFlyingCards] = useState([]);
  const prevCommunityLen = useRef(communityCards.length);
  const prevHandLen = useRef(myHand.length);
  const prevFoldedPlayers = useRef({}); // Track fold status per player ID
  const animationIdRef = useRef(0);
  const isMounted = useRef(true);
  const backStyle = getCardBackStyle('RED');
  
  // Track last known positions of cards
  const cardPositionsRef = useRef({});

  useEffect(() => {
    isMounted.current = true;
    return () => {
        isMounted.current = false;
    };
  }, []);

  // Update card positions periodically or on change
  useEffect(() => {
      const updatePositions = () => {
          // Community Cards
          communityCards.forEach((_, i) => {
              const el = document.getElementById(`community-card-${i}`);
              if (el) {
                  const rect = el.getBoundingClientRect();
                  if (rect.width > 0) {
                      cardPositionsRef.current[`community-${i}`] = rect;
                  }
              }
          });
          // My Hand
          myHand.forEach((_, i) => {
              const el = document.getElementById(`my-card-${i}`);
              if (el) {
                  const rect = el.getBoundingClientRect();
                  if (rect.width > 0) {
                      cardPositionsRef.current[`hand-${i}`] = rect;
                  }
              }
          });
          // Other Players Mini Cards in InfoPanel
          players.forEach((player) => {
              const pid = player.id || player.socketId;
              [0, 1].forEach(i => {
                  const el = document.getElementById(`player-card-${pid}-${i}`);
                  if (el) {
                      const rect = el.getBoundingClientRect();
                      if (rect.width > 0) {
                          cardPositionsRef.current[`player-${pid}-${i}`] = rect;
                      }
                  }
              });
          });
      };
      
      // Update immediately and after a short delay to allow layout to settle
      updatePositions();
      const timer = setTimeout(updatePositions, 500);
      return () => clearTimeout(timer);
  });

  const createAnimation = (fromId, toId, delay = 0, fromRect = null) => {
    // Retry finding elements
    const attemptAnimation = (attempts = 0) => {
        if (!isMounted.current) return;
        if (attempts > 5) return; // Give up after 500ms

        let startRect = fromRect;
        let fromEl = null;

        if (!startRect) {
             fromEl = document.getElementById(fromId);
             if (fromEl) startRect = fromEl.getBoundingClientRect();
        }
        
        const toEl = document.getElementById(toId);

        if (startRect && toEl) {
            const endRect = toEl.getBoundingClientRect();

            // Validate rects (sometimes zero if hidden)
            if (startRect.width === 0 || endRect.width === 0) {
                 setTimeout(() => attemptAnimation(attempts + 1), 100);
                 return;
            }

            const id = animationIdRef.current++;
            
            setFlyingCards(prev => [...prev, {
                id,
                style: {
                    left: startRect.left,
                    top: startRect.top,
                    width: startRect.width,
                    height: startRect.height,
                    position: 'fixed', // Use fixed to ensure it's relative to viewport
                    transition: 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
                    zIndex: 9999,
                    opacity: 1,
                    pointerEvents: 'none'
                }
            }]);

            // Trigger move
            setTimeout(() => {
                if (!isMounted.current) return;
                setFlyingCards(prev => prev.map(c => {
                    if (c.id === id) {
                        return {
                            ...c,
                            style: {
                                ...c.style,
                                left: endRect.left,
                                top: endRect.top,
                                width: endRect.width,
                                height: endRect.height,
                                transform: 'rotate(360deg)'
                            }
                        };
                    }
                    return c;
                }));
            }, 50 + delay);

            // Cleanup
            setTimeout(() => {
                if (!isMounted.current) return;
                setFlyingCards(prev => prev.filter(c => c.id !== id));
            }, 700 + delay);
        } else {
            // Retry
            setTimeout(() => attemptAnimation(attempts + 1), 100);
        }
    };

    attemptAnimation();
  };

  // Watch Community Cards
  useEffect(() => {
      if (communityCards.length > prevCommunityLen.current) {
          const diff = communityCards.length - prevCommunityLen.current;
          // Animate only the new cards (Fly In)
          for (let i = 0; i < diff; i++) {
              const cardIndex = prevCommunityLen.current + i;
              createAnimation('deck', `community-card-${cardIndex}`, i * 150);
          }
      } else if (communityCards.length < prevCommunityLen.current) {
          // Cards removed (Fly Out to Discard)
          const removedCount = prevCommunityLen.current - communityCards.length;
          for (let i = 0; i < removedCount; i++) {
              const cardIndex = prevCommunityLen.current - 1 - i;
              const lastRect = cardPositionsRef.current[`community-${cardIndex}`];
              if (lastRect) {
                  createAnimation(null, 'discard-pile', i * 100, lastRect);
              }
          }
      }
      prevCommunityLen.current = communityCards.length;
  }, [communityCards]);

  // Watch My Hand
  useEffect(() => {
      if (myHand.length > prevHandLen.current) {
           const diff = myHand.length - prevHandLen.current;
           // Fly In
           for (let i = 0; i < diff; i++) {
               const cardIndex = prevHandLen.current + i;
               createAnimation('deck', `my-card-${cardIndex}`, i * 150);
           }
      } else if (myHand.length < prevHandLen.current) {
           // Fly Out
           const removedCount = prevHandLen.current - myHand.length;
           for (let i = 0; i < removedCount; i++) {
               const cardIndex = prevHandLen.current - 1 - i;
               const lastRect = cardPositionsRef.current[`hand-${cardIndex}`];
               if (lastRect) {
                   createAnimation(null, 'discard-pile', i * 100, lastRect);
               }
           }
      }
      prevHandLen.current = myHand.length;
  }, [myHand]);

  // Watch Other Players Folds
  useEffect(() => {
      players.forEach(player => {
          const pid = player.id || player.socketId;
          const isFolded = player.status === 'fold';
          const wasFolded = prevFoldedPlayers.current[pid];

          if (isFolded && !wasFolded) {
              // Trigger fold animation
              [0, 1].forEach(i => {
                  const lastRect = cardPositionsRef.current[`player-${pid}-${i}`];
                  if (lastRect) {
                      createAnimation(null, 'discard-pile', i * 100, lastRect);
                  }
              });
          }
          prevFoldedPlayers.current[pid] = isFolded;
      });
  }, [players]);

  return (
      <>
          {flyingCards.map(card => (
              <div 
                key={card.id} 
                style={card.style} 
                className="shadow-2xl rounded"
              >
                  <div className="w-full h-full bg-no-repeat rounded border border-black/20" style={backStyle}></div>
              </div>
          ))}
      </>
  );
};

export default CardAnimator;
