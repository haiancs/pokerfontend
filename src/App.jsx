import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import PokerTable from './components/PokerTable';
import ActionPanel from './components/ActionPanel';
import Login from './components/Login';
import HandResultModal from './components/HandResultModal';
import ErrorBoundary from './components/ErrorBoundary';
import { Menu } from 'lucide-react';

// Use environment variable or default to localhost:3000
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  const socketRef = useRef(null);

  // 游戏状态
  const [gameState, setGameState] = useState({
    pot: 0,
    communityCards: [], 
    players: [],
    maxHands: null,
    handsPlayed: 0,
    state: 'WAITING',
    dealerIndex: 0,
    currentBet: 0,
    minRaise: 20,
    minTotalRaiseTo: 40,
    bigBlind: 20,
    winners: [],
    showdown: false
  });

  const [showGameOver, setShowGameOver] = useState(false);
  const [gameOverStats, setGameOverStats] = useState([]);
  const [showHandResult, setShowHandResult] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [hasConfirmedResult, setHasConfirmedResult] = useState(false); // Track if user confirmed current result
  const scrollContainerRef = useRef(null);
  const lastScrollYRef = useRef(0);
  const touchStartYRef = useRef(0);

  useEffect(() => {
     // Reset confirmation when winners are cleared (new hand started)
     if (!gameState.winners || gameState.winners.length === 0) {
         setHasConfirmedResult(false);
     }
  }, [gameState.winners]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    console.log('Setup Scroll Listener, container:', container, 'isLoggedIn:', isLoggedIn); // 确认容器是否存在
    
    // 如果没有容器且未登录，则不进行绑定。如果登录了但还没容器，可能是渲染时机问题。
    if (!container && !isLoggedIn) return;

    // 如果已登录但 container 为空，可能是因为 DOM 尚未更新。
    // 但在 useEffect 中，DOM 应该已经挂载。
    // 如果还是不行，可能需要 useLayoutEffect 或者在 ref callback 中处理。
    
    // 即使 container 为 null，我们也绑定 document 级别的事件 (Touch/Wheel)
    // 这样至少能在移动端和电脑滚轮上工作

    let ticking = false;

    // 处理滚动事件 (桌面/有滚动条的情况)
    const handleScroll = () => {
        if (!container) return; // 安全检查

        if (!ticking) {
            window.requestAnimationFrame(() => {
                const currentScrollY = Math.max(0, container.scrollTop);
                const lastScrollY = lastScrollYRef.current;
                
                console.log('Scroll Event:', currentScrollY); // 简化日志

                if (Math.abs(currentScrollY - lastScrollY) > 5) {
                    if (currentScrollY > lastScrollY && currentScrollY > 60) {
                        console.log('Hide Header (Scroll)');
                        setIsHeaderVisible(false);
                    } else if (currentScrollY < lastScrollY) {
                        console.log('Show Header (Scroll)');
                        setIsHeaderVisible(true);
                    }
                    lastScrollYRef.current = currentScrollY;
                }
                ticking = false;
            });
            ticking = true;
        }
    };

    // 全局滚轮监听 (绑定到 document，确保捕获)
    const handleWheel = (e) => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                console.log('Wheel Event:', e.deltaY);
                if (e.deltaY > 10) {
                    console.log('Hide Header (Wheel)');
                    setIsHeaderVisible(false);
                } else if (e.deltaY < -10) {
                    console.log('Show Header (Wheel)');
                    setIsHeaderVisible(true);
                }
                ticking = false;
            });
            ticking = true;
        }
    };

    // 全局触摸监听 (绑定到 document，确保捕获)
    const handleTouchStart = (e) => {
        touchStartYRef.current = e.touches[0].clientY;
        ticking = false;
    };

    const handleTouchMove = (e) => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const currentY = e.touches[0].clientY;
                const startY = touchStartYRef.current;
                const diff = startY - currentY;
                
                console.log('Touch Move:', diff);

                if (Math.abs(diff) > 30) {
                     if (diff > 0) {
                         console.log('Hide Header (Touch)');
                         setIsHeaderVisible(false);
                     } else {
                         console.log('Show Header (Touch)');
                         setIsHeaderVisible(true);
                     }
                     touchStartYRef.current = currentY;
                }
                
                ticking = false;
            });
            ticking = true;
        }
    };

    // Scroll 仍然绑定在容器上
    if (container) {
        container.addEventListener('scroll', handleScroll);
    }
    // Wheel 和 Touch 绑定到 document 上，确保即使鼠标在子元素上也能触发
    document.addEventListener('wheel', handleWheel, { passive: true });
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
        console.log('Cleanup Scroll Listener');
        if (container) {
            container.removeEventListener('scroll', handleScroll);
        }
        document.removeEventListener('wheel', handleWheel);
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isLoggedIn]); // 依赖 isLoggedIn，确保登录后重新绑定

  useEffect(() => {
    // Check for existing session
    const session = localStorage.getItem('poker_session');
    if (session) {
        try {
            const { nickname, roomId, uid, maxHands, maxPlayers } = JSON.parse(session);
            if (nickname && roomId && uid) {
                console.log('Restoring session:', { nickname, roomId, uid });
                handleLogin({ nickname, roomId, maxHands, maxPlayers, uid });
            }
        } catch (e) {
            console.error('Failed to parse session:', e);
            localStorage.removeItem('poker_session');
        }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Effect to control HandResultModal visibility
  useEffect(() => {
      if (gameState.winners && gameState.winners.length > 0) {
          if (!hasConfirmedResult) {
              setShowHandResult(true);
          }
      } else {
          setShowHandResult(false);
      }
  }, [gameState.winners, hasConfirmedResult]);

  const handleLogin = ({ nickname, roomId, maxHands, maxPlayers, uid }) => {
    // Generate or use existing uid
    const userId = uid || Math.random().toString(36).substr(2, 9);
    
    // Save session
    localStorage.setItem('poker_session', JSON.stringify({
        nickname,
        roomId,
        uid: userId,
        maxHands,
        maxPlayers
    }));

    setUser({ nickname });
    setRoom({ roomId });

    // Connect to Socket.io server
    // Configure with websocket transport first to avoid polling issues
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to server with ID:', socket.id);
      socket.emit('join_table', { 
        tableId: roomId, 
        playerName: nickname,
        maxHands,
        maxPlayers,
        uid: userId // Send persistent user ID
      });
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      // alert(`Connection error: ${err.message}`);
    });

    socket.on('game_update', (data) => {
      console.log('Game update:', data);
      if (!data) {
        console.error('Received empty game update');
        return;
      }
      // Map server state to frontend state structure if necessary
      
      const mySocketId = socketRef.current?.id;
      
      // Calculate relative positions
      // Find my index
      const myIndex = data.players.findIndex(p => p.socketId === mySocketId);
      // If I am not found (observer?), use 0. But I should be found.
      const baseIndex = myIndex === -1 ? 0 : myIndex;
      const totalPlayers = data.players.length;

      const mappedPlayers = data.players.map((p, index) => {
        // Calculate relative position index (0 is me, 1 is left, etc.)
        // Actually, we want: Me at 0. Next player at 1, etc.
        // Wait, PokerTable renders positions based on index in array.
        // So we need to REORDER the array so that I am at index 0.
        // BUT, we also need to keep track of the original turn order?
        // No, turn order is handled by 'isActive' flag.
        // So reordering for display is fine.
        
        // Let's NOT reorder here, but pass a `displayIndex` or let PokerTable handle reordering.
        // Actually, easiest is to reorder the array here.
        // But we need to make sure we don't mess up `dealerIndex`.
        // Dealer index is an index into the original array.
        
        return {
          id: p.socketId,
          name: p.name,
          stack: p.chips,
          cards: p.hand ? p.hand.map(c => {
             // ... existing card mapping ...
             if (typeof c === 'string') {
                 if (c === 'XX') {
                     return {
                         rank: '',
                         suit: '',
                         revealed: false
                     };
                 }
                 const rankMap = { 'A': 'A', 'K': 'K', 'Q': 'Q', 'J': 'J', 'T': '10' };
                 const suitMap = { 's': 'spades', 'h': 'hearts', 'd': 'diamonds', 'c': 'clubs' };
                 const rankChar = c.slice(0, -1);
                 const suitChar = c.slice(-1);
                 return {
                     rank: rankMap[rankChar] || rankChar,
                     suit: suitMap[suitChar],
                     revealed: true
                 };
             }
             return c;
          }) : [],
          bet: p.bet,
          online: p.online,
          status: p.folded ? 'fold' : (p.allIn ? 'all-in' : (p.online === false ? 'offline' : 'active')),
          isActive: p.isTurn,
          isReady: data.state === 'WAITING' && p.isReady, // Only show ready status in WAITING state
          isMe: p.socketId === mySocketId,
          originalIndex: index // Keep track of original index for dealer calculation
        };
      });

      // Reorder players array so 'Me' is first
      const reorderedPlayers = [];
      if (myIndex !== -1) {
          for (let i = 0; i < totalPlayers; i++) {
              reorderedPlayers.push(mappedPlayers[(myIndex + i) % totalPlayers]);
          }
      } else {
          reorderedPlayers.push(...mappedPlayers);
      }
      
      // Transform community cards
      const mappedCommunityCards = data.communityCards.map(c => {
         // ... existing logic ...
         if (typeof c === 'string') {
             const rankMap = { 'A': 'A', 'K': 'K', 'Q': 'Q', 'J': 'J', 'T': '10' };
             const suitMap = { 's': 'spades', 'h': 'hearts', 'd': 'diamonds', 'c': 'clubs' };
             const rankChar = c.slice(0, -1);
             const suitChar = c.slice(-1);
             return {
                 rank: rankMap[rankChar] || rankChar,
                 suit: suitMap[suitChar]
             };
         }
         return c;
      });

      setGameState({
        pot: data.pot,
        pots: data.pots || [], // 接收分池信息
        communityCards: mappedCommunityCards,
        players: reorderedPlayers, // Use reordered array
        maxHands: data.maxHands,
        handsPlayed: data.handsPlayed,
        state: data.state,
        dealerIndex: data.dealerIndex, // Original dealer index
        currentBet: data.currentBet,
        minRaise: data.minRaise || 20,
        minTotalRaiseTo: data.minTotalRaiseTo || ((data.currentBet || 0) + (data.minRaise || 20)),
        bigBlind: data.bigBlind || 20,
        winners: data.winners || [],
        showdown: !!data.showdown
      });
      
      // 检查是否需要显示结算 Modal
      if (data.winners && data.winners.length > 0) {
          // Only show if not confirmed yet
          // Note: accessing state inside socket callback might be stale if not using functional update or ref.
          // But here setGameState triggers re-render. 
          // We should control showHandResult in a useEffect dependent on gameState.winners
      } else if (data.state === 'PREFLOP' || data.state === 'FLOP') {
          // 新游戏开始，关闭弹窗
          setShowHandResult(false);
      }
      
      if (data.state === 'GAME_OVER') {
          // Process stats
          const sortedPlayers = [...mappedPlayers].sort((a, b) => b.stack - a.stack);
          setGameOverStats(sortedPlayers);
          setShowGameOver(true);
      } else {
          setShowGameOver(false);
      }

      setIsLoggedIn(true);
    });
    
    socket.on('error', (err) => {
      console.error('Socket error:', err);
      alert(err.message || 'Connection error');
      setIsLoggedIn(false);
    });
  };

  const handleAction = (action, amount) => {
    console.log(`Action: ${action}, Amount: ${amount}`);
    if (socketRef.current) {
        socketRef.current.emit('action', {
            tableId: room.roomId,
            action,
            amount
        });
    }
  };

  const handleBorrow = () => {
    if (socketRef.current) {
        socketRef.current.emit('borrow_chips', {
            tableId: room.roomId
        });
    }
  };

  const handleReady = () => {
    // Local update to close modal immediately
    setHasConfirmedResult(true);
    setShowHandResult(false);

    if (socketRef.current) {
        socketRef.current.emit('player_ready', {
            tableId: room.roomId
        });
    }
  };

  const handleRestart = () => {
      if (socketRef.current) {
          socketRef.current.emit('restart_game', {
              tableId: room.roomId
          });
          // 乐观更新：关闭弹窗
          setShowGameOver(false);
      }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const myPlayer = gameState.players.find(p => p.isMe);
  const isMyTurn = myPlayer?.isActive || false;

  return (
    // 全局布局容器：Flex Column, fixed height (dvh for mobile)
    <div className="h-[100dvh] w-full bg-[#0f172a] flex flex-col relative overflow-hidden">
      
      {/* 顶部固定 Header */}
      <div 
        className={`absolute top-0 left-0 right-0 z-50 w-full shadow-lg transition-transform duration-300 ease-in-out ${
            isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="bg-[#1e293b] p-4 flex justify-between items-center border-b border-white/5">
           <div className="flex items-center gap-3">
             <div className="bg-blue-600/20 p-2 rounded-lg">
                <Menu className="w-5 h-5 text-blue-400" />
             </div>
             <div>
                <h1 className="text-white font-bold text-sm tracking-wide">POKER<span className="text-blue-500">PRO</span></h1>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] text-slate-400 font-medium">Room: {room.roomId}</span>
                    {gameState.maxHands ? (
                      <span className="text-[10px] text-blue-300 font-medium">
                        Hand: {Math.min(gameState.handsPlayed + 1, gameState.maxHands)}/{gameState.maxHands}
                      </span>
                    ) : null}
                </div>
             </div>
           </div>
           
           <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                    if (confirm('确定要退出游戏吗？')) {
                        localStorage.removeItem('poker_session');
                        window.location.reload();
                    }
                }}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700 transition-all text-xs font-bold"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                  <span>退出</span>
              </button>
           </div>
        </div>
      </div>

      {/* 滚动区域：PokerTable */}
      <div 
          ref={scrollContainerRef}
          className="flex-1 w-full overflow-y-auto scroll-smooth pb-32 pt-20 relative"
      >
         <PokerTable 
        players={gameState.players} 
        communityCards={gameState.communityCards} 
        pot={gameState.pot}
        pots={gameState.pots}
        dealerIndex={gameState.dealerIndex}
      />
         
         {/* Start Game / Ready Button Overlay */}
         {gameState.state === 'WAITING' && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-20 z-30 flex flex-col items-center gap-2">
                 {gameState.players.length >= 2 ? (
                     <button 
                        onClick={handleReady}
                        className={`px-8 py-3 rounded-xl font-bold text-lg shadow-xl transition-all transform hover:scale-105 active:scale-95 ${
                            myPlayer?.isReady 
                            ? 'bg-green-600 text-white ring-4 ring-green-500/30' 
                            : 'bg-yellow-500 text-slate-900 ring-4 ring-yellow-500/30 animate-pulse'
                        }`}
                     >
                        {myPlayer?.isReady ? '已准备 (等待开始...)' : '准备开始'}
                     </button>
                 ) : (
                     <div className="bg-slate-900/80 backdrop-blur text-slate-400 px-6 py-2 rounded-full border border-slate-700">
                         等待玩家加入 (当前: {gameState.players.length}/9)
                     </div>
                 )}
             </div>
         )}
      </div>

      {/* 底部固定 ActionPanel */}
      <div className="flex-none w-full z-40 bg-[#1a1f2e] border-t border-white/10 safe-area-bottom">
         {/* 如果需要显示等待提示，可以在这里加 */}
         {gameState.winners && gameState.winners.length > 0 && hasConfirmedResult && (
             <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-1 rounded-full text-xs backdrop-blur-sm border border-white/10">
                 等待其他玩家准备...
             </div>
         )}
         
         <ActionPanel 
            onAction={handleAction}
            currentBet={gameState.currentBet}
            amountToCall={Math.max(0, gameState.currentBet - (myPlayer?.bet || 0))} 
            minBet={gameState.minTotalRaiseTo} 
            maxBet={myPlayer?.stack || 0}
            potSize={gameState.pot}
            disabled={!isMyTurn}
         />
      </div>

      {/* Modals */}
      {showGameOver && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
           <div className="bg-[#1e293b] p-8 rounded-2xl max-w-md w-full text-center border border-white/10">
              <h2 className="text-3xl font-bold text-white mb-6">Game Over</h2>
              <div className="space-y-4 mb-8">
                 {gameOverStats.map((p, i) => (
                     <div key={i} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-white/5">
                         <div className="flex items-center gap-3">
                             <span className={`text-lg font-bold w-6 ${i===0 ? 'text-yellow-500' : 'text-slate-500'}`}>#{i+1}</span>
                             <span className="text-white">{p.name}</span>
                         </div>
                         <span className="font-mono text-green-400">{p.stack}</span>
                     </div>
                 ))}
              </div>
              <button 
                onClick={handleRestart}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all active:scale-95"
              >
                 Play Again (Restart)
              </button>
           </div>
        </div>
      )}

      {showHandResult && (
        <HandResultModal 
            winners={gameState.winners}
            onContinue={handleReady}
            myPlayer={myPlayer}
            communityCards={gameState.communityCards}
            players={gameState.players}
            showdown={gameState.showdown}
        />
      )}

      {/* Connection Status Toast (Optional) */}
      {!isLoggedIn && (
         <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-full text-sm shadow-lg z-50">
            Disconnected. Reconnecting...
         </div>
      )}

    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
