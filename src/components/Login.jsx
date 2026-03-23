import React, { useEffect, useMemo, useState } from 'react';
import { User, Hash, ArrowRight } from 'lucide-react';

const Login = ({ onLogin, forceLandscapeView = false, presetRoomId = '' }) => {
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState('');
  const [maxHands, setMaxHands] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');
  const [roomIdFromLink, setRoomIdFromLink] = useState(false);
  const [isWeChatBrowser, setIsWeChatBrowser] = useState(false);
  const baseUrl = import.meta.env.BASE_URL || '/';
  const cardBacksUrl = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}assets/img/card_backs.png`;
  const lockRoomConfig = roomIdFromLink;

  const resolvedPresetRoomId = useMemo(() => {
    if (presetRoomId) {
      return String(presetRoomId).trim();
    }
    const params = new URLSearchParams(window.location.search);
    return (params.get('roomId') || '').trim();
  }, [presetRoomId]);

  useEffect(() => {
    if (resolvedPresetRoomId) {
      setRoomId(resolvedPresetRoomId);
      setRoomIdFromLink(true);
    }
  }, [resolvedPresetRoomId]);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    setIsWeChatBrowser(/MicroMessenger/i.test(ua));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nickname && roomId) {
      const parsedMaxPlayers = maxPlayers ? parseInt(maxPlayers, 10) : 9;
      const normalizedRoomId = roomId.trim();
      const roomConfig = lockRoomConfig
        ? { maxHands: null, maxPlayers: null }
        : {
            maxHands: maxHands ? parseInt(maxHands, 10) : null,
            maxPlayers: Number.isNaN(parsedMaxPlayers) ? 9 : Math.min(9, Math.max(2, parsedMaxPlayers))
          };
      onLogin({ 
        nickname, 
        roomId: normalizedRoomId,
        ...roomConfig
      });
    }
  };

  const generateRoomId = () => {
    const randomId = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomId(randomId);
  };

  const handleOpenInBrowser = async () => {
    const currentUrl = window.location.href;
    const newWindow = window.open(currentUrl, '_blank', 'noopener,noreferrer');
    if (newWindow) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentUrl);
        alert('已复制当前链接，请在系统浏览器粘贴并打开。');
      } else {
        alert(`请复制并在系统浏览器打开：${currentUrl}`);
      }
    } catch {
      alert(`请复制并在系统浏览器打开：${currentUrl}`);
    }
  };

  return (
    <div className={`relative flex overflow-hidden bg-slate-900 text-white ${forceLandscapeView ? 'h-full w-full items-stretch justify-center px-3 py-2' : 'min-h-screen items-center justify-center px-4 py-6 sm:px-6'}`}>
      <div
        className="absolute inset-0 bg-repeat opacity-5 animate-pulse"
        style={{ backgroundSize: '100px', backgroundImage: `url('${cardBacksUrl}')` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-slate-900/35 to-black/60"></div>
      
      <div className={`z-10 grid w-full overflow-hidden border border-white/10 bg-slate-800/80 shadow-2xl backdrop-blur-md ${forceLandscapeView ? 'h-full max-w-none rounded-xl grid-cols-[minmax(240px,0.9fr)_minmax(0,1.1fr)]' : 'max-w-5xl rounded-2xl grid-cols-1 md:grid-cols-2'}`}>
        
        <div className={`flex flex-col items-center justify-center border-white/10 ${forceLandscapeView ? 'border-r px-5 py-4' : 'border-b px-6 py-8 md:border-b-0 md:border-r md:px-8'}`}>
            <div className={`relative transition-transform duration-300 hover:scale-105 ${forceLandscapeView ? 'mb-3 h-24 w-20' : 'mb-5 h-36 w-28 sm:h-44 sm:w-32'}`}>
                 <div className="absolute inset-0 flex origin-bottom-left items-center justify-center rounded-lg border-2 border-black/20 bg-white rotate-[-15deg] text-3xl font-bold text-red-500 shadow-lg transition-transform hover:rotate-[-18deg] sm:text-4xl font-['m6x11plus']">
                    A♥
                 </div>
                 <div className="absolute inset-0 z-10 flex translate-x-3 origin-bottom-right items-center justify-center rounded-lg border-2 border-black/20 bg-white rotate-[15deg] text-3xl font-bold text-black shadow-lg transition-transform hover:rotate-[18deg] sm:translate-x-4 sm:text-4xl font-['m6x11plus']">
                    K♠
                 </div>
            </div>
            <h1 className={`bg-gradient-to-b from-yellow-300 to-yellow-600 bg-clip-text font-bold tracking-wider text-transparent drop-shadow-[0_2px_0_rgba(0,0,0,1)] font-['m6x11plus'] ${forceLandscapeView ? 'mb-1 text-4xl' : 'mb-2 text-5xl sm:text-6xl'}`}>
              PokerSCI
            </h1>
            <p className={`text-center uppercase tracking-[0.2em] text-slate-300 font-['m6x11plus'] ${forceLandscapeView ? 'mt-1 text-sm' : 'mt-2 text-base sm:text-xl'}`}>
              德州扑克竞技场
            </p>
            <div className={`rounded-lg border border-white/10 bg-black/25 px-4 text-center text-slate-300 font-['m6x11plus'] ${forceLandscapeView ? 'mt-3 py-1.5 text-xs leading-5' : 'mt-5 py-2 text-sm sm:text-base'}`}>
              快速开局 · 自动匹配房间参数 · 支持多人对战
            </div>
        </div>

        <div className={`flex flex-col justify-center ${forceLandscapeView ? 'overflow-y-auto px-4 py-3' : 'px-5 py-7 sm:px-8 sm:py-8'}`}>
            <form onSubmit={handleSubmit} className={forceLandscapeView ? 'space-y-3' : 'space-y-5 sm:space-y-6'}>
            <div className="space-y-2">
                <label className="text-sm font-bold text-[#f59e0b] uppercase tracking-wider ml-1 font-['m6x11plus']">昵称</label>
                <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="输入你的昵称"
                    className="h-12 w-full rounded-lg border-2 border-slate-600 bg-black/40 py-3 pl-10 pr-4 text-base text-white placeholder-slate-500 transition-all focus:outline-none focus:border-[#f59e0b] sm:text-lg font-['m6x11plus']"
                    required
                />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-[#f59e0b] uppercase tracking-wider ml-1 font-['m6x11plus']">房间号</label>
                <div className="relative flex gap-2">
                <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder={roomIdFromLink ? '来自分享链接' : '输入房间号'}
                    className="h-12 w-full rounded-lg border-2 border-slate-600 bg-black/40 py-3 pl-10 pr-4 text-base text-white placeholder-slate-500 transition-all focus:outline-none focus:border-[#f59e0b] sm:text-lg font-['m6x11plus']"
                    required
                    readOnly={roomIdFromLink}
                    />
                </div>
                <button
                    type="button"
                    onClick={generateRoomId}
                    disabled={roomIdFromLink}
                    className="h-12 rounded-lg border-2 border-slate-500 bg-slate-700 px-4 py-2 font-bold text-white transition-all hover:border-slate-400 hover:bg-slate-600 active:translate-y-1 font-['m6x11plus']"
                >
                    随机
                </button>
                </div>
            </div>

            <div className={`grid ${forceLandscapeView ? 'grid-cols-2 gap-3' : 'grid-cols-1 gap-4 sm:grid-cols-2'} ${lockRoomConfig ? 'opacity-60' : ''}`}>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1 font-['m6x11plus']">总手数</label>
                    <input
                        type="number"
                        min="1"
                        value={maxHands}
                        onChange={(e) => setMaxHands(e.target.value)}
                        placeholder={lockRoomConfig ? '分享链接已锁定' : '默认'}
                        className="h-12 w-full rounded-lg border-2 border-slate-600 bg-black/40 px-4 py-3 text-base text-white placeholder-slate-500 transition-all focus:outline-none focus:border-[#f59e0b] sm:text-lg font-['m6x11plus']"
                        disabled={lockRoomConfig}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1 font-['m6x11plus']">人数</label>
                    <input
                        type="number"
                        min="2"
                        max="9"
                        value={maxPlayers}
                        onChange={(e) => setMaxPlayers(e.target.value)}
                        placeholder={lockRoomConfig ? '分享链接已锁定' : '9'}
                        className="h-12 w-full rounded-lg border-2 border-slate-600 bg-black/40 px-4 py-3 text-base text-white placeholder-slate-500 transition-all focus:outline-none focus:border-[#f59e0b] sm:text-lg font-['m6x11plus']"
                        disabled={lockRoomConfig}
                    />
                </div>
            </div>

            <button
                type="submit"
                className={`flex w-full items-center justify-center gap-2 rounded-xl border-b-4 border-[#b91c1c] bg-[#ef4444] font-bold text-white shadow-lg transition-all hover:bg-[#dc2626] active:translate-y-1 active:border-b-0 group font-['m6x11plus'] ${forceLandscapeView ? 'mt-1 h-12 py-2 text-lg' : 'mt-2 h-14 py-4 text-xl sm:mt-4 sm:text-2xl'}`}
            >
                <span>进入游戏</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            {isWeChatBrowser && (
              <button
                type="button"
                onClick={handleOpenInBrowser}
                className="w-full rounded-xl border-2 border-sky-500/70 bg-sky-600/20 py-3 text-base font-bold text-sky-200 transition-all hover:bg-sky-500/30 active:translate-y-0.5 font-['m6x11plus']"
              >
                去浏览器打开
              </button>
            )}
            </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
