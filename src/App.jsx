import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import PokerTable from './components/PokerTable';
import ActionPanel from './components/ActionPanel';
import Login from './components/Login';
import HandResultModal from './components/HandResultModal';
import { Settings, Menu, PauseCircle, Signal } from 'lucide-react';

// Use environment variable or default to localhost:3000
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
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
    bigBlind: 20,
    winners: [] // 新增 winners 状态
  });

  const [showGameOver, setShowGameOver] = useState(false);
  const [gameOverStats, setGameOverStats] = useState([]);
  const [showHandResult, setShowHandResult] = useState(false);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleLogin = ({ nickname, roomId, maxHands, maxPlayers }) => {
    setUser({ nickname });
    setRoom({ roomId });

    // Connect to Socket.io server
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to server');
      socket.emit('join_table', { 
        tableId: roomId, 
        playerName: nickname,
        maxHands,
        maxPlayers
      });
    });

    socket.on('game_update', (data) => {
      console.log('Game update:', data);
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
          status: p.folded ? 'fold' : (p.allIn ? 'all-in' : 'active'),
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
        communityCards: mappedCommunityCards,
        players: reorderedPlayers, // Use reordered array
        maxHands: data.maxHands,
        handsPlayed: data.handsPlayed,
        state: data.state,
        dealerIndex: data.dealerIndex, // Original dealer index
        currentBet: data.currentBet,
        minRaise: data.minRaise || 20,
        bigBlind: data.bigBlind || 20,
        winners: data.winners || [] // 更新 winners
      });
      
      // 检查是否需要显示结算 Modal
      // 如果后端传回 winners 且状态不是 PREFLOP (防止新的一局开始时还弹窗)
      // 但现在我们修改了后端，结算后状态会变成 WAITING 并且发送 winners
      if (data.winners && data.winners.length > 0) {
          setShowHandResult(true);
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
    if (socketRef.current) {
        socketRef.current.emit('player_ready', {
            tableId: room.roomId
        });
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const myPlayer = gameState.players.find(p => p.isMe);
  const isMyTurn = myPlayer?.isActive || false;

  return (
    // 全局滚动容器：h-screen overflow-y-auto
    <div className="h-screen w-full bg-[#0f172a] flex flex-col overflow-y-auto">
      
      {/* 顶部固定区域容器 - 设为 sticky 以便在滚动时保持在顶部 */}
      <div className="sticky top-0 z-50 w-full shadow-lg">
        {/* 顶部状态栏 */}
        <div className="h-14 bg-[#1e293b] w-full flex items-center justify-between px-4 border-b border-slate-700">
          <div className="flex items-center gap-4">
            <div className="text-xl font-bold text-white tracking-tight">Poker Science</div>
            {gameState.maxHands && (
                <div className="text-xs text-slate-400">
                    Hand: {gameState.handsPlayed} / {gameState.maxHands}
                </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
             {myPlayer && myPlayer.stack < 200 && (
                 <button 
                    onClick={handleBorrow}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse"
                 >
                    向系统借分 (+1000)
                 </button>
             )}
             <div className="bg-blue-600 px-2 py-1 rounded text-xs font-bold text-white">中文</div>
          </div>
        </div>

        {/* 次级信息栏 */}
        <div className="h-10 bg-[#1e293b]/95 w-full flex items-center justify-between px-4 backdrop-blur-sm border-b border-slate-700/50">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-bold text-white">9人桌</span>
            <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs">手牌 #{gameState.handsPlayed + 1}</span>
            {gameState.state === 'WAITING' && gameState.players.length < 2 && (
                <div className="text-yellow-400 text-xs animate-pulse">等待玩家加入... (需至少2人开始)</div>
            )}
            <div className="flex items-center gap-1 text-green-500 text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              已连接
            </div>
          </div>
        </div>
      </div>

      {/* Game Over Modal */}
      {showGameOver && gameState.state === 'GAME_OVER' && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-800 rounded-2xl border border-white/10 p-8 w-full max-w-md shadow-2xl">
                  <h2 className="text-3xl font-bold text-white text-center mb-6">游戏结束</h2>
                  <div className="space-y-4">
                      {gameOverStats.map((p, i) => (
                          <div key={p.id} className="flex items-center justify-between bg-slate-700/50 p-4 rounded-xl">
                              <div className="flex items-center gap-4">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-900 ${
                                      i === 0 ? 'bg-yellow-400' : (i === 1 ? 'bg-slate-400' : (i === 2 ? 'bg-orange-700' : 'bg-slate-600'))
                                  }`}>
                                      {i + 1}
                                  </div>
                                  <div className="text-white font-medium">{p.name}</div>
                              </div>
                              <div className="text-green-400 font-bold font-mono">
                                  ${p.stack}
                              </div>
                          </div>
                      ))}
                  </div>
                  <button 
                    onClick={() => window.location.reload()}
                    className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                      返回大厅
                  </button>
              </div>
          </div>
      )}

      {/* Hand Result Modal */}
      {showHandResult && (
          <HandResultModal 
              winners={gameState.winners} 
              myPlayer={myPlayer}
              onContinue={() => {
                  handleReady();
                  // 可以在这里临时隐藏，等待后端状态更新，或者保持显示直到状态变更为非 WAITING
                  // 为了交互流畅，点击后通常会变成“已准备”，但 Modal 可能需要关闭或者变成等待状态
                  // 简单起见，点击继续发送 Ready，后端如果人齐了会开始新局，前端收到 update 自动关闭
                  // 如果人没齐，前端会收到 Ready 状态更新。
                  // 我们让 Modal 保持显示，直到收到新一局的 update (state === PREFLOP)
                  // 或者我们可以添加一个 "Waiting for others..." 的状态在 Modal 内部
                  
                  // 但根据需求 "点击继续 替换准备按钮"，意味着点击后应该进入准备状态。
                  // 如果我们不关闭 Modal，用户就不知道发生了什么。
                  // 建议：点击继续 -> 关闭 Modal -> 显示桌面上的 "已准备" 状态 (现有的 UI)
                  setShowHandResult(false);
              }}
          />
      )}

      {/* 游戏主区域 - 不再限制 overflow，随父容器滚动 */}
      <div className="relative flex-shrink-0 bg-[#0a2540]">
        <PokerTable 
          players={gameState.players} 
          communityCards={gameState.communityCards} 
          pot={gameState.pot} 
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

      {/* 底部操作面板 - 设为 fixed 底部固定，或者随页面流（这里随页面流比较安全，或者 fixed bottom-0） */}
      {/* 用户的需求是 "整体滚动"，所以操作面板应该也是页面的一部分，或者固定在视口底部？*/}
      {/* 通常操作面板应该固定在屏幕底部方便操作。如果页面内容很长，面板可能会遮挡内容，但这是移动端常见模式。*/}
      {/* 这里选择 sticky bottom-0，这样如果内容不足一屏它在底部，内容超出一屏它悬浮在底部 */}
      <div className="sticky bottom-0 w-full z-50">
        <ActionPanel 
          onAction={handleAction} 
          minBet={Math.max((gameState.minRaise || 20), (gameState.currentBet || 0) + (gameState.minRaise || 20))}
          maxBet={myPlayer?.stack || 0}
          currentBet={gameState.currentBet || 0}
          amountToCall={Math.max(0, (gameState.currentBet || 0) - (myPlayer?.bet || 0))}
          potSize={gameState.pot || 0}
          disabled={!isMyTurn}
        />
      </div>
    </div>
  );
}

export default App;
