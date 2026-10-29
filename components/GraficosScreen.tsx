'use client';

import React, { useMemo, useState } from 'react';
import { Abastecimento, Recarga, Veiculo } from '@/types/database';
import { formatCurrency, formatNumber, parseDate, getMonthName } from '@/lib/utils';
import {
  Fuel,
  Zap,
  TrendingUp,
  BarChart3,
  Calendar,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ArrowUpDown,
} from 'lucide-react';

interface GraficosScreenProps {
  abastecimentos: Abastecimento[];
  recargas: Recarga[];
  veiculos: Veiculo[];
  selectedPlaca: string | null;
  hideValues: boolean;
}

interface MonthData {
  year: number;
  month: number;
  label: string;
  key: string;
  gastoGasolina: number;
  litrosGasolina: number;
  qtdGasolina: number;
  gastoEnergia: number;
  kwaEnergia: number;
  qtdEnergia: number;
  totalGasto: number;
}

export function GraficosScreen({
  abastecimentos,
  recargas,
  selectedPlaca,
  hideValues,
}: GraficosScreenProps) {
  const [selectedMetric, setSelectedMetric] = useState<'valor' | 'volume'>('valor');
  const [selectedYear, setSelectedYear] = useState<number | 'todos'>('todos');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // Padrão: decrescente por data

  // Filtragem inicial por placa
  const filteredAbastecimentos = useMemo(() => {
    if (!selectedPlaca) return abastecimentos;
    return abastecimentos.filter((a) => a.placa === selectedPlaca);
  }, [abastecimentos, selectedPlaca]);

  const filteredRecargas = useMemo(() => {
    if (!selectedPlaca) return recargas;
    return recargas.filter((r) => r.placa === selectedPlaca);
  }, [recargas, selectedPlaca]);

  // Agrupar dados mês a mês
  const monthlyData = useMemo(() => {
    const map = new Map<string, MonthData>();

    // Processar combustível
    for (const a of filteredAbastecimentos) {
      const d = parseDate(a.data_hora || a.data);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, '0')}`;

      if (!map.has(key)) {
        map.set(key, {
          year,
          month,
          label: `${getMonthName(month).slice(0, 3)}/${String(year).slice(2)}`,
          key,
          gastoGasolina: 0,
          litrosGasolina: 0,
          qtdGasolina: 0,
          gastoEnergia: 0,
          kwaEnergia: 0,
          qtdEnergia: 0,
          totalGasto: 0,
        });
      }

      const entry = map.get(key)!;
      entry.gastoGasolina += Number(a.valor) || 0;
      entry.litrosGasolina += Number(a.litros) || 0;
      entry.qtdGasolina += 1;
      entry.totalGasto += Number(a.valor) || 0;
    }

    // Processar recargas
    for (const r of filteredRecargas) {
      const d = parseDate(r.data_hora || r.data);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, '0')}`;

      if (!map.has(key)) {
        map.set(key, {
          year,
          month,
          label: `${getMonthName(month).slice(0, 3)}/${String(year).slice(2)}`,
          key,
          gastoGasolina: 0,
          litrosGasolina: 0,
          qtdGasolina: 0,
          gastoEnergia: 0,
          kwaEnergia: 0,
          qtdEnergia: 0,
          totalGasto: 0,
        });
      }

      const entry = map.get(key)!;
      entry.gastoEnergia += Number(r.valor) || 0;
      entry.kwaEnergia += Number(r.kwa) || 0;
      entry.qtdEnergia += 1;
      entry.totalGasto += Number(r.valor) || 0;
    }

    // Ordenar cronologicamente
    const list = Array.from(map.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    return list;
  }, [filteredAbastecimentos, filteredRecargas]);

  // Lista de anos disponíveis
  const availableYears = useMemo(() => {
    const set = new Set<number>();
    monthlyData.forEach((m) => set.add(m.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [monthlyData]);

  // Filtrar pelo ano selecionado e aplicar ordenação (decrescente padrão ou crescente)
  const displayedMonths = useMemo(() => {
    let list =
      selectedYear === 'todos'
        ? [...monthlyData]
        : monthlyData.filter((m) => m.year === selectedYear);

    list.sort((a, b) => {
      const valA = a.year * 100 + a.month;
      const valB = b.year * 100 + b.month;
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

    return list;
  }, [monthlyData, selectedYear, sortOrder]);

  // Máximos para cálculo proporcional das barras
  const maxGasto = useMemo(() => {
    let max = 1;
    for (const m of displayedMonths) {
      if (m.totalGasto > max) max = m.totalGasto;
    }
    return max;
  }, [displayedMonths]);

  const maxVolume = useMemo(() => {
    let max = 1;
    for (const m of displayedMonths) {
      const vol = Math.max(m.litrosGasolina, m.kwaEnergia);
      if (vol > max) max = vol;
    }
    return max;
  }, [displayedMonths]);

  // Totais agregados do período
  const totals = useMemo(() => {
    let gas = 0;
    let lit = 0;
    let ene = 0;
    let kwa = 0;
    let tot = 0;

    for (const m of displayedMonths) {
      gas += m.gastoGasolina;
      lit += m.litrosGasolina;
      ene += m.gastoEnergia;
      kwa += m.kwaEnergia;
      tot += m.totalGasto;
    }

    const percGas = tot > 0 ? (gas / tot) * 100 : 0;
    const percEne = tot > 0 ? (ene / tot) * 100 : 0;

    return { gas, lit, ene, kwa, tot, percGas, percEne };
  }, [displayedMonths]);

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Controles */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Alternador de Métrica (R$ vs Litros/kWh) */}
        <div className="flex bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-300/60 dark:border-slate-700 text-xs">
          <button
            onClick={() => setSelectedMetric('valor')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              selectedMetric === 'valor'
                ? 'bg-[#ff6200] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Valores (R$)
          </button>
          <button
            onClick={() => setSelectedMetric('volume')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              selectedMetric === 'volume'
                ? 'bg-[#ff6200] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Volume (L / kWh)
          </button>
        </div>

        {/* Controles de Filtro de Ano e Ordenação de Data */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Botão de Ordenação de Data (Decrescente / Crescente) */}
          <div className="flex bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setSortOrder('desc')}
              className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
                sortOrder === 'desc'
                  ? 'bg-[#ff6200] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Mais recentes primeiro (padrão)"
            >
              <ArrowDownWideNarrow className="w-3.5 h-3.5" />
              <span>Mais Recentes</span>
            </button>
            <button
              onClick={() => setSortOrder('asc')}
              className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
                sortOrder === 'asc'
                  ? 'bg-[#ff6200] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Mais antigos primeiro"
            >
              <ArrowUpNarrowWide className="w-3.5 h-3.5" />
              <span>Mais Antigos</span>
            </button>
          </div>

          {/* Filtro de Ano */}
          {availableYears.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedYear}
                onChange={(e) =>
                  setSelectedYear(e.target.value === 'todos' ? 'todos' : Number(e.target.value))
                }
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#ff6200]"
              >
                <option value="todos">Todos os Anos</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Ano {yr}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Cards de Resumo Agregado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Geral */}
        <div className="iaz-card p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wide text-slate-500 font-bold">
              Gasto Total
            </span>
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-[#ff6200]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            {hideValues ? '••••' : formatCurrency(totals.tot)}
          </div>
          <p className="text-[10px] text-slate-500">
            {displayedMonths.length} {displayedMonths.length === 1 ? 'mês apurado' : 'meses apurados'}
          </p>
        </div>

        {/* Combustível */}
        <div className="iaz-card p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wide text-slate-500 font-bold">
              Combustível
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            {hideValues ? '••••' : formatCurrency(totals.gas)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{formatNumber(totals.lit, 1)} L</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {formatNumber(totals.percGas, 0)}% do total
            </span>
          </div>
        </div>

        {/* Energia */}
        <div className="iaz-card p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wide text-slate-500 font-bold">
              Energia Elétrica
            </span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            {hideValues ? '••••' : formatCurrency(totals.ene)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{formatNumber(totals.kwa, 1)} kWh</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {formatNumber(totals.percEne, 0)}% do total
            </span>
          </div>
        </div>
      </div>

      {/* Gráfico Comparativo Mês a Mês */}
      <div className="iaz-card p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-[#ff6200]">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {selectedMetric === 'valor'
                  ? 'Evolução Mensal de Gastos (R$)'
                  : 'Consumo Mensal (Litros vs kWh)'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Comparativo visual direto de combustível e energia
              </p>
            </div>
          </div>

          {/* Legenda */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-500" />
              <span className="text-slate-600 dark:text-slate-400 font-medium">Combustível</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-blue-600" />
              <span className="text-slate-600 dark:text-slate-400 font-medium">Energia</span>
            </div>
          </div>
        </div>

        {displayedMonths.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Nenhum dado registrado para o período selecionado.
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Lista de Barras Proporcionais Mês a Mês */}
            {displayedMonths.map((m) => {
              const maxRef = selectedMetric === 'valor' ? maxGasto : maxVolume;

              const valGas = selectedMetric === 'valor' ? m.gastoGasolina : m.litrosGasolina;
              const valEne = selectedMetric === 'valor' ? m.gastoEnergia : m.kwaEnergia;

              const widthGas = Math.max(3, Math.min(100, (valGas / maxRef) * 100));
              const widthEne = Math.max(3, Math.min(100, (valEne / maxRef) * 100));

              return (
                <div
                  key={m.key}
                  className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2 hover:border-[#ff6200]/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900">{m.label}</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {hideValues ? '••••' : formatCurrency(m.totalGasto)}
                    </span>
                  </div>

                  {/* Barra Gasolina */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Fuel className="w-3 h-3 text-amber-500" /> Gasolina:
                      </span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {hideValues
                          ? '••••'
                          : selectedMetric === 'valor'
                          ? formatCurrency(m.gastoGasolina)
                          : `${formatNumber(m.litrosGasolina, 1)} L`}
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${widthGas}%` }}
                      />
                    </div>
                  </div>

                  {/* Barra Energia */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Energia:
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {hideValues
                          ? '••••'
                          : selectedMetric === 'valor'
                          ? formatCurrency(m.gastoEnergia)
                          : `${formatNumber(m.kwaEnergia, 1)} kWh`}
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${widthEne}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tabela Detalhada com Estatísticas */}
      {displayedMonths.length > 0 && (
        <div className="iaz-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wide text-slate-500 font-bold">
              Detalhamento Mensal
            </span>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
                  <th
                    className="pb-2 font-bold cursor-pointer hover:text-[#ff6200] transition-colors"
                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                    title="Alternar ordenação"
                  >
                    <span className="flex items-center gap-1">
                      Mês/Ano
                      {sortOrder === 'desc' ? (
                        <ArrowDownWideNarrow className="w-3 h-3 text-[#ff6200]" />
                      ) : (
                        <ArrowUpNarrowWide className="w-3 h-3 text-[#ff6200]" />
                      )}
                    </span>
                  </th>
                  <th className="pb-2 font-bold text-right">Gasolina (R$)</th>
                  <th className="pb-2 font-bold text-right">Litros</th>
                  <th className="pb-2 font-bold text-right">Energia (R$)</th>
                  <th className="pb-2 font-bold text-right">kWh</th>
                  <th className="pb-2 font-bold text-right">Total (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {displayedMonths.map((m) => (
                  <tr key={m.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">{m.label}</td>
                    <td className="py-2.5 text-right font-medium text-amber-600 dark:text-amber-400">
                      {hideValues ? '••••' : formatCurrency(m.gastoGasolina)}
                    </td>
                    <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">
                      {formatNumber(m.litrosGasolina, 1)} L
                    </td>
                    <td className="py-2.5 text-right font-medium text-blue-600 dark:text-blue-400">
                      {hideValues ? '••••' : formatCurrency(m.gastoEnergia)}
                    </td>
                    <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">
                      {formatNumber(m.kwaEnergia, 1)} kWh
                    </td>
                    <td className="py-2.5 text-right font-extrabold text-slate-900 dark:text-slate-100">
                      {hideValues ? '••••' : formatCurrency(m.totalGasto)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default GraficosScreen;
