import React, { useMemo, useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';
import PokerTable from './components/PokerTable';
import ActionPanel from './components/ActionPanel';
import InfoPanel from './components/InfoPanel';
import Login from './components/Login';
import HandResultModal from './components/HandResultModal';
import ErrorBoundary from './components/ErrorBoundary';
import BackgroundShader from './components/BackgroundShader';
import CardAnimator from './components/CardAnimator';
import ToastContainer from './components/ToastContainer';
import { LogOut, Share2 } from 'lucide-react';
import { playWinSound } from './utils/SoundManager';

// Use environment variable or default to localhost:3000
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const isMobileDevice = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia('(pointer: coarse)').matches || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

function AppContent() {
  const sharedRoomId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('roomId') || '').trim();
  }, []);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [room, setRoom] = useState(null);
  const [sessionUserId, setSessionUserId] = useState(null);
  const socketRef = useRef(null);
  const noticeTimersRef = useRef([]);
  const [mobileDevice, setMobileDevice] = useState(isMobileDevice);
  const [portraitViewport, setPortraitViewport] = useState(() => window.innerHeight > window.innerWidth);
  const [forceLandscape, setForceLandscape] = useState(isMobileDevice);
  const [viewportSize, setViewportSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const [tableNotices, setTableNotices] = useState([]);
  const [shareInProgress, setShareInProgress] = useState(false);

  // 游戏状态
  const [gameState, setGameState] = useState({
    pot: 0,
    pots: [],
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
    hostUid: null,
    winners: [],
    showdown: false
  });

  const [showGameOver, setShowGameOver] = useState(false);
  const [gameOverStats, setGameOverStats] = useState([]);
  const [hasConfirmedResult, setHasConfirmedResult] = useState(false);

  const pushTableNotice = (message, tone = 'warning') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setTableNotices(prev => [...prev, { id, message, tone }].slice(-4));
    const timerId = window.setTimeout(() => {
      setTableNotices(prev => prev.filter(item => item.id !== id));
      noticeTimersRef.current = noticeTimersRef.current.filter(t => t !== timerId);
    }, 2600);
    noticeTimersRef.current.push(timerId);
  };

  useEffect(() => {
    const handleViewportChange = () => {
      setMobileDevice(isMobileDevice());
      const visualViewport = window.visualViewport;
      const viewportWidth = Math.round(visualViewport?.width || window.innerWidth);
      const viewportHeight = Math.round(visualViewport?.height || window.innerHeight);
      setPortraitViewport(viewportHeight > viewportWidth);
      setViewportSize({ width: viewportWidth, height: viewportHeight });
    };
    handleViewportChange();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);
    window.visualViewport?.addEventListener('resize', handleViewportChange);
    window.visualViewport?.addEventListener('scroll', handleViewportChange);
    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  const handleLogin = ({ nickname, roomId, maxHands, maxPlayers, uid }) => {
    // Generate or use existing uid
    const userId = uid || Math.random().toString(36).substr(2, 9);
    setSessionUserId(userId);
    
    // Save session
    localStorage.setItem('poker_session', JSON.stringify({
        nickname,
        roomId,
        uid: userId,
        maxHands,
        maxPlayers
    }));

    setRoom({ roomId });

    // Connect to Socket.io server
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
        uid: userId 
      });
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      pushTableNotice('连接失败，请检查网络或稍后重试', 'error');
    });

    socket.on('player_joined', (payload) => {
      const player = payload?.player;
      if (!player) return;
      const isMe = player.uid === userId || player.sid === socket.id;
      if (isMe) {
        pushTableNotice(`你已入座：${player.name || '玩家'}`, 'success');
        return;
      }
      pushTableNotice(`${player.name || '有玩家'} 入座`, 'success');
    });

    socket.on('player_left', (payload) => {
      const player = payload?.player;
      if (!player) return;
      const isMe = player.uid === userId || player.sid === socket.id;
      if (isMe) {
        pushTableNotice('你已离桌', 'warning');
        return;
      }
      pushTableNotice(`${player.name || '有玩家'} 离桌`, 'warning');
    });

    socket.on('game_update', (data) => {
      console.log('Game update:', data);
      if (!data) return;
      
      const mySocketId = socketRef.current?.id;
      const myIndex = data.players.findIndex(p => p.uid === userId || p.socketId === mySocketId);

      // Calculate roles
      const totalPlayers = data.players.length;
      const dealerIdx = data.dealerIndex;
      let sbIdx, bbIdx;
      
      if (totalPlayers === 2) {
          // Heads Up: Dealer is SB, Other is BB
          sbIdx = dealerIdx;
          bbIdx = (dealerIdx + 1) % totalPlayers;
      } else {
          sbIdx = (dealerIdx + 1) % totalPlayers;
          bbIdx = (dealerIdx + 2) % totalPlayers;
      }

      const mappedPlayers = data.players.map((p, index) => {
        return {
          id: p.socketId,
          uid: p.uid,
          name: p.name,
          stack: p.chips,
          isDealer: index === dealerIdx,
          isSB: index === sbIdx,
          isBB: index === bbIdx,
          cards: p.hand ? p.hand.map(c => {
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
          isReady: data.state === 'WAITING' && p.isReady, 
          isMe: (p.uid === userId || p.socketId === mySocketId),
          originalIndex: index 
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
        pots: data.pots || [], 
        communityCards: mappedCommunityCards,
        players: reorderedPlayers, 
        maxHands: data.maxHands,
        handsPlayed: data.handsPlayed,
        state: data.state,
        dealerIndex: data.dealerIndex, 
        currentBet: data.currentBet,
        minRaise: data.minRaise || 20,
        minTotalRaiseTo: data.minTotalRaiseTo || ((data.currentBet || 0) + (data.minRaise || 20)),
        bigBlind: data.bigBlind || 20,
        hostUid: data.hostUid || null,
        winners: data.winners || [],
        showdown: !!data.showdown
      });

      if (data.winners && data.winners.length > 0) {
          playWinSound();
      } else {
          setHasConfirmedResult(false);
      }
      
      if (data.state === 'GAME_OVER') {
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
      const code = err?.code || '';
      const isActionError = err?.type === 'ACTION_ERROR' || code.startsWith('ACTION_');

      if (isActionError) {
        // 结构化错误，便于统一埋点统计
        console.warn('[ACTION_ERROR]', {
          code: err?.code,
          message: err?.message,
          detail: err?.detail || {}
        });
        pushTableNotice(err?.message || '操作失败', 'warning');
        return;
      }

      pushTableNotice(err?.message || '连接异常', 'error');
      setIsLoggedIn(false);
    });
  };

  const buildRoomShareUrl = (roomId) => {
    if (!roomId) return '';
    const url = new URL(window.location.href);
    url.searchParams.set('roomId', roomId);
    return url.toString();
  };

  const handleShareRoom = async () => {
    const roomId = room?.roomId;
    if (!roomId || shareInProgress) return;

    const shareUrl = buildRoomShareUrl(roomId);
    if (!shareUrl) {
      pushTableNotice('分享链接生成失败，请稍后重试', 'error');
      return;
    }

    setShareInProgress(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `PokerSCI 房间 ${roomId}`,
          text: `加入我的德州扑克房间：${roomId}`,
          url: shareUrl
        });
        pushTableNotice('分享面板已打开，可直接分享到微信', 'success');
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        pushTableNotice(`已复制分享链接：房间 ${roomId}`, 'success');
        return;
      }

      pushTableNotice(`请手动复制链接：${shareUrl}`, 'warning');
    } catch (error) {
      if (error?.name !== 'AbortError') {
        pushTableNotice('分享失败，请稍后重试', 'error');
      }
    } finally {
      setShareInProgress(false);
    }
  };

  useEffect(() => {
    let loginTimeout;
    const session = localStorage.getItem('poker_session');
    if (session) {
        try {
            const { nickname, roomId, uid, maxHands, maxPlayers } = JSON.parse(session);
            const shouldRestore = !sharedRoomId || sharedRoomId === roomId;
            if (nickname && roomId && uid && shouldRestore) {
                console.log('Restoring session:', { nickname, roomId, uid });
                loginTimeout = setTimeout(() => {
                    handleLogin({ nickname, roomId, maxHands, maxPlayers, uid });
                }, 0);
            }
        } catch (e) {
            console.error('Failed to parse session:', e);
            localStorage.removeItem('poker_session');
        }
    }

    return () => {
      if (loginTimeout) {
        clearTimeout(loginTimeout);
      }
      noticeTimersRef.current.forEach(clearTimeout);
      noticeTimersRef.current = [];
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [sharedRoomId]);

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

  const handleReady = (ready = true) => {
    setHasConfirmedResult(true);

    if (socketRef.current) {
        socketRef.current.emit('player_ready', {
            tableId: room.roomId,
            ready
        });
    }
  };

  const handleRestart = () => {
      if (socketRef.current) {
          socketRef.current.emit('restart_game', {
              tableId: room.roomId
          });
          setShowGameOver(false);
      }
  };

  const handleStartFirstHand = () => {
    if (socketRef.current) {
      socketRef.current.emit('start_first_hand', {
        tableId: room.roomId
      });
    }
  };

  const myPlayer = gameState.players.find(p => p.isMe);
  const isMyTurn = myPlayer?.isActive || false;
  const showHandResult = gameState.winners && gameState.winners.length > 0 && !hasConfirmedResult;
  const isInitialWaiting = gameState.state === 'WAITING' && (gameState.handsPlayed || 0) === 0;
  const isHost = Boolean(sessionUserId && gameState.hostUid && sessionUserId === gameState.hostUid);
  const readyCandidates = gameState.players.filter((p) => p.stack > 0);
  const readyCount = readyCandidates.filter((p) => p.isReady).length;
  const allPlayersReadyInWaiting = readyCandidates.length >= 2 && readyCount === readyCandidates.length;
  const myReady = myPlayer?.isReady;
  const currentRound = gameState.maxHands
    ? `${Math.min((gameState.handsPlayed || 0) + 1, gameState.maxHands)}/${gameState.maxHands}`
    : (gameState.handsPlayed || 0) + 1;
  const handleExitGame = () => {
    if (confirm('确定要退出游戏吗？')) {
      localStorage.removeItem('poker_session');
      window.location.reload();
    }
  };
  const rotateToLandscape = mobileDevice && portraitViewport && forceLandscape;

  return (
    <div
      className="mobile-orientation-root"
      style={{ '--mobile-vw': `${viewportSize.width}px`, '--mobile-vh': `${viewportSize.height}px` }}
    >
      <div className={rotateToLandscape ? 'mobile-landscape-frame' : 'mobile-normal-frame'}>
        {!isLoggedIn ? (
          <Login
            onLogin={handleLogin}
            forceLandscapeView={rotateToLandscape}
            presetRoomId={sharedRoomId}
          />
        ) : (
          <div className="app-shell w-full h-full grid grid-cols-[280px_1fr] grid-rows-[minmax(0,1fr)_auto] overflow-hidden bg-transparent text-white font-['m6x11plus'] relative">
            <BackgroundShader />
            <CardAnimator
              communityCards={gameState.communityCards}
              myHand={myPlayer?.cards || []}
              players={gameState.players}
            />
            <div className="app-sidebar row-span-2 border-r border-white/10 bg-black/30 backdrop-blur-sm z-10 overflow-hidden">
              <InfoPanel
                players={gameState.players}
              />
            </div>
            <div className="app-table-region relative flex flex-col items-center justify-center px-4 pt-14 pb-4 min-h-0 overflow-hidden">
              <div className="absolute top-3 left-4 right-4 z-20">
                <div className="flex items-center justify-center gap-3 rounded-lg border border-white/10 bg-black/40 px-3 py-2 backdrop-blur-sm">
                  <div className="px-3 py-1 rounded bg-black/30 border border-white/10">
                    <span className="text-slate-400 text-xs">盲注</span>
                    <span className="ml-2 text-[#ef4444] text-base font-bold">{gameState.bigBlind / 2} / {gameState.bigBlind}</span>
                  </div>
                  <div className="px-3 py-1 rounded bg-black/30 border border-white/10">
                    <span className="text-slate-400 text-xs">回合</span>
                    <span className="ml-2 text-[#3b82f6] text-base font-bold">{currentRound}</span>
                  </div>
                  <div className="px-3 py-1 rounded bg-black/30 border border-white/10">
                    <span className="text-slate-400 text-xs">底池</span>
                    <span className="ml-2 text-[#f59e0b] text-base font-bold">${gameState.pot || 0}</span>
                  </div>
                </div>
              </div>
              <PokerTable
                communityCards={gameState.communityCards}
                pot={gameState.pot}
              />
              {gameState.state === 'WAITING' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-4 p-8 bg-black/80 rounded-xl border border-white/20 shadow-2xl">
                    <h2 className="text-2xl text-[#f59e0b] animate-pulse">
                      {isInitialWaiting ? '首局准备中' : '等待下一手开始'}
                    </h2>
                    {gameState.players.length >= 2 ? (
                      <>
                        <button
                          onClick={() => handleReady(!myReady)}
                          className="px-8 py-3 rounded-lg font-bold text-xl bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-lg transition-transform active:scale-95 border-b-4 border-[#15803d]"
                        >
                          {myReady ? '取消准备' : '我准备好了'}
                        </button>
                        <p className="text-slate-300 text-sm">
                          已准备 {readyCount}/{readyCandidates.length}
                        </p>
                        {isInitialWaiting ? (
                          <>
                            {isHost ? (
                              <button
                                onClick={handleStartFirstHand}
                                disabled={!allPlayersReadyInWaiting}
                                className="px-8 py-3 rounded-lg font-bold text-xl bg-[#f59e0b] hover:bg-[#d97706] disabled:bg-slate-600 disabled:cursor-not-allowed text-black shadow-lg transition-transform active:scale-95 border-b-4 border-[#b45309]"
                              >
                                房主开始首局
                              </button>
                            ) : (
                              <p className="text-slate-300">
                                {allPlayersReadyInWaiting ? '已全部准备，等待房主开始首局' : '请先准备，等待房主开始首局'}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-slate-300">
                            {allPlayersReadyInWaiting ? '全部已准备，下一手即将开始' : '每位玩家准备后将自动开始下一手'}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-slate-400">至少需要2名玩家开始游戏</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="app-action-row h-auto z-20">
              <ActionPanel
                onAction={handleAction}
                amountToCall={Math.max(0, gameState.currentBet - (myPlayer?.bet || 0))}
                minBet={gameState.minRaise}
                maxBet={myPlayer?.stack || 0}
                bigBlind={gameState.bigBlind}
                disabled={!isMyTurn}
                myCards={myPlayer?.cards || []}
              />
            </div>
            <button
              onClick={handleExitGame}
              aria-label="退出游戏"
              title="退出游戏"
              className="fixed top-4 right-4 z-50 h-10 w-10 flex items-center justify-center bg-slate-700/90 hover:bg-slate-600 text-white rounded-lg border-2 border-white/20 shadow-lg active:translate-y-1 transition-all"
            >
              <LogOut size={18} />
            </button>
            <button
              onClick={handleShareRoom}
              aria-label="分享房间"
              title={shareInProgress ? '正在分享...' : '分享房间'}
              disabled={shareInProgress}
              className="fixed top-4 right-16 z-50 h-10 px-3 flex items-center justify-center gap-1 bg-emerald-600/90 hover:bg-emerald-500 disabled:bg-emerald-900/70 disabled:cursor-not-allowed text-white rounded-lg border-2 border-white/20 shadow-lg active:translate-y-1 transition-all"
            >
              <Share2 size={16} />
              <span className="text-xs">分享</span>
            </button>
            <ToastContainer toasts={tableNotices} />
            {showHandResult && (
              <HandResultModal
                winners={gameState.winners}
                communityCards={gameState.communityCards}
                onContinue={() => handleReady(true)}
                players={gameState.players}
                myPlayer={myPlayer}
                showdown={gameState.showdown}
              />
            )}
            {showGameOver && (
              <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
                <div className="bg-[#1e293b] rounded-2xl p-8 max-w-lg w-full border border-white/10 shadow-2xl">
                  <h2 className="text-4xl font-bold text-center text-[#f59e0b] mb-6 font-['m6x11plus']">游戏结束</h2>
                  <div className="space-y-4 mb-8">
                    {gameOverStats.map((p, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-black/40 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                          <span className={`text-2xl font-bold ${i === 0 ? 'text-[#f59e0b]' : 'text-slate-400'}`}>#{i + 1}</span>
                          <span className="text-xl">{p.name}</span>
                        </div>
                        <span className="text-[#f59e0b] font-bold text-xl">${p.stack}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => window.location.reload()} className="flex-1 py-3 bg-slate-700 rounded-lg font-bold hover:bg-slate-600">退出</button>
                    <button onClick={handleRestart} className="flex-1 py-3 bg-[#f59e0b] text-black rounded-lg font-bold hover:bg-[#d97706]">再来一局</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {mobileDevice && (
        <button
          onClick={() => setForceLandscape(prev => !prev)}
          className="mobile-orientation-toggle"
        >
          {forceLandscape ? '切换竖屏' : '切换横屏'}
        </button>
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
