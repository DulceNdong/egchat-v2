/**
 * VerifiedBadge.tsx
 * Badge de cuenta verificada/oficial para EgChat
 */

import React from 'react';

type BadgeType = 'official' | 'business' | 'merchant' | 'admin';

interface VerifiedBadgeProps {
  type?: BadgeType;
  size?: number;
  style?: React.CSSProperties;
}

const BADGE_COLORS: Record<BadgeType, { bg: string; icon: string }> = {
  official:  { bg: '#1DA1F2', icon: '#fff' },
  business:  { bg: '#00c8a0', icon: '#fff' },
  merchant:  { bg: '#f59e0b', icon: '#fff' },
  admin:     { bg: '#8b5cf6', icon: '#fff' },
};

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ type = 'official', size = 16, style }) => {
  const colors = BADGE_COLORS[type] || BADGE_COLORS.official;
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      <circle cx="12" cy="12" r="12" fill={colors.bg} />
      <polyline
        points="6 12 10 16 18 8"
        fill="none"
        stroke={colors.icon}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/** Badge inline para nombres en la lista de chats */
export const InlineBadge: React.FC<{ role?: string; size?: number }> = ({ role, size = 14 }) => {
  if (!role || role === 'user') return null;
  const type = (['official','business','merchant','admin'].includes(role) ? role : 'official') as BadgeType;
  return <VerifiedBadge type={type} size={size} style={{ marginLeft: 3, marginBottom: 1 }} />;
};

export default VerifiedBadge;
