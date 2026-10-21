'use client';

import React, { useState } from 'react';
import { Veiculo, Abastecimento, Recarga } from '@/types/database';
import {
  formatCurrency,
  formatGoogleDriveUrl,
  calcularMediaKmL,
  formatNumber,
} from '@/lib/utils';
import { Car, Fuel, Zap, Edit2, Trash2, Gauge, AlertCircle } from 'lucide-react';

interface CarCardProps {
  veiculo: Veiculo;
  abastecimentos: Abastecimento[];
  recargas: Recarga[];
  onEdit: (veiculo: Veiculo) => void;
  onDelete: (placa: string) => void;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function CarCard({
  veiculo,
  abastecimentos,
  recargas,
  onEdit,
  onDelete,
  isSelected,
  onSelect,
}: CarCardProps) {
  const [imageError, setImageError] = useState(false);
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

  const fotoUrl = formatGoogleDriveUrl(veiculo.foto);

  return (
    <div
      onClick={onSelect}
      className={`relative rounded-2xl border transition-all duration-200 overflow-hidden ${
        isSelected
          ? 'border-sky-500 shadow-lg shadow-sky-500/10 bg-slate-900'
          : 'border-slate-800/80 bg-slate-900/90 hover:border-slate-700'
      }`}
    >
      {/* Top Banner / Foto do Veículo */}
      <div className="relative h-44 w-full bg-slate-950 overflow-hidden flex items-center justify-center">
        {fotoUrl && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fotoUrl}
            alt={`${veiculo.marca} ${veiculo.modelo}`}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-600 gap-2">
            <Car className="w-16 h-16 stroke-1 text-slate-700" />
            <span className="text-xs uppercase tracking-wider font-medium text-slate-500">
              Sem foto cadastrada
            </span>
          </div>
        )}

        {/* Gradiente escuro sobre a imagem */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />

        {/* Placa Mercosul / Padrão Badge */}
        <div className="absolute top-3 left-3 bg-white text-slate-900 px-2.5 py-0.5 rounded shadow border-2 border-slate-900 text-xs font-black tracking-widest font-mono uppercase flex items-center gap-1">
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
            className="p-2 rounded-xl bg-slate-950/70 text-slate-300 hover:text-sky-400 hover:bg-slate-900 backdrop-blur-md transition-all border border-slate-800/60"
            title="Editar veículo"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="p-2 rounded-xl bg-slate-950/70 text-slate-300 hover:text-red-400 hover:bg-slate-900 backdrop-blur-md transition-all border border-slate-800/60"
            title="Excluir veículo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Marca e Modelo sobrepostos */}
        <div className="absolute bottom-3 left-4 right-4">
          <p className="text-xs uppercase tracking-wider font-semibold text-sky-400">
            {veiculo.marca}
          </p>
          <h3 className="text-xl font-bold text-white leading-tight truncate">
            {veiculo.modelo}
          </h3>
        </div>
      </div>

      {/* Conteúdo / Indicadores */}
      <div className="p-4 space-y-3.5">
        {/* Média Geral km/l */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 leading-none">Média Geral</p>
              <p className="text-sm font-bold text-slate-200 mt-1">
                {mediaKmL !== null ? `${formatNumber(mediaKmL, 2)} km/l` : '— km/l'}
              </p>
            </div>
          </div>
          <span className="text-[11px] text-slate-500">
            {veiculoAbastecimentos.length} {veiculoAbastecimentos.length === 1 ? 'abastecimento' : 'abastecimentos'}
          </span>
        </div>

        {/* Totais de Combustível e Recarga */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-amber-400 mb-1">
              <Fuel className="w-3.5 h-3.5" />
              <span className="font-semibold text-[11px]">Gasolina</span>
            </div>
            <p className="font-bold text-slate-100 text-sm">{formatCurrency(totalGastoGasolina)}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span className="font-semibold text-[11px]">Energia</span>
            </div>
            <p className="font-bold text-slate-100 text-sm">{formatCurrency(totalGastoEnergia)}</p>
          </div>
        </div>
      </div>

      {/* Confirmação de exclusão */}
      {showConfirmDelete && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-sm p-4 flex flex-col justify-center items-center text-center animate-in fade-in duration-150"
        >
          <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
          <h4 className="font-bold text-white text-base">Excluir veículo?</h4>
          <p className="text-xs text-slate-400 max-w-[240px] mt-1 mb-4">
            Tem certeza que deseja excluir a placa <span className="text-white font-semibold">{veiculo.placa}</span>? Esta ação não pode ser desfeita.
          </p>
          <div className="flex items-center gap-2 w-full max-w-xs">
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="flex-1 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                setShowConfirmDelete(false);
                onDelete(veiculo.placa);
              }}
              className="flex-1 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default CarCard;
