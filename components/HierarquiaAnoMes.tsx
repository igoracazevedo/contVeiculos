'use client';

import React, { useState, useMemo } from 'react';
import { Abastecimento, Recarga } from '@/types/database';
import {
  formatCurrency,
  formatNumber,
  formatDateBR,
  formatDateTimeBR,
  getMonthName,
  parseCoordinates,
  parseDate,
} from '@/lib/utils';
import { MiniMapa } from './MiniMapa';
import {
  ChevronDown,
  ChevronRight,
  Fuel,
  Zap,
  Dumbbell,
  Calendar,
  Edit2,
  Trash2,
  MapPin,
  Gauge,
  AlertCircle,
} from 'lucide-react';

interface HierarquiaAnoMesProps {
  mode: 'gasolina' | 'energia' | 'academia';
  abastecimentos?: Abastecimento[];
  recargas?: Recarga[];
  onEditAbastecimento?: (item: Abastecimento) => void;
  onDeleteAbastecimento?: (id: string) => void;
  onEditRecarga?: (item: Recarga) => void;
  onDeleteRecarga?: (id: string) => void;
  hideValues?: boolean;
}

interface YearGroup<T> {
  ano: number;
  totalValor: number;
  totalConsumo: number; // Litros para gasolina, kWh para energia
  totalCount: number;
  meses: MonthGroup<T>[];
}

interface MonthGroup<T> {
  mes: number;
  ano: number;
  totalValor: number;
  totalConsumo: number;
  totalCount: number;
  items: T[];
}

export function HierarquiaAnoMes({
  mode,
  abastecimentos = [],
  recargas = [],
  onEditAbastecimento,
  onDeleteAbastecimento,
  onEditRecarga,
  onDeleteRecarga,
  hideValues = false,
}: HierarquiaAnoMesProps) {
  // Estado para acordeom
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  // Item selecionado para confirmação de exclusão
  const [itemToDelete, setItemToDelete] = useState<{ id: string; tipo: 'gasolina' | 'energia' } | null>(null);

  const toggleYear = (ano: number) => {
    setExpandedYears((prev) => ({ ...prev, [ano]: !prev[ano] }));
  };

  const toggleMonth = (anoMesKey: string) => {
    setExpandedMonths((prev) => ({ ...prev, [anoMesKey]: !prev[anoMesKey] }));
  };

  // Processamento e Agrupamento Hierárquico
  const groupedData = useMemo(() => {
    if (mode === 'gasolina') {
      const items = [...abastecimentos].sort((a, b) => {
        const dateA = parseDate(a.data_hora || a.data).getTime();
        const dateB = parseDate(b.data_hora || b.data).getTime();
        return dateB - dateA;
      });

      const yearMap = new Map<number, Map<number, Abastecimento[]>>();

      for (const item of items) {
        const d = parseDate(item.data_hora || item.data);
        const ano = isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear();
        const mes = isNaN(d.getMonth()) ? new Date().getMonth() + 1 : d.getMonth() + 1;

        if (!yearMap.has(ano)) {
          yearMap.set(ano, new Map());
        }
        const monthMap = yearMap.get(ano)!;
        if (!monthMap.has(mes)) {
          monthMap.set(mes, []);
        }
        monthMap.get(mes)!.push(item);
      }

      const yearsArray: YearGroup<Abastecimento>[] = [];

      for (const [ano, monthMap] of Array.from(yearMap.entries())) {
        let anoValor = 0;
        let anoConsumo = 0;
        let anoCount = 0;
        const mesesArray: MonthGroup<Abastecimento>[] = [];

        for (const [mes, mItems] of Array.from(monthMap.entries())) {
          let mesValor = 0;
          let mesConsumo = 0;
          let mesCount = mItems.length;

          for (const item of mItems) {
            mesValor += Number(item.valor) || 0;
            mesConsumo += Number(item.litros) || 0;
          }

          anoValor += mesValor;
          anoConsumo += mesConsumo;
          anoCount += mesCount;

          mesesArray.push({
            mes,
            ano,
            totalValor: mesValor,
            totalConsumo: mesConsumo,
            totalCount: mesCount,
            items: mItems,
          });
        }

        mesesArray.sort((a, b) => b.mes - a.mes);

        yearsArray.push({
          ano,
          totalValor: anoValor,
          totalConsumo: anoConsumo,
          totalCount: anoCount,
          meses: mesesArray,
        });
      }

      return yearsArray.sort((a, b) => b.ano - a.ano);
    } else {
      // Modo energia ou academia
      const sourceList =
        mode === 'academia'
          ? recargas.filter((r) => r.academia === true)
          : recargas;

      const items = [...sourceList].sort((a, b) => {
        const dateA = parseDate(a.data_hora || a.data).getTime();
        const dateB = parseDate(b.data_hora || b.data).getTime();
        return dateB - dateA;
      });

      const yearMap = new Map<number, Map<number, Recarga[]>>();

      for (const item of items) {
        const d = parseDate(item.data_hora || item.data);
        const ano = isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear();
        const mes = isNaN(d.getMonth()) ? new Date().getMonth() + 1 : d.getMonth() + 1;

        if (!yearMap.has(ano)) {
          yearMap.set(ano, new Map());
        }
        const monthMap = yearMap.get(ano)!;
        if (!monthMap.has(mes)) {
          monthMap.set(mes, []);
        }
        monthMap.get(mes)!.push(item);
      }

      const yearsArray: YearGroup<Recarga>[] = [];

      for (const [ano, monthMap] of Array.from(yearMap.entries())) {
        let anoValor = 0;
        let anoConsumo = 0;
        let anoCount = 0;
        const mesesArray: MonthGroup<Recarga>[] = [];

        for (const [mes, mItems] of Array.from(monthMap.entries())) {
          let mesValor = 0;
          let mesConsumo = 0;
          let mesCount = mItems.length;

          for (const item of mItems) {
            mesValor += Number(item.valor) || 0;
            mesConsumo += Number(item.kwa) || 0;
          }

          anoValor += mesValor;
          anoConsumo += mesConsumo;
          anoCount += mesCount;

          mesesArray.push({
            mes,
            ano,
            totalValor: mesValor,
            totalConsumo: mesConsumo,
            totalCount: mesCount,
            items: mItems,
          });
        }

        mesesArray.sort((a, b) => b.mes - a.mes);

        yearsArray.push({
          ano,
          totalValor: anoValor,
          totalConsumo: anoConsumo,
          totalCount: anoCount,
          meses: mesesArray,
        });
      }

      return yearsArray.sort((a, b) => b.ano - a.ano);
    }
  }, [mode, abastecimentos, recargas]);

  if (groupedData.length === 0) {
    return (
      <div className="py-12 px-4 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-500 mb-3">
          {mode === 'gasolina' && <Fuel className="w-6 h-6 text-amber-500" />}
          {mode === 'energia' && <Zap className="w-6 h-6 text-blue-600" />}
          {mode === 'academia' && <Dumbbell className="w-6 h-6 text-[#ff6200]" />}
        </div>
        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Nenhum registro encontrado</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          {mode === 'gasolina' && 'Não há abastecimentos cadastrados para este filtro.'}
          {mode === 'energia' && 'Não há recargas elétricas cadastradas para este filtro.'}
          {mode === 'academia' && 'Nenhuma recarga vinculada à academia foi encontrada.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groupedData.map((yearGroup) => {
        const isYearOpen = !!expandedYears[yearGroup.ano];

        return (
          <div
            key={yearGroup.ano}
            className="iaz-card overflow-hidden transition-all"
          >
            {/* NÍVEL 1: ANO */}
            <button
              onClick={() => toggleYear(yearGroup.ano)}
              className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#151f32] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-500/10 text-[#ff6200]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                    Ano {yearGroup.ano}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>
                      {yearGroup.totalCount}{' '}
                      {yearGroup.totalCount === 1 ? 'lançamento' : 'lançamentos'}
                    </span>
                    <span>•</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {formatNumber(yearGroup.totalConsumo, 2)}{' '}
                      {mode === 'gasolina' ? 'L' : 'kWh'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-extrabold text-[#ff6200]">
                    {hideValues ? '••••' : formatCurrency(yearGroup.totalValor)}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Ano</p>
                </div>
                {isYearOpen ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>

            {/* NÍVEL 2: MESES */}
            {isYearOpen && (
              <div className="p-3 pt-1 space-y-2.5 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800">
                {yearGroup.meses.map((monthGroup) => {
                  const monthKey = `${yearGroup.ano}-${monthGroup.mes}`;
                  const isMonthOpen = !!expandedMonths[monthKey];
                  const nomeMes = getMonthName(monthGroup.mes);

                  // Regra Seção Academia: valor mensal por quantidade de idas × R$ 60,00
                  const valorAcademia = monthGroup.totalCount * 60;

                  return (
                    <div
                      key={monthKey}
                      className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#151f32] overflow-hidden"
                    >
                      {/* HEADER DO MÊS */}
                      <button
                        onClick={() => toggleMonth(monthKey)}
                        className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              mode === 'gasolina'
                                ? 'bg-amber-500'
                                : mode === 'energia'
                                ? 'bg-blue-600'
                                : 'bg-[#ff6200]'
                            }`}
                          />
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">{nomeMes}</h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <span>
                                {monthGroup.totalCount}{' '}
                                {mode === 'academia'
                                  ? monthGroup.totalCount === 1
                                    ? 'ida'
                                    : 'idas'
                                  : monthGroup.totalCount === 1
                                  ? 'registro'
                                  : 'registros'}
                              </span>
                              <span>•</span>
                              <span>
                                {formatNumber(monthGroup.totalConsumo, 2)}{' '}
                                {mode === 'gasolina' ? 'L' : 'kWh'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="text-right">
                            {mode === 'academia' ? (
                              <>
                                <p className="text-xs font-bold text-[#ff6200]">
                                  {hideValues ? '••••' : formatCurrency(valorAcademia)}
                                </p>
                                <p className="text-[10px] text-slate-500 font-medium">
                                  {monthGroup.totalCount} × R$ 60
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  {hideValues ? '••••' : formatCurrency(monthGroup.totalValor)}
                                </p>
                                <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Mês</p>
                              </>
                            )}
                          </div>
                          {isMonthOpen ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* NÍVEL 3: CARDS DE DETALHES */}
                      {isMonthOpen && (
                        <div className="p-3 pt-0 space-y-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
                          {/* Banner de resumo de academia no mês */}
                          {mode === 'academia' && (
                            <div className="mt-2.5 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 text-[#ff6200] font-bold">
                                <Dumbbell className="w-4 h-4" />
                                <span>Total Idas Academia:</span>
                              </div>
                              <span className="font-extrabold text-slate-900 dark:text-slate-100">
                                {monthGroup.totalCount} idas = {hideValues ? '••••' : formatCurrency(valorAcademia)}
                              </span>
                            </div>
                          )}

                          {monthGroup.items.map((rawItem: any) => {
                            if (mode === 'gasolina') {
                              const item = rawItem as Abastecimento;
                              const precoPorLitro =
                                item.litros > 0 ? item.valor / item.litros : 0;
                              const coords = parseCoordinates(item.local);

                              return (
                                <div
                                  key={item.id}
                                  className="p-3 rounded-2xl bg-white dark:bg-[#151f32] border border-slate-200/70 dark:border-slate-800 hover:border-[#ff6200]/40 transition-all space-y-2.5"
                                >
                                  {/* Cabeçalho do Card */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold uppercase border border-slate-200 dark:border-slate-700">
                                        {item.placa}
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                          item.tipo_gasolina === 'PODIUM'
                                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                            : item.tipo_gasolina === 'ADITIVADA'
                                            ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                        }`}
                                      >
                                        {item.tipo_gasolina}
                                      </span>
                                    </div>

                                    {/* Ações */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      {onEditAbastecimento && (
                                        <button
                                          onClick={() => onEditAbastecimento(item)}
                                          className="p-1.5 text-slate-400 hover:text-[#ff6200] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                          title="Editar"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                      {onDeleteAbastecimento && (
                                        <button
                                          onClick={() =>
                                            setItemToDelete({ id: item.id, tipo: 'gasolina' })
                                          }
                                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                          title="Excluir"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Dados Principais */}
                                  <div className="grid grid-cols-3 gap-2 py-1 text-center bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2 border border-slate-100 dark:border-slate-800/60">
                                    <div>
                                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Litros</span>
                                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        {formatNumber(item.litros, 2)} L
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Preço/L</span>
                                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        {hideValues ? '••••' : formatCurrency(precoPorLitro)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Total</span>
                                      <span className="text-xs font-extrabold text-[#ff6200]">
                                        {hideValues ? '••••' : formatCurrency(item.valor)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Informações Secundárias */}
                                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                                    <div className="flex items-center gap-1">
                                      <Gauge className="w-3 h-3 text-slate-400" />
                                      <span>{formatNumber(item.km, 0)} km</span>
                                    </div>
                                    <span>{formatDateTimeBR(item.data_hora || item.data)}</span>
                                  </div>

                                  {/* Local e Mini-Mapa OpenStreetMap */}
                                  {item.local && (
                                    <div>
                                      {!coords && (
                                        <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                                          <MapPin className="w-3 h-3 text-[#ff6200] flex-shrink-0" />
                                          <span className="truncate">{item.local}</span>
                                        </div>
                                      )}
                                      {coords && (
                                        <MiniMapa
                                          lat={coords.lat}
                                          lng={coords.lng}
                                          localName={item.local}
                                        />
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            } else {
                              // Modo Energia ou Academia
                              const item = rawItem as Recarga;
                              const coords = parseCoordinates(item.local);

                              return (
                                <div
                                  key={item.id}
                                  className="p-3 rounded-2xl bg-white dark:bg-[#151f32] border border-slate-200/70 dark:border-slate-800 hover:border-[#ff6200]/40 transition-all space-y-2.5"
                                >
                                  {/* Cabeçalho do Card */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold uppercase border border-slate-200 dark:border-slate-700">
                                        {item.placa}
                                      </span>
                                      {item.academia && (
                                        <span className="bg-[#ff6200]/10 text-[#ff6200] border border-[#ff6200]/30 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                          <Dumbbell className="w-2.5 h-2.5" />
                                          Academia
                                        </span>
                                      )}
                                    </div>

                                    {/* Ações */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      {onEditRecarga && (
                                        <button
                                          onClick={() => onEditRecarga(item)}
                                          className="p-1.5 text-slate-400 hover:text-[#ff6200] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                          title="Editar"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                      {onDeleteRecarga && (
                                        <button
                                          onClick={() =>
                                            setItemToDelete({ id: item.id, tipo: 'energia' })
                                          }
                                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                          title="Excluir"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Dados Principais */}
                                  <div className="grid grid-cols-3 gap-2 py-1 text-center bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2 border border-slate-100 dark:border-slate-800/60">
                                    <div>
                                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Bateria</span>
                                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        {item.perc_inicial}% → {item.perc_final}%
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Energia</span>
                                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                        {formatNumber(item.kwa, 2)} kWh
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Valor</span>
                                      <span className="text-xs font-extrabold text-[#ff6200]">
                                        {hideValues ? '••••' : formatCurrency(item.valor)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Informações Secundárias */}
                                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                                    <span className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
                                      <Zap className="w-3 h-3" />
                                      Carga: +{Math.max(0, (item.perc_final || 0) - (item.perc_inicial || 0))}%
                                    </span>
                                    <span>{formatDateTimeBR(item.data_hora || item.data)}</span>
                                  </div>

                                  {/* Local e Mini-Mapa OpenStreetMap */}
                                  {item.local && (
                                    <div>
                                      {!coords && (
                                        <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                                          <MapPin className="w-3 h-3 text-[#ff6200] flex-shrink-0" />
                                          <span className="truncate">{item.local}</span>
                                        </div>
                                      )}
                                      {coords && (
                                        <MiniMapa
                                          lat={coords.lat}
                                          lng={coords.lng}
                                          localName={item.local}
                                        />
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Modal de confirmação de exclusão */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in">
          <div className="bg-white dark:bg-[#151f32] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-sm w-full text-center shadow-2xl space-y-4">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Confirmar exclusão</h4>
              <p className="text-xs text-slate-500 mt-1">
                Deseja realmente excluir este registro? Essa operação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (itemToDelete.tipo === 'gasolina' && onDeleteAbastecimento) {
                    onDeleteAbastecimento(itemToDelete.id);
                  } else if (itemToDelete.tipo === 'energia' && onDeleteRecarga) {
                    onDeleteRecarga(itemToDelete.id);
                  }
                  setItemToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HierarquiaAnoMes;
