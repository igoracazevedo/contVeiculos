'use client';

import React from 'react';

export interface LogoBadgeProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export function LogoBadge({ size = 'md', className = '', showText = false }: LogoBadgeProps) {
  // Tamanhos:
  // sm: 32px
  // md: 44px
  // lg: 56px
  // xl: 72px
  const sizeMap = {
    sm: {
      container: 'w-8 h-8 rounded-[8px]',
      icon: 14,
      iaz: 'text-[9px] -mt-0.5',
    },
    md: {
      container: 'w-11 h-11 rounded-[11px]',
      icon: 20,
      iaz: 'text-[11px] -mt-0.5',
    },
    lg: {
      container: 'w-14 h-14 rounded-[14px]',
      icon: 26,
      iaz: 'text-xs -mt-0.5',
    },
    xl: {
      container: 'w-20 h-20 rounded-[18px]',
      icon: 36,
      iaz: 'text-sm font-black',
    },
  };

  const current = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Squircle com cantos arredondados ~22% */}
      <div
        className={`${current.container} relative flex flex-col items-center justify-center bg-gradient-to-br from-[#001652] to-[#000d3c] border-[1.5px] border-[#ff6200] shadow-md flex-shrink-0 select-none overflow-hidden`}
        style={{
          boxShadow: '0 4px 14px rgba(0, 13, 60, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        }}
      >
        {/* Símbolo do App: Junção de Combustível (Gota/Bomba) e Energia (Raio) em Branco */}
        <svg
          width={current.icon}
          height={current.icon}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white drop-shadow-sm"
        >
          {/* Raio e Gota estilizados representando Litro + Watt */}
          <path
            d="M13 2L4.5 13.5H11.5L10 22L19.5 10.5H12.5L14 2Z"
            fill="white"
            stroke="white"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
        </svg>

        {/* Sigla 'iaz' em dourado #ffb800 */}
        <span
          className={`font-black text-[#ffb800] tracking-tighter leading-none ${current.iaz}`}
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '-0.05em',
          }}
        >
          iaz
        </span>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="text-base sm:text-lg font-extrabold tracking-tight text-white leading-none">
            LitroWatt <span className="text-[#ff6200]">IAZ</span>
          </span>
        </div>
      )}
    </div>
  );
}

export default LogoBadge;
