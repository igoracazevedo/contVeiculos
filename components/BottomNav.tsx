'use client';

import React from 'react';
import { Home, Fuel, Zap, Dumbbell, Plus } from 'lucide-react';

export type NavTab = 'inicio' | 'gasolina' | 'energia' | 'academia';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenQuickAdd: () => void;
}

export function BottomNav({ activeTab, onSelectTab, onOpenQuickAdd }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-md border-t border-slate-800/80 px-2 py-1.5 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* Início */}
        <button
          onClick={() => onSelectTab('inicio')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
            activeTab === 'inicio'
              ? 'text-sky-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Início</span>
        </button>

        {/* Gasolina */}
        <button
          onClick={() => onSelectTab('gasolina')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
            activeTab === 'gasolina'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Fuel className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Gasolina</span>
        </button>

        {/* Botão '+' Flutuante Central */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={onOpenQuickAdd}
            className="w-13 h-13 p-3.5 rounded-full bg-gradient-to-tr from-sky-500 to-emerald-400 text-slate-950 shadow-lg shadow-sky-500/25 active:scale-95 transition-transform hover:shadow-emerald-400/30 flex items-center justify-center border-4 border-slate-950"
            aria-label="Adicionar novo registro"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span className="text-[9px] font-semibold text-slate-400 mt-0.5">Novo</span>
        </div>

        {/* Energia */}
        <button
          onClick={() => onSelectTab('energia')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
            activeTab === 'energia'
              ? 'text-emerald-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Energia</span>
        </button>

        {/* Academia */}
        <button
          onClick={() => onSelectTab('academia')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
            activeTab === 'academia'
              ? 'text-purple-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Dumbbell className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Academia</span>
        </button>
      </div>
    </nav>
  );
}
export default BottomNav;
