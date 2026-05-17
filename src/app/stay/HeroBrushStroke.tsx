import React from 'react';

const HeroBrushStroke = () => (
  <svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
    <defs>
      <linearGradient id="brushGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#1a1f5e', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#e8192c', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="url(#brushGradient)" />
    <path d="M0,0 C30,50 70,50 100,100 L100,0 L0,0 Z" fill="#1a1f5e" />
    <path d="M0,100 C30,50 70,50 100,0 L0,0 L0,100 Z" fill="#e8192c" />
  </svg>
);

export default HeroBrushStroke;
