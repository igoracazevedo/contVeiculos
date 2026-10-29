'use client';

import React, { useState } from 'react';
import { Veiculo, Abastecimento, Recarga } from '@/types/database';
import {
  formatCurrency,
  calcularMediaKmL,
  formatNumber,
} from '@/lib/utils';
import { getVehicleDisplayPhoto, getDefaultVehiclePhoto } from '@/lib/vehiclePhotos';
import { Car, Fuel, Zap, Edit2, Trash2, Gauge, Dumbbell, Sparkles } from 'lucide-react';

interface CarCardProps {
  veiculo: Veiculo;
  abastecimentos: Abastecimento[];
  recargas: Recarga[];
  onEdit: (veiculo: Veiculo) => void;
  onDelete: (placa: string) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  hideValues?: boolean;
}

export function CarCard({
  veiculo,
  abastecimentos,
  recargas,
  onEdit,
  onDelete,
  isSelected,
  onSelect,
  hideValues = false,
}: CarCardProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Filtrar abastecimentos e recargas deste veículo
  const veiculoAbastecimentos = abastecimentos.filter((a) => a.placa === veiculo.placa);
  const veiculoRecargas = recargas.filter((r) => r.placa === veiculo.placa);

  // Média de consumo km/l
  const mediaKmL = calcularMediaKmL(veiculoAbastecimentos);

  // Totais
  const totalGastoGasolina = veiculoAbastecimentos.reduce(
    (acc, cur) => acc + (Number(cur.valor) || 0),
    0
  );
  const totalGastoEnergia = veiculoRecargas.reduce(
    (acc, cur) => acc + (Number(cur.valor) || 0),
    0
  );
  const totalInvestido = totalGastoGasolina + totalGastoEnergia;

  // Foto: Usa personalizada ou busca automaticamente foto pública sem direitos autorais
  const displayPhoto = getVehicleDisplayPhoto(veiculo);

  return (
    <div
      onClick={onSelect}
      className={`iaz-card transition-all duration-200 overflow-hidden cursor-pointer ${
        isSelected
          ? 'border-[#ff6200] ring-2 ring-[#ff6200]/25 shadow-md'
          : 'hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Top Banner / Foto do Veículo */}
      <div className="relative h-44 w-full bg-slate-900 overflow-hidden flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayPhoto}
          alt={`${veiculo.marca} ${veiculo.modelo}`}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = getDefaultVehiclePhoto(
              veiculo.marca,
              veiculo.modelo
            );
          }}
          referrerPolicy="no-referrer"
        />

        {/* Gradiente sutil sobre a imagem */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Placa Mercosul Badge */}
        <div
          className="absolute top-3 left-3 bg-white text-slate-950 px-2.5 py-0.5 rounded-lg shadow border border-slate-300 text-xs font-black tracking-widest font-mono uppercase flex items-center gap-1.5 z-10 select-none"
          style={{ color: '#020617' }}
        >
          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
          {veiculo.placa}
        </div>

        {/* Ações (Editar e Deletar) */}
        <div
          className="absolute top-3 right-3 flex items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onEdit(veiculo)}
            className="p-2 rounded-xl bg-black/50 text-white hover:text-[#ff6200] hover:bg-black/70 backdrop-blur-md transition-all border border-white/20"
            title="Editar veículo"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="p-2 rounded-xl bg-black/50 text-white hover:text-rose-400 hover:bg-black/70 backdrop-blur-md transition-all border border-white/20"
            title="Excluir veículo"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Informações sobrepostas na base da imagem */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#ffb800]">
              {veiculo.marca}
            </span>
            <h3 className="text-base font-extrabold tracking-tight drop-shadow-md">
              {veiculo.modelo}
            </h3>
          </div>

          {/* Badge de Academia se habilitado no veículo */}
          {veiculo.tem_academia && (
            <div className="flex items-center gap-1 bg-[#000d3c]/85 border border-[#ff6200]/40 px-2 py-0.5 rounded-lg text-[10px] font-bold text-[#ffb800] backdrop-blur-sm">
              <Dumbbell className="w-3 h-3 text-[#ff6200]" />
              <span>Academia</span>
            </div>
          )}
        </div>
      </div>

      {/* Confirmação de Exclusão rápida se acionada */}
      {showConfirmDelete && (
        <div
          className="p-3 bg-rose-500/10 border-b border-rose-500/30 flex items-center justify-between text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-rose-600 dark:text-rose-400 font-semibold">
            Excluir permanentemente este veículo?
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onDelete(veiculo.placa)}
              className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[11px]"
            >
              Sim
            </button>
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px]"
            >
              Não
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo e Métricas do Card */}
      <div className="p-3.5 space-y-3">
        {/* Total Investido e Média */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
              Total Investido
            </span>
            <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">
              {hideValues ? '••••' : formatCurrency(totalInvestido)}
            </h4>
          </div>

          {mediaKmL !== null ? (
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1 justify-end">
                <Gauge className="w-3 h-3 text-[#ff6200]" /> Consumo
              </span>
              <span className="text-xs font-extrabold text-[#ff6200]">
                {formatNumber(mediaKmL, 2)} km/l
              </span>
            </div>
          ) : (
            <div className="text-right text-[10px] text-slate-400 font-medium">
              Consumo: em apuração
            </div>
          )}
        </div>

        {/* Divisão Gasolina x Energia */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80">
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 mb-0.5 text-[10px] font-bold">
              <Fuel className="w-3 h-3" />
              <span>Combustível</span>
            </div>
            <p className="font-extrabold text-slate-800 dark:text-slate-200">
              {hideValues ? '••••' : formatCurrency(totalGastoGasolina)}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {veiculoAbastecimentos.length} {veiculoAbastecimentos.length === 1 ? 'abastecimento' : 'abastecimentos'}
            </p>
          </div>

          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80">
            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 mb-0.5 text-[10px] font-bold">
              <Zap className="w-3 h-3" />
              <span>Energia Elétrica</span>
            </div>
            <p className="font-extrabold text-slate-800 dark:text-slate-200">
              {hideValues ? '••••' : formatCurrency(totalGastoEnergia)}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {veiculoRecargas.length} {veiculoRecargas.length === 1 ? 'recarga' : 'recargas'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CarCard;
