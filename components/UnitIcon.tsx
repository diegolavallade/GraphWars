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
        <polygon points="12 2 15 22 12 18 9 22 12 2" />
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
