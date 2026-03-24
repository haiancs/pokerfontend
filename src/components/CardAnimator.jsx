import React, { useState, useEffect, useRef } from 'react';
import { getCardBackStyle } from '../utils/cardUtils';
import { playChipDropByDenomination } from '../utils/SoundManager';

const CardAnimator = ({ communityCards = [], myHand = [], players = [], pot = 0 }) => {
  const [flyingCards, setFlyingCards] = useState([]);
  const [flyingChips, setFlyingChips] = useState([]);
  const prevCommunityLen = useRef(communityCards.length);
  const prevHandLen = useRef(myHand.length);
  const prevPotRef = useRef(pot);
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

  const createChipBurstToPot = (deltaAmount = 1) => {
    const potEl = document.getElementById('pot-chip-target');
    if (!potEl || deltaAmount <= 0) return;
    const targetRect = potEl.getBoundingClientRect();
    if (targetRect.width === 0 || targetRect.height === 0) return;

    const sourceAnchor = document.querySelector('.action-panel')?.getBoundingClientRect();
    const sourceX = sourceAnchor ? sourceAnchor.left + sourceAnchor.width / 2 : window.innerWidth / 2;
    const sourceY = sourceAnchor ? sourceAnchor.top + 8 : window.innerHeight - 56;
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;

    const buildChipDenominations = (delta, maxCount) => {
      const denoms = [100, 25, 5, 1];
      let remaining = Math.max(1, Math.round(delta));
      const stack = [];
      while (remaining > 0 && stack.length < maxCount) {
        const denom = denoms.find((d) => d <= remaining) || 1;
        stack.push(denom);
        remaining -= denom;
      }
      if (stack.length >= maxCount && remaining > 0) {
        stack[stack.length - 1] = 100;
      }
      while (stack.length < Math.min(3, maxCount)) {
        stack.push(stack[stack.length - 1] || 1);
      }
      return stack;
    };

    const chipCount = Math.max(3, Math.min(9, Math.ceil(deltaAmount / 70)));
    const chipDenoms = buildChipDenominations(deltaAmount, chipCount);
    const chips = chipDenoms.map((denom, i) => {
      const id = `chip-${animationIdRef.current++}`;
      return {
        id,
        denom,
        delay: i * 55,
        startX: sourceX + (Math.random() * 36 - 18),
        startY: sourceY + (Math.random() * 10 - 5),
        dx: targetX - sourceX + (Math.random() * 18 - 9),
        dy: targetY - sourceY + (Math.random() * 14 - 7),
        rotate: 220 + Math.random() * 260,
        jitterX: (Math.random() * 4 - 2).toFixed(2),
        jitterY: (Math.random() * 3 - 1.5).toFixed(2),
      };
    });

    setFlyingChips((prev) => [...prev, ...chips]);
    chips.slice(0, 3).forEach((chip) => {
      window.setTimeout(() => {
        if (!isMounted.current) return;
        playChipDropByDenomination(chip.denom);
      }, chip.delay + 80);
    });
    window.setTimeout(() => {
      if (!isMounted.current) return;
      const chipIds = new Set(chips.map((chip) => chip.id));
      setFlyingChips((prev) => prev.filter((chip) => !chipIds.has(chip.id)));
    }, 950 + chipDenoms.length * 55);
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

  // Watch pot growth and play chip fly animation
  useEffect(() => {
    const prevPot = prevPotRef.current || 0;
    if (pot > prevPot) {
      const delta = pot - prevPot;
      createChipBurstToPot(delta);
    }
    prevPotRef.current = pot;
  }, [pot]);

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
          {flyingChips.map((chip) => (
            <div
              key={chip.id}
              className={`pointer-events-none fixed z-[9998] w-3 h-3 rounded-full border chip-flight chip-denom-${chip.denom}`}
              style={{
                left: chip.startX,
                top: chip.startY,
                '--chip-dx': `${chip.dx}px`,
                '--chip-dy': `${chip.dy}px`,
                '--chip-delay': `${chip.delay}ms`,
                '--chip-rotate': `${chip.rotate}deg`,
                '--chip-jitter-x': `${chip.jitterX}px`,
                '--chip-jitter-y': `${chip.jitterY}px`,
              }}
            />
          ))}
      </>
  );
};

export default CardAnimator;
