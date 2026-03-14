import React from 'react';
import { clsx } from 'clsx';
import { getCardBackStyle } from '../utils/cardUtils';

const SUIT_OFFSETS = {
  hearts: 0,
  clubs: 1,
  diamonds: 2,
  spades: 3,
};

const PixelCard = ({ rank, suit, hidden = false, className, style, onClick }) => {
  const baseUrl = import.meta.env.BASE_URL;
  
  let cardStyle = {
      backgroundImage: `url('${baseUrl}assets/img/cards.png')`,
      backgroundSize: '1400% 400%', // 14 cols, 4 rows
      backgroundPosition: '0% 0%',
      backgroundRepeat: 'no-repeat',
      imageRendering: 'pixelated',
      ...style
  };
  
  if (hidden) {
    // 卡背处理：直接合并 getCardBackStyle 返回的样式
    const backStyle = getCardBackStyle('RED');
    cardStyle = {
        ...cardStyle,
        ...backStyle
    };
  } else {
    let numericRank = rank;
    if (rank === 14) numericRank = 1;
    // 如果 rank 是字符 (J, Q, K, A, T)
    if (typeof rank === 'string') {
        if (rank === 'A') numericRank = 1;
        else if (rank === 'K') numericRank = 13;
        else if (rank === 'Q') numericRank = 12;
        else if (rank === 'J') numericRank = 11;
        else if (rank === 'T') numericRank = 10;
        else numericRank = parseInt(rank, 10);
    }
    
    const suitOffset = SUIT_OFFSETS[suit] ?? 0;
    
    // 14 columns (0..13). Max index is 13.
    // Percentage = (index / (cols - 1)) * 100%
    const backgroundPositionX = `${(numericRank / 13) * 100}%`;
    
    // 4 rows (0..3). Max index is 3.
    const backgroundPositionY = `${(suitOffset / 3) * 100}%`;
    
    cardStyle.backgroundPosition = `${backgroundPositionX} ${backgroundPositionY}`;
  }

  return (
    <div 
      className={clsx(
        "relative inline-block select-none overflow-hidden rounded",
        !hidden && "bg-white", // Only add white bg for front face to avoid bleeding on back
        className
      )}
      style={cardStyle}
      onClick={onClick}
    />
  );
};

export default PixelCard;
