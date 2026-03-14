import React from 'react';
import PixelCard from './PixelCard';

// 代理组件，直接使用 PixelCard
// 这样可以保留原有 Card 组件的引用，但底层实现换成 PixelCard
const Card = (props) => {
  return <PixelCard {...props} />;
};

export default Card;
