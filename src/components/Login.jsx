import React, { useState } from 'react';
import { User, Hash, ArrowRight } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState('');
  const [maxHands, setMaxHands] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nickname && roomId) {
      onLogin({ 
        nickname, 
        roomId, 
        maxHands: maxHands ? parseInt(maxHands) : null,
        maxPlayers: maxPlayers ? parseInt(maxPlayers) : 9
      });
    }
  };

  const generateRoomId = () => {
    const randomId = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomId(randomId);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-6 text-white">
      <div className="w-full max-w-md bg-slate-800/50 p-8 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">PokerSCI</h1>
          <p className="text-slate-400 text-sm">德州扑克竞技场</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">昵称</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="输入你的昵称"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">房间号</label>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="输入房间号"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all"
                  required
                />
              </div>
              <button
                type="button"
                onClick={generateRoomId}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-xl transition-colors whitespace-nowrap"
              >
                随机生成
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">总手数（选填，默认人数x2）</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="number"
                value={maxHands}
                onChange={(e) => setMaxHands(e.target.value)}
                placeholder="例如：20"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">房间人数（选填，默认9人）</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="number"
                min="2"
                max="9"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                placeholder="例如：6"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-slate-900 font-bold py-4 rounded-xl shadow-lg transform transition-all active:scale-95 flex items-center justify-center gap-2 group"
          >
            进入房间
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
