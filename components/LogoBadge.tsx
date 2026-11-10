'use client';

import React from 'react';

export interface LogoBadgeProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export function LogoBadge({ size = 'md', className = '', showText = false }: LogoBadgeProps) {
  const px = { sm: 32, md: 44, lg: 56, xl: 80 }[size] || 44;
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon-192.png" width={px} height={px} alt="" className="flex-shrink-0 select-none shadow-md" style={{ borderRadius: px * 0.22 }} />

      {showText && (
        <div className="flex flex-col">
          <span className="text-base sm:text-lg font-extrabold tracking-tight text-white leading-none">
            LitroWatt <span className="text-[#bef264]">IAZ</span>
          </span>
        </div>
      )}
    </div>
  );
}

export default LogoBadge;
