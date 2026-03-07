import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Plus, Minus } from 'lucide-react';

const ActionPanel = ({ 
  onAction, 
  currentBet = 0, 
  amountToCall = 0,
  minBet = 20, 
  maxBet = 2000, 
  potSize = 50,
  bigBlind = 20,
  disabled = false
}) => {
  const [betAmount, setBetAmount] = useState(minBet); // 默认 minBet
  const [inputValue, setInputValue] = useState(minBet.toString()); // 字符串输入状态
  const safeMinBet = Math.min(minBet, maxBet);

  // 增加确认 Modal 状态
  const [showFoldConfirm, setShowFoldConfirm] = useState(false);

  // 每次 safeMinBet 或 disabled 变化时，重置
  React.useEffect(() => {
      if (!disabled) {
          const initVal = safeMinBet;
          setBetAmount(initVal);
          setInputValue(initVal.toString());
      }
  }, [disabled, safeMinBet]);

  // 当 betAmount 被外部逻辑或按钮更新时，同步更新 inputValue
  // 但要注意：如果这是用户正在输入时触发的更新，可能会打断输入。
  // 所以我们需要区分是“程序更新”还是“用户输入”。
  // 简单起见，我们只在 betAmount 变化且与当前 inputValue 不一致（数值上）时更新
  // 或者只在非编辑状态下同步？
  // 更好的方式是：handleBetChange 同时更新两者。
  
  // 防守性编程：如果 safeMinBet 或 maxBet 变了，betAmount 需要调整
  React.useEffect(() => {
      setBetAmount(prev => {
          const adjusted = Math.max(safeMinBet, Math.min(maxBet, prev));
          if (adjusted !== prev) {
             setInputValue(adjusted.toString());
          }
          return adjusted;
      });
  }, [safeMinBet, maxBet]);

  // 处理加减按钮和快捷按钮（直接设置数值）
  const handleBetChange = (amount) => {
    if (disabled) return;
    const newAmount = Math.max(safeMinBet, Math.min(maxBet, amount));
    setBetAmount(newAmount);
    setInputValue(newAmount.toString());
  };

  // 处理输入框变化（允许自由输入，不限制范围）
  const handleInputChange = (e) => {
      if (disabled) return;
      const val = e.target.value;
      setInputValue(val);
      
      // 尝试解析并更新 betAmount（如果合法），以便实时反馈（如计算BB数）
      // 但不强制范围，以免打断输入
      const parsed = parseInt(val);
      if (!isNaN(parsed)) {
          // 这里可以不更新 betAmount，或者更新但不限制范围？
          // 如果我们更新 betAmount，而 betAmount 用于显示，那就会冲突。
          // 所以 input 的 value 必须绑定到 inputValue。
          // betAmount 仅用于按钮逻辑和 BB 计算。
          setBetAmount(parsed);
      }
  };

  // 处理输入框失焦（校验并修正范围）
  const handleInputBlur = () => {
      let parsed = parseInt(inputValue);
      if (isNaN(parsed)) {
          parsed = safeMinBet;
      }
      const newAmount = Math.max(safeMinBet, Math.min(maxBet, parsed));
      setBetAmount(newAmount);
      setInputValue(newAmount.toString());
  };

  const handleActionClick = (type, val) => {
    if (disabled) return;
    
    if (type === 'fold') {
        setShowFoldConfirm(true);
        return;
    }

    // 提交前的最终校验
    if (type === 'raise' || type === 'allin') {
        let finalAmount = val;
        // 如果是从 input 来的 raise，需要再次校验
        if (type === 'raise') {
             // 确保是有效的数字
             if (isNaN(finalAmount)) finalAmount = safeMinBet;
             // 确保在范围内
             finalAmount = Math.max(safeMinBet, Math.min(maxBet, finalAmount));
             
             // 如果修正后的值与当前 betAmount 不一致，更新它
             if (finalAmount !== betAmount) {
                 setBetAmount(finalAmount);
                 setInputValue(finalAmount.toString());
             }
             val = finalAmount;
        }
        
        playAudio(type);
        onAction(type, val);
    } else {
        playAudio(type);
        onAction(type, val);
    }
  };

  const confirmFold = () => {
      setShowFoldConfirm(false);
      playAudio('fold');
      onAction('fold');
  };

  const cancelFold = () => {
      setShowFoldConfirm(false);
  };

  // Simple Audio Synthesis
  const playAudio = (type) => {
      // 检查浏览器支持
      if (!window.speechSynthesis) return;
      
      let text = type;
      // 简单映射
      if (type === 'call') text = "Call";
      else if (type === 'check') text = "Check";
      else if (type === 'fold') text = "Fold";
      else if (type === 'raise') text = "Raise";
      else if (type === 'allin') text = "All In";
      else return; // Unknown type

      // Cancel previous utterances to avoid queue buildup
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US'; // Use English for poker terms
      utterance.rate = 1.2; // Slightly faster
      utterance.pitch = 1.0;
      
      window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={clsx("w-full bg-[#1a1f2e] text-white p-3 rounded-t-2xl shadow-2xl border-t border-white/10 pb-6 relative transition-all duration-300", disabled && "opacity-70 grayscale")}>
      
      {/* Fold Confirmation Modal */}
      {showFoldConfirm && (
          <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm rounded-t-2xl flex flex-col items-center justify-center p-4">
              <div className="text-white font-bold text-lg mb-4">确认弃牌?</div>
              <div className="flex gap-4 w-full justify-center">
                  <button 
                    onClick={cancelFold}
                    className="bg-gray-600 hover:bg-gray-500 px-6 py-2 rounded-lg font-bold"
                  >
                      取消
                  </button>
                  <button 
                    onClick={confirmFold}
                    className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded-lg font-bold text-white shadow-lg animate-pulse"
                  >
                      确认弃牌
                  </button>
              </div>
          </div>
      )}

      {disabled && (
        <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-[2px] rounded-t-2xl flex items-center justify-center pointer-events-auto cursor-not-allowed">
            <span className="text-white/90 font-bold text-sm bg-black/50 px-4 py-2 rounded-full border border-white/10 shadow-lg animate-pulse">
                等待其他玩家行动...
            </span>
        </div>
      )}

      {/* 顶部提示 - 更紧凑 */}
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">🎮 操作</span>
        </div>
        <div className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors", disabled ? "bg-slate-700 text-slate-400" : "bg-[#d4b979] text-[#1a1f2e]")}>
          {disabled ? "等待中" : "轮到你了"}
        </div>
      </div>

      {/* 下注控制区 - 压缩高度 */}
      <div className="bg-[#252a3a] rounded-lg p-2 mb-2 border border-white/5">
        <div className="flex justify-between items-center mb-1">
          <span className="text-gray-400 text-[10px]">下注金额</span>
          <span className="text-green-500 text-[10px]">有效积分: {maxBet}</span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <button 
            onClick={() => handleBetChange(betAmount - 100)}
            className="text-gray-400 hover:text-white transition-colors p-1"
            disabled={disabled}
          >
            <span className="text-xs">-100</span>
          </button>
          <button 
            onClick={() => handleBetChange(betAmount - 20)}
            className="text-gray-400 hover:text-white transition-colors p-1"
            disabled={disabled}
          >
             <span className="text-xs">-20</span>
          </button>
          
          <div className="flex-1 bg-[#32384a] h-9 rounded-md flex items-center justify-center border border-blue-500/50 relative overflow-hidden">
            <input 
              type="number" 
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className="bg-transparent text-center text-lg font-bold w-full h-full focus:outline-none text-white leading-none px-2 z-10"
              disabled={disabled}
            />
            <div className="absolute -bottom-3.5 text-[8px] text-gray-500 z-0">
              = {(!isNaN(parseInt(inputValue)) ? (parseInt(inputValue) / bigBlind).toFixed(1) : '0.0')} BB
            </div>
          </div>

          <button 
            onClick={() => handleBetChange(betAmount + 20)}
            className="bg-blue-600 hover:bg-blue-500 w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs shadow-md active:scale-95 transition-all"
            disabled={disabled}
          >
            +20
          </button>
          <button 
            onClick={() => handleBetChange(betAmount + 100)}
            className="bg-blue-600 hover:bg-blue-500 w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs shadow-md active:scale-95 transition-all"
            disabled={disabled}
          >
            +100
          </button>
        </div>

        {/* 快捷按钮 - 更小 */}
        <div className="grid grid-cols-4 gap-1.5">
          {['Min', '3BB', '4BB', 'Pot'].map((label, idx) => {
             let val = safeMinBet;
             if (idx === 1) val = Math.max(safeMinBet, bigBlind * 3);
             if (idx === 2) val = Math.max(safeMinBet, bigBlind * 4);
             if (idx === 3) {
                 // Pot Limit Calculation: Current Pot + 2 * Amount To Call (simplified)
                 // Or just potSize + amountToCall? No, raise amount = pot size + call amount
                 // But for simplicity: potSize + currentBet (if not included)
                 // Let's just use potSize * 1.5 or something simple if complex logic is hard
                 // Standard Pot Raise: Raise To = Pot + 2*CallAmount
                 // We don't have full info here easily, let's just do Pot Size + Current Bet
                 val = Math.max(safeMinBet, potSize + amountToCall); 
             }
             
             // Cap at maxBet
             val = Math.min(maxBet, val);

             return (
              <button 
                key={label}
                onClick={() => handleBetChange(val)}
                className="bg-[#32384a] hover:bg-[#3e455b] py-1.5 rounded-md text-[10px] font-medium text-gray-300 border border-white/5"
                disabled={disabled}
              >
                {label}
              </button>
             )
          })}
        </div>
      </div>

      {/* 主要操作按钮 - 高度减小 */}
      <div className="grid grid-cols-4 gap-2 h-10">
        <button 
          onClick={() => handleActionClick('fold')}
          className="bg-gray-600 hover:bg-gray-500 rounded-lg font-bold text-sm shadow-lg active:scale-95 transition-all"
          disabled={disabled}
        >
          弃牌
        </button>

        {/* Check Button */}
        {amountToCall === 0 && (
          <button 
            onClick={() => handleActionClick('check')}
            className="bg-yellow-600 hover:bg-yellow-500 text-slate-900 rounded-lg font-bold text-sm shadow-lg active:scale-95 transition-all"
            disabled={disabled}
          >
            过牌
          </button>
        )}

        {/* Call Button */}
        {amountToCall > 0 && (
          <button 
            onClick={() => handleActionClick('call')}
            className="bg-green-600 hover:bg-green-500 rounded-lg font-bold text-sm shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center leading-none gap-0.5"
            disabled={disabled}
          >
            <span>跟注</span>
            <span className="text-[10px] font-normal opacity-80">{amountToCall}</span>
          </button>
        )}
        
        {/* Placeholder if one button is hidden to keep layout? No, grid auto layout */}
        {/* If we want 3 buttons always visible, we might need col-span adjustment */}
        {/* Let's make "Raise" take remaining space or standard grid */}
        
        {/* Raise / All-in Button */}
        <div className="col-span-2">
            {betAmount >= maxBet ? (
            <button 
            onClick={() => handleActionClick('allin', maxBet)}
            className="w-full h-full bg-red-600 hover:bg-red-500 rounded-lg font-bold text-sm shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center leading-none gap-0.5"
            disabled={disabled}
            >
            <span>全下</span>
            <span className="text-[10px] font-normal opacity-80">{maxBet}</span>
            </button>
            ) : (
            <button 
                onClick={() => handleActionClick('raise', betAmount)}
                className="w-full h-full bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-sm shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center leading-none gap-0.5"
                disabled={disabled}
            >
                <span>加注至</span>
                <span className="text-[10px] font-normal opacity-80">{betAmount}</span>
            </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default ActionPanel;
