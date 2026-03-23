import React from 'react';

const toneClassMap = {
  success: 'bg-emerald-600/85 border-emerald-300/40 text-white',
  warning: 'bg-amber-600/85 border-amber-300/40 text-white',
  error: 'bg-rose-600/90 border-rose-300/40 text-white',
};

const ToastContainer = ({ toasts = [] }) => {
  if (!toasts.length) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-[70] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const toneClass = toneClassMap[toast.tone] || toneClassMap.warning;
        return (
          <div
            key={toast.id}
            className={`px-3 py-2 rounded-lg border text-sm shadow-lg backdrop-blur-sm ${toneClass}`}
          >
            {toast.message}
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
