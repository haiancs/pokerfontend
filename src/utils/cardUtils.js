
// Weblatro 的卡背图集是 7 列 5 行 (497x475 px, 单张 71x95 px)
const BACK_COLS = 7;
const BACK_ROWS = 5;

// 预定义的卡背类型 (col, row)
export const CARD_BACKS = {
  RED: { x: 0, y: 0 },
  BLUE: { x: 1, y: 0 },
  YELLOW: { x: 2, y: 0 },
  GREEN: { x: 3, y: 0 },
  BLACK: { x: 4, y: 0 },
  // 可以根据实际图片添加更多
};

// 默认卡背
const DEFAULT_BACK = CARD_BACKS.RED;

/**
 * 获取卡背的样式对象
 * @param {string} backType - 卡背类型 (可选)
 * @returns {object} style对象
 */
export const getCardBackStyle = (backType = 'RED') => {
  const coords = CARD_BACKS[backType] || DEFAULT_BACK;
  const baseUrl = import.meta.env.BASE_URL;
  
  // 对于 Sprite Sheet，
  // background-size 应该设为 (cols * 100)% (rows * 100)%
  // background-position 应该使用：(index / (total - 1)) * 100%
  const posX = (coords.x / (BACK_COLS - 1)) * 100;
  const posY = (coords.y / (BACK_ROWS - 1)) * 100;

  return {
    backgroundImage: `url('${baseUrl}assets/img/card_backs.png')`,
    backgroundSize: `${BACK_COLS * 100}% ${BACK_ROWS * 100}%`, // 动态计算
    backgroundPosition: `${posX}% ${posY}%`,
    imageRendering: 'pixelated',
    backgroundRepeat: 'no-repeat'
  };
};

// 导出 CSS 类名字符串（如果使用 Tailwind 或 CSS Modules，这里仅作为参考）
export const cardBackClass = "bg-cover bg-no-repeat rounded border border-black/20";
