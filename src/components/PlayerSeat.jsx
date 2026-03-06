import React from 'react';
import Card from './Card';
import { Bot } from 'lucide-react';
import { clsx } from 'clsx';

const PlayerSeat = ({ 
  player, 
  positionStyle, 
  side = 'bottom', // 默认为底部
  isHero = false,
  isActive = false,
  isDealer = false
}) => {
  const { name, stack, cards, bet, status, position, actionLabel, isReady } = player;

  // 辅助函数：确定下注筹码的位置
  // 根据 side 动态调整
  const getBetPosition = () => {
    // 基础偏移
    const offset = 60; 

    // 根据 side 决定方向
    // Left: 筹码在右侧 (Top/Right or Bottom/Right) -> 实际上通常在 "Inner" 侧
    // Right: 筹码在左侧
    // Top: 筹码在下方
    // Bottom: 筹码在上方
    
    let x = 0;
    let y = 0;

    switch (side) {
      case 'left':
        x = offset + 20; // 向右
        break;
      case 'right':
        x = -offset - 20; // 向左
        break;
      case 'top':
        y = offset + 20; // 向下
        break;
      case 'bottom':
        y = -offset - 20; // 向上
        break;
      default:
        y = -offset;
    }

    return { transform: `translate(${x}%, ${y}%)`, zIndex: 30 };
  };

  // 布局方向类名
  const getLayoutClass = () => {
    switch (side) {
      case 'left':
        return 'flex-row'; // Info Left, Cards Right (Towards Center)
      case 'right':
        return 'flex-row-reverse'; // Cards Left (Towards Center), Info Right
      case 'top':
        return 'flex-col'; // Info Top, Cards Bottom
      case 'bottom':
        return 'flex-col-reverse'; // Cards Top, Info Bottom (Hero Style)
      default:
        return 'flex-col';
    }
  };

  // Info 区域对齐方式
  const getInfoAlignClass = () => {
      // 侧边布局时，Info 应该靠向 Cards 还是远离？
      // 通常居中对齐即可
      return 'items-center';
  };

  // Timer logic
  const [elapsedTime, setElapsedTime] = React.useState(0);
  
  React.useEffect(() => {
    let interval;
    if (isActive) {
      setElapsedTime(0);
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className={clsx(
      "relative flex items-center justify-center gap-2", // 增加 gap
      getLayoutClass(),
      // 侧边布局时宽度增加，垂直布局时宽度窄
      (side === 'left' || side === 'right') ? "w-[140px]" : "w-[84px]"
    )}>
      
      {/* 计时器 (增长计时) */}
      {isActive && (
        <div className="absolute -top-4 z-40 bg-yellow-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
          {elapsedTime}s
        </div>
      )}

      {/* 玩家状态标签 (如: 加注 29) */}
      {actionLabel && (
        <div className="absolute -top-8 z-40 bg-white/90 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg border border-slate-200 whitespace-nowrap">
          {actionLabel}
        </div>
      )}

      {/* 准备状态标识 (仅在 WAITING 状态或显示准备时) */}
      {isReady && (
        <div className="absolute -top-8 z-40 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-green-400 whitespace-nowrap animate-bounce">
          已准备
        </div>
      )}

      {/* Dealer 按钮 - 根据 side 调整位置 */}
      {isDealer && (
        <div className={clsx(
          "absolute z-30 w-5 h-5 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center shadow-md",
          side === 'bottom' ? "-top-2 -right-2" :
          side === 'top' ? "-bottom-2 -left-2" :
          side === 'left' ? "-top-2 -right-2" : "-top-2 -left-2"
        )}>
          <span className="text-[10px] font-bold text-slate-900">D</span>
        </div>
      )}

      {/* 区域1：头像和信息 (Column 1) */}
      <div className={clsx(
        "relative flex flex-col p-1 rounded-lg transition-all duration-300 select-none shrink-0",
        getInfoAlignClass(),
        isActive ? "ring-2 ring-yellow-400 bg-black/40" : "bg-black/20 border border-white/5",
        (status === 'fold' || status === 'offline') && "opacity-50 grayscale",
        // 侧边布局时，Info 区域宽度可以稍微小一点
        (side === 'left' || side === 'right') ? "w-[60px]" : "w-full"
      )}>
        
        {/* Offline Status */}
        {status === 'offline' && (
             <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
                 <div className="text-[10px] font-bold text-red-400 bg-black/80 px-1 rounded">Offline</div>
             </div>
        )}

        {/* 位置标签 */}
        <div className="absolute -top-2 -left-2 bg-indigo-600 text-white text-[8px] font-bold px-1 rounded shadow-sm z-20 uppercase border border-white/10">
          {position}
        </div>

        {/* 头像 */}
        <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center overflow-hidden shadow-sm mb-0.5">
            {isHero ? (
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Hero" className="w-full h-full" />
            ) : (
               <Bot size={20} className="text-slate-500" />
            )}
        </div>

        {/* 名字 & 筹码 */}
        <div className="text-center w-full px-0.5">
          <div className="text-[10px] text-slate-200 font-medium truncate w-full leading-tight">{name}</div>
          <div className="text-[10px] font-bold text-yellow-400 leading-tight">{stack}</div>
        </div>
      </div>

      {/* 区域2：手牌 (Column 2) */}
      <div className={clsx(
        "flex items-center justify-center gap-0.5 shrink-0",
        // 侧边布局时，Cards 也是一列（其实是 Row，但是作为 Column 2 存在）
        (side === 'left' || side === 'right') ? "w-[50px]" : "w-full h-10"
      )}>
          {cards && cards.length > 0 ? (
            <>
              <div className="w-8 h-11 transition-transform hover:-translate-y-1 shadow-md">
                 <Card 
                   rank={cards[0].rank} 
                   suit={cards[0].suit} 
                   hidden={!isHero && !cards[0].revealed}
                   className="w-full h-full text-xs" 
                 />
              </div>
              <div className="w-8 h-11 transition-transform hover:-translate-y-1 shadow-md -ml-2"> {/* 重叠一点更紧凑 */}
                 <Card 
                   rank={cards[1].rank} 
                   suit={cards[1].suit} 
                   hidden={!isHero && !cards[1].revealed}
                   className="w-full h-full text-xs"
                 />
              </div>
            </>
          ) : (
            // No cards (Waiting state or folded without cards showing)
            // User requested: "Show two empty dashed boxes" when no cards
            <>
                <div className="w-8 h-11 border border-dashed border-white/20 rounded bg-white/5"></div>
                <div className="w-8 h-11 border border-dashed border-white/20 rounded bg-white/5 -ml-2"></div>
            </>
          )}
      </div>

      {/* 下注筹码 (绝对定位) */}
      {bet > 0 && (
        <div 
          className="absolute flex items-center justify-center pointer-events-none transition-all duration-500 z-50"
          style={getBetPosition()}
        >
          <div className="bg-black/60 backdrop-blur-sm border border-yellow-500/30 text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-red-300"></div>
            {bet}
          </div>
        </div>
      )}

    </div>
  );
};

export default PlayerSeat;
