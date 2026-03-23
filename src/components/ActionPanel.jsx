import React, { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronUp, ChevronDown } from 'lucide-react';
import Card from './Card';

const ActionPanel = ({ 
  onAction, 
  amountToCall = 0,
  minBet = 20, 
  maxBet = 2000, 
  bigBlind = 20,
  disabled = false,
  myCards = []
}) => {
  const [showRaiseSlider, setShowRaiseSlider] = useState(false);
  const [betAmount, setBetAmount] = useState(minBet);
  // const backStyle = getCardBackStyle('RED');
  
  // 安全范围校验
  const safeMinBet = Math.min(minBet, maxBet);
  
  React.useEffect(() => {
      if (!disabled) {
          setBetAmount(safeMinBet);
      }
  }, [disabled, safeMinBet]);

  const handleBetChange = (amount) => {
    if (disabled) return;
    const newAmount = Math.max(safeMinBet, Math.min(maxBet, amount));
    setBetAmount(newAmount);
  };

  const handleActionClick = (type, val) => {
    if (disabled) return;
    if (type === 'raise_click') {
        setShowRaiseSlider(!showRaiseSlider);
        return;
    }
    if (onAction) onAction(type, val);
    setShowRaiseSlider(false);
  };

  // 点击外部关闭滑块
  React.useEffect(() => {
      const handleClickOutside = (e) => {
          if (showRaiseSlider && !e.target.closest('.raise-control-group')) {
              setShowRaiseSlider(false);
          }
      };
      if (showRaiseSlider) {
          document.addEventListener('click', handleClickOutside);
      }
      return () => {
          document.removeEventListener('click', handleClickOutside);
      };
  }, [showRaiseSlider]);

  return (
    <div className="action-panel w-full h-full flex flex-col justify-end items-center p-4 relative">
      <div className="action-top-row relative w-full flex items-end justify-center mb-6 z-10">
          <div className="hand-cards-row group flex justify-center items-end h-[120px] gap-2">
              {myCards.map((card, idx) => (
                 <div 
                    key={idx}
                    id={`my-card-${idx}`}
                    className={clsx(
                        "w-[71px] h-[95px] relative perspective-1000 cursor-pointer transition-all duration-300 group-hover:-translate-y-6",
                        card.selected ? "-translate-y-6" : ""
                    )}
                 >
                    <div className="w-full h-full relative preserve-3d transition-transform duration-500 group-hover:[transform:rotateY(180deg)]">
                        <div className="absolute inset-0 backface-hidden">
                            <Card hidden={true} className="w-full h-full shadow-lg" />
                        </div>
                        <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)]">
                            <Card rank={card.rank} suit={card.suit} className="w-full h-full shadow-lg" />
                        </div>
                    </div>
                 </div>
              ))}
              {myCards.length === 0 && (
                  <div className="text-white/30 font-['m6x11plus'] text-xl">等待发牌...</div>
              )}
          </div>
      </div>

      {/* 操作按钮组 (Actions) */}
      <div className="action-buttons-row flex gap-4 mb-4 z-20">
          {/* FOLD */}
          <button 
            onClick={() => handleActionClick('fold')}
            disabled={disabled}
            className={clsx(
                "px-8 py-3 rounded-lg border-b-4 text-white font-['m6x11plus'] text-2xl uppercase transition-all active:translate-y-1 active:border-b-0 active:mt-1",
                disabled 
                    ? "bg-slate-600 border-slate-800 cursor-not-allowed opacity-50" 
                    : "bg-[#e53e3e] border-[#c53030] hover:brightness-110 shadow-lg"
            )}
          >
            弃牌
          </button>

          {/* CHECK / CALL */}
          <button 
            onClick={() => handleActionClick(amountToCall > 0 ? 'call' : 'check')}
            disabled={disabled}
            className={clsx(
                "px-8 py-3 rounded-lg border-b-4 text-white font-['m6x11plus'] text-2xl uppercase transition-all active:translate-y-1 active:border-b-0 active:mt-1 min-w-[140px]",
                disabled 
                    ? "bg-slate-600 border-slate-800 cursor-not-allowed opacity-50" 
                    : "bg-[#3182ce] border-[#2b6cb0] hover:brightness-110 shadow-lg"
            )}
          >
            {amountToCall > 0 ? `跟注 ${amountToCall}` : '过牌'}
          </button>

          {/* RAISE */}
          <div className="relative raise-control-group">
              <button 
                onClick={(e) => {
                    // 如果已经是加注模式，直接加注；否则如果是移动端或为了更好的交互，先打开面板
                    // 这里简化逻辑：点击按钮如果面板未开，则打开面板；如果面板已开，则执行加注
                    // 或者更直接：长按/Hover显示面板，点击按钮直接提交。
                    // 鉴于移动端没有Hover，采用点击切换显示面板，再次点击提交的逻辑，或者区分“打开面板”和“提交”
                    // 现在的设计是：按钮是 "加注 X"，意味着点击就是提交 X。
                    // 为了兼容移动端调整数值，我们需要一个显式的触发器或改变交互。
                    // 方案：点击按钮 = 提交加注。
                    // 为了调整数值，我们需要一个额外的入口，或者让滑块常驻/点击弹出。
                    // 既然是 "加注 20"，用户预期点击即加注。
                    // 移动端：长按？或者旁边加个小箭头？
                    // 让我们把 hover 逻辑改成：点击主按钮提交，长按或点击旁边的小箭头打开面板？
                    // 为了简单兼容：
                    // 1. 桌面端：Hover 显示面板
                    // 2. 移动端：点击按钮旁边的小区域打开面板？或者点击按钮弹出面板，面板上有“确认”？
                    // 采用方案：点击主按钮 -> 提交。
                    // 添加一个独立的“调整”按钮/区域，或者让面板在移动端通过点击触发显示。
                    // 鉴于现有 UI，我们在按钮上方/旁边加一个 toggle。
                    // 也可以：点击按钮 -> 提交。
                    // 滑块面板：默认隐藏。桌面端 Hover 显示。移动端... 无法 Hover。
                    // 修复：添加一个显式的 "设置金额" 按钮，或者让按钮点击行为变成“如果面板未开且是移动端 -> 打开面板”？
                    // 最稳妥方案：点击按钮提交。面板通过额外的小按钮触发，或者桌面端维持 Hover，移动端增加一个 visible 状态控制。
                    // 这里我们采用：增加一个显式的 state `showRaiseSlider`。
                    // 桌面端：MouseEnter -> show, MouseLeave -> hide
                    // 移动端：点击按钮 -> 提交。那怎么调数值？
                    // 移动端通常交互：点击“加注” -> 弹出滑块和确认按钮。
                    // 但这里按钮直接显示了金额。
                    // 让我们把按钮行为改为：
                    // 点击 -> 如果面板未显示，显示面板（仅移动端？）。
                    // 不，这样会阻碍快速加注。
                    // 让我们给按钮加一个右侧的小箭头区域专门用于打开面板？
                    // 或者：简单的让面板在点击 betAmount 区域时弹出？
                    
                    // 决定：
                    // 保持点击按钮 = 提交。
                    // 桌面端 Hover 显示面板。
                    // 移动端：点击按钮是提交。为了调数值，我们在按钮旁边（或覆盖在按钮上层的一个透明区域？）
                    // 其实最顺滑的是：按钮本身分为两部分，左边“加注”，右边“设置”。
                    // 或者：点击按钮 -> 提交。
                    // 面板不仅 Hover 显示，还可以点击某个地方 toggle。
                    // 让我们给 raise 按钮加一个长按事件？不靠谱。
                    // 简单粗暴：移动端点击按钮 -> 打开面板，面板里有“确认加注”按钮。
                    // 但这样破坏了“一键加注”的爽快感。
                    
                    // 折中方案：
                    // 桌面端维持 Hover。
                    // 移动端：点击按钮 -> 提交。
                    // 增加一个可见的“调整”小按钮在按钮旁？
                    // 或者：利用 `showRaiseSlider` state。
                    // 按钮点击：handleActionClick('raise', betAmount)
                    // 容器：onMouseEnter={() => !isMobile && setShow(true)} onMouseLeave...
                    // 额外加一个 mobile-only 的 toggle？
                    
                    // 让我们回退一步：
                    // 移动端没有 hover。
                    // 如果用户想改数值，他必须能看到滑块。
                    // 我们可以让滑块在移动端点击按钮时出现？不行，那是提交。
                    // 现在的按钮是 "加注 {betAmount}"。
                    // 我们可以把按钮改成：点击 -> 提交。
                    // 在按钮上方常驻显示一个小的“调整”图标？
                    // 或者，直接把滑块做成常驻（如果空间允许）？空间不允许。
                    
                    // 最佳实践：Action Sheet。
                    // 但为了最小改动：
                    // 给按钮添加一个 onClick 逻辑：
                    // if (mobile && !showSlider) { setShowSlider(true); return; }
                    // if (showSlider) { submit(); }
                    // 这样点击第一次开面板，第二次提交。
                    // 桌面端 hover 依然有效。
                    
                    // 让我们用这个逻辑：
                    // 判断是否移动端太麻烦（虽然有 isMobileDevice）。
                    // 我们可以统一交互：
                    // 点击按钮 -> 提交。
                    // 为了调数值，提供一个显式的 toggle 区域（例如按钮右侧 1/4 区域，或者单独一个小按钮）。
                    // 鉴于 UI 紧凑，我们在按钮右侧加一个 chevron up/down 图标作为 toggle。
                    
                    handleActionClick(amountToCall > 0 ? 'raise' : 'bet', betAmount)
                }}
                disabled={disabled}
                className={clsx(
                    "px-8 py-3 rounded-lg border-b-4 text-[#1a202c] font-['m6x11plus'] text-2xl uppercase transition-all active:translate-y-1 active:border-b-0 active:mt-1 font-bold min-w-[140px]",
                    disabled 
                        ? "bg-slate-600 border-slate-800 cursor-not-allowed opacity-50 text-white" 
                        : "bg-[#f59e0b] border-[#d97706] hover:brightness-110 shadow-lg"
                )}
                onMouseEnter={() => setShowRaiseSlider(true)}
                onMouseLeave={() => setShowRaiseSlider(false)}
              >
                加注 {betAmount}
              </button>
              
              {/* Mobile Toggle Trigger (Visible only on touch/mobile logic if we want, or just always visible as an alternative) */}
              {/* 为了简化，我们让滑块一直存在于 DOM，只是透明度控制。
                  我们在移动端可以通过点击按钮打开？
                  不，既然用户问了“手机上滑块能使用吗”，说明他发现没法 hover。
                  我们给按钮增加一个长按？或者点击逻辑：
                  我们可以把按钮拆成两半：左边 3/4 提交，右边 1/4 (icon) 打开面板。
                  或者简单点：点击按钮 -> 如果面板未开，打开面板；如果面板已开，提交。
                  这样移动端：点一下 -> 看到滑块，调整 -> 再点一下 -> 提交。
                  桌面端：Hover -> 看到滑块 -> 点一下 -> 提交。
                  这个逻辑兼容性最好。
              */}
              <button 
                className="absolute inset-0 w-full h-full opacity-0 z-10 sm:hidden"
                onClick={(e) => {
                    e.stopPropagation();
                    if (!showRaiseSlider) {
                        setShowRaiseSlider(true);
                    } else {
                        handleActionClick(amountToCall > 0 ? 'raise' : 'bet', betAmount);
                        setShowRaiseSlider(false);
                    }
                }}
              ></button>

              {/* Raise Slider / Controls */}
              <div 
                className={clsx(
                    "absolute bottom-full left-0 right-0 mb-2 bg-black/90 p-3 rounded-xl border border-white/20 flex flex-col gap-3 transition-all duration-200 origin-bottom",
                    showRaiseSlider || (!disabled && "group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-100") 
                        ? "opacity-100 pointer-events-auto scale-100" 
                        : "opacity-0 pointer-events-none scale-95"
                )}
                onMouseEnter={() => setShowRaiseSlider(true)}
                onMouseLeave={() => setShowRaiseSlider(false)}
              >
                  <div className="flex justify-between items-center text-white font-['m6x11plus']">
                      <button onClick={() => handleBetChange(betAmount - bigBlind)} className="p-2 hover:bg-white/20 rounded-lg active:scale-95 transition-transform"><ChevronDown size={20}/></button>
                      <span className="text-xl font-bold text-[#f59e0b]">${betAmount}</span>
                      <button onClick={() => handleBetChange(betAmount + bigBlind)} className="p-2 hover:bg-white/20 rounded-lg active:scale-95 transition-transform"><ChevronUp size={20}/></button>
                  </div>
                  <input 
                    type="range" 
                    min={minBet} 
                    max={maxBet} 
                    step={bigBlind}
                    value={betAmount}
                    onChange={(e) => handleBetChange(Number(e.target.value))}
                    className="w-full accent-[#f59e0b] h-4 bg-slate-700 rounded-lg appearance-none cursor-pointer touch-none"
                  />
                  {/* Mobile Confirm Button (Optional, but helps clarity) */}
                  <div className="sm:hidden pt-1 border-t border-white/10 mt-1">
                      <button 
                        onClick={() => {
                            handleActionClick(amountToCall > 0 ? 'raise' : 'bet', betAmount);
                            setShowRaiseSlider(false);
                        }}
                        className="w-full py-2 bg-[#f59e0b] text-black font-bold rounded-lg uppercase"
                      >
                        确认
                      </button>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default ActionPanel;
