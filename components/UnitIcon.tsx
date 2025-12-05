import React from 'react';
import { UnitType } from '../types';

interface UnitIconProps {
  type: UnitType;
  color: string;
  size?: number;
  className?: string;
}

export const UnitIcon: React.FC<UnitIconProps> = ({ type, color, size = 16, className = '' }) => {
  if (type === 'peon') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="8" />
      </svg>
    );
  }
  if (type === 'horse') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
         {/* Wider, knight-like shape */}
        <path d="M19 19c0-1.5-1-2-2-3s-1.5-2-1.5-4c0-3.5 1.5-5 3-6.5-2.5 0-5 1.5-6 4-1-1.5-1-3-1-3s-2 0-3 1.5c-.5 1-1 3.5 0 5 .5 1 1 2 1.5 2.5 0 0-1.5 1-1.5 2.5 0 1.5 1.5 2 2.5 2h8z" />
      </svg>
    );
  }
  if (type === 'tank') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <line x1="12" y1="6" x2="12" y2="2" />
      </svg>
    );
  }
  return null;
};
