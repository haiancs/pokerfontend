import React from 'react';
import { clsx } from 'clsx';

const Chip = ({ amount, className }) => {
  return (
    <div className={clsx(
      "flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-[10px] font-bold border-2 border-dashed border-white/40 shadow-sm",
      className
    )}>
      <div className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center">
        {amount >= 1000 ? `${(amount / 1000).toFixed(1)}k` : amount}
      </div>
    </div>
  );
};

export default Chip;
