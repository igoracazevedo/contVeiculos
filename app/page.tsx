'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Veiculo, Abastecimento, Recarga } from '@/types/database';
import {
  formatCurrency,
  formatNumber,
  calcularMediaKmL,
  formatDateBR,
  parseDate,
} from '@/lib/utils';
import { BottomNav, NavTab } from '@/components/BottomNav';
import { CarCard } from '@/components/CarCard';
import { HierarquiaAnoMes } from '@/components/HierarquiaAnoMes';
import { FormVeiculo } from '@/components/FormVeiculo';
import { FormAbastecimento } from '@/components/FormAbastecimento';
import { FormRecarga } from '@/components/FormRecarga';
import {
  Fuel,
  Zap,
  Dumbbell,
  Plus,
  RefreshCw,
  Car,
  TrendingUp,
  Clock,
  Layers,
  Sparkles,
  AlertCircle,
  X,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<NavTab>('inicio');

  // Dados do banco Supabase
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
  const [recargas, setRecargas] = useState<Recarga[]>([]);

  // Filtro de veículo selecionado (null = todos)
  const [selectedPlaca, setSelectedPlaca] = useState<string | null>(null);

  // Estados de controle de UI
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modais de Criação e Edição
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Veiculo | null>(null);

  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [fuelToEdit, setFuelToEdit] = useState<Abastecimento | null>(null);

  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [rechargeToEdit, setRechargeToEdit] = useState<Recarga | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Carregar dados do Supabase
  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError(null);

      const [vRes, aRes, rRes] = await Promise.all([
        supabase.from('veiculos').select('*').order('created_at', { ascending: false }),
        supabase.from('abastecimentos').select('*').order('created_at', { ascending: false }),
        supabase.from('recargas').select('*').order('created_at', { ascending: false }),
      ]);

      if (vRes.error) throw new Error(`Erro ao carregar veículos: ${vRes.error.message}`);
      if (aRes.error) throw new Error(`Erro ao carregar abastecimentos: ${aRes.error.message}`);
      if (rRes.error) throw new Error(`Erro ao carregar recargas: ${rRes.error.message}`);

      setVeiculos(vRes.data || []);
      setAbastecimentos(aRes.data || []);
      setRecargas(rRes.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Falha ao carregar dados do Supabase.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
  };

  // Filtragem por placa caso selecionado
  const filteredAbastecimentos = useMemo(() => {
    if (!selectedPlaca) return abastecimentos;
    return abastecimentos.filter((a) => a.placa === selectedPlaca);
  }, [abastecimentos, selectedPlaca]);

  const filteredRecargas = useMemo(() => {
    if (!selectedPlaca) return recargas;
    return recargas.filter((r) => r.placa === selectedPlaca);
  }, [recargas, selectedPlaca]);

  // Recargas da Academia
  const recargasAcademia = useMemo(() => {
    return filteredRecargas.filter((r) => r.academia === true);
  }, [filteredRecargas]);

  // Totais Gerais
  const totalGastoGasolina = useMemo(() => {
    return filteredAbastecimentos.reduce((acc, cur) => acc + (Number(cur.valor) || 0), 0);
  }, [filteredAbastecimentos]);

  const totalLitrosGasolina = useMemo(() => {
    return filteredAbastecimentos.reduce((acc, cur) => acc + (Number(cur.litros) || 0), 0);
  }, [filteredAbastecimentos]);

  const totalGastoEnergia = useMemo(() => {
    return filteredRecargas.reduce((acc, cur) => acc + (Number(cur.valor) || 0), 0);
  }, [filteredRecargas]);

  const totalKwaEnergia = useMemo(() => {
    return filteredRecargas.reduce((acc, cur) => acc + (Number(cur.kwa) || 0), 0);
  }, [filteredRecargas]);

  const totalGeral = totalGastoGasolina + totalGastoEnergia;

  // Média Geral de Consumo Ponderada dos Abastecimentos Atuais
  const mediaGeralKmL = useMemo(() => {
    return calcularMediaKmL(filteredAbastecimentos);
  }, [filteredAbastecimentos]);

  // Academia: Quantidade de Idas e Valor Total (Idas × R$ 60,00)
  const totalIdasAcademia = recargasAcademia.length;
  const valorTotalAcademia = totalIdasAcademia * 60;

  // Atividades Recentes (combinação dos últimos 5 registros)
  const recentActivity = useMemo(() => {
    const list: Array<
      | { type: 'gasolina'; data: Abastecimento; time: number }
      | { type: 'energia'; data: Recarga; time: number }
    > = [];

    for (const a of abastecimentos) {
      list.push({
        type: 'gasolina',
        data: a,
        time: parseDate(a.data_hora || a.data).getTime(),
      });
    }

    for (const r of recargas) {
      list.push({
        type: 'energia',
        data: r,
        time: parseDate(r.data_hora || r.data).getTime(),
      });
    }

    list.sort((a, b) => b.time - a.time);
    return list.slice(0, 4);
  }, [abastecimentos, recargas]);

  // Operações de CRUD com Supabase
  // 1. Veículo
  const handleSaveVeiculo = async (data: Partial<Veiculo>, isEdit: boolean) => {
    if (isEdit) {
      const { error } = await supabase
        .from('veiculos')
        .update({
          marca: data.marca,
          modelo: data.modelo,
          foto: data.foto,
        })
        .eq('placa', data.placa as string);
      if (error) throw error;
      showToast('Veículo atualizado com sucesso!');
    } else {
      const { error } = await supabase.from('veiculos').insert([
        {
          placa: data.placa as string,
          marca: data.marca as string,
          modelo: data.modelo as string,
          foto: data.foto,
        },
      ]);
      if (error) throw error;
      showToast('Veículo cadastrado com sucesso!');
    }
    await fetchData(true);
  };

  const handleDeleteVeiculo = async (placa: string) => {
    const { error } = await supabase.from('veiculos').delete().eq('placa', placa);
    if (error) throw error;
    if (selectedPlaca === placa) setSelectedPlaca(null);
    showToast(`Veículo ${placa} excluído.`);
    await fetchData(true);
  };

  // 2. Abastecimento
  const handleSaveAbastecimento = async (data: Partial<Abastecimento>, isEdit: boolean) => {
    if (isEdit && data.id) {
      const { error } = await supabase
        .from('abastecimentos')
        .update({
          placa: data.placa,
          data_hora: data.data_hora,
          data: data.data,
          km: data.km,
          litros: data.litros,
          valor: data.valor,
          tipo_gasolina: data.tipo_gasolina,
          local: data.local,
        })
        .eq('id', data.id);
      if (error) throw error;
      showToast('Abastecimento atualizado!');
    } else {
      const { error } = await supabase.from('abastecimentos').insert([
        {
          placa: data.placa as string,
          data_hora: data.data_hora as string,
          data: data.data as string,
          km: data.km as number,
          litros: data.litros as number,
          valor: data.valor as number,
          tipo_gasolina: data.tipo_gasolina as any,
          local: data.local,
        },
      ]);
      if (error) throw error;
      showToast('Abastecimento registrado com sucesso!');
    }
    await fetchData(true);
  };

  const handleDeleteAbastecimento = async (id: string) => {
    const { error } = await supabase.from('abastecimentos').delete().eq('id', id);
    if (error) throw error;
    showToast('Abastecimento excluído.');
    await fetchData(true);
  };

  // 3. Recarga
  const handleSaveRecarga = async (data: Partial<Recarga>, isEdit: boolean) => {
    if (isEdit && data.id) {
      const { error } = await supabase
        .from('recargas')
        .update({
          placa: data.placa,
          data_hora: data.data_hora,
          data: data.data,
          perc_inicial: data.perc_inicial,
          perc_final: data.perc_final,
          kwa: data.kwa,
          valor: data.valor,
          local: data.local,
          academia: data.academia,
        })
        .eq('id', data.id);
      if (error) throw error;
      showToast('Recarga atualizada com sucesso!');
    } else {
      const { error } = await supabase.from('recargas').insert([
        {
          placa: data.placa as string,
          data_hora: data.data_hora as string,
          data: data.data as string,
          perc_inicial: data.perc_inicial as number,
          perc_final: data.perc_final as number,
          kwa: data.kwa as number,
          valor: data.valor as number,
          local: data.local,
          academia: data.academia ?? false,
        },
      ]);
      if (error) throw error;
      showToast('Recarga registrada com sucesso!');
    }
    await fetchData(true);
  };

  const handleDeleteRecarga = async (id: string) => {
    const { error } = await supabase.from('recargas').delete().eq('id', id);
    if (error) throw error;
    showToast('Recarga excluída.');
    await fetchData(true);
  };

  return (
    <main className="max-w-md mx-auto min-h-screen pb-28 px-4 pt-3 select-none">
      {/* Toast de Notificação */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto animate-in slide-in-from-top duration-200">
          <div className="bg-emerald-500/90 text-slate-950 font-semibold text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-950 flex-shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header Superior Mobile */}
      <header className="flex items-center justify-between pb-3 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1">
              IazGas <span className="text-sky-400">&</span> Energia
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Gestão de frotas, combustível e recargas
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all active:scale-95"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>
          <button
            onClick={() => {
              setVehicleToEdit(null);
              setIsVehicleModalOpen(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-400 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Veículo</span>
          </button>
        </div>
      </header>

      {/* Barra de Filtro de Veículo (quando há mais de um veículo) */}
      {veiculos.length > 0 && (
        <div className="py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedPlaca(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedPlaca === null
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            Todos os Veículos ({veiculos.length})
          </button>
          {veiculos.map((v) => (
            <button
              key={v.placa}
              onClick={() => setSelectedPlaca(v.placa === selectedPlaca ? null : v.placa)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${
                selectedPlaca === v.placa
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="font-mono">{v.placa}</span>
              <span className="text-[10px] opacity-75 truncate max-w-[80px]">{v.modelo}</span>
            </button>
          ))}
        </div>
      )}

      {/* Mensagem de Erro de Conexão */}
      {error && (
        <div className="my-3 p-3.5 rounded-2xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchData()}
            className="px-2.5 py-1 bg-red-800/80 hover:bg-red-700 text-white rounded-lg text-[11px] font-semibold"
          >
            Tentar de novo
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4 py-4 animate-pulse">
          <div className="h-44 bg-slate-900 rounded-2xl border border-slate-800/60" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-20 bg-slate-900 rounded-2xl border border-slate-800/60" />
            <div className="h-20 bg-slate-900 rounded-2xl border border-slate-800/60" />
          </div>
          <div className="h-32 bg-slate-900 rounded-2xl border border-slate-800/60" />
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL DAS ABAS */}
      {!loading && (
        <div className="pt-2 space-y-4">
          {/* =========================================================================
              ABA 1: INÍCIO (DASHBOARD & CARROS)
             ========================================================================= */}
          {activeTab === 'inicio' && (
            <div className="space-y-4">
              {/* Seção Veículos */}
              <div className="space-y-3">
                {veiculos.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
                    <Car className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <h3 className="font-bold text-slate-300 text-sm">Nenhum veículo cadastrado</h3>
                    <p className="text-xs text-slate-500 mt-1 mb-3">
                      Cadastre o seu primeiro carro para começar a registrar abastecimentos e recargas.
                    </p>
                    <button
                      onClick={() => {
                        setVehicleToEdit(null);
                        setIsVehicleModalOpen(true);
                      }}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
                    >
                      Cadastrar Primeiro Veículo
                    </button>
                  </div>
                ) : (
                  veiculos
                    .filter((v) => !selectedPlaca || v.placa === selectedPlaca)
                    .map((v) => (
                      <CarCard
                        key={v.placa}
                        veiculo={v}
                        abastecimentos={abastecimentos}
                        recargas={recargas}
                        isSelected={selectedPlaca === v.placa}
                        onSelect={() =>
                          setSelectedPlaca(selectedPlaca === v.placa ? null : v.placa)
                        }
                        onEdit={(veic) => {
                          setVehicleToEdit(veic);
                          setIsVehicleModalOpen(true);
                        }}
                        onDelete={handleDeleteVeiculo}
                      />
                    ))
                )}
              </div>

              {/* Visão Geral do Investimento */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/90 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400">Total Investido</span>
                      <h3 className="text-2xl font-black text-white leading-tight">
                        {formatCurrency(totalGeral)}
                      </h3>
                    </div>
                  </div>
                  {mediaGeralKmL !== null && (
                    <div className="text-right bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Média Global</span>
                      <span className="text-xs font-bold text-sky-400">
                        {formatNumber(mediaGeralKmL, 2)} km/l
                      </span>
                    </div>
                  )}
                </div>

                {/* Sub-cards Gasolina, Energia e Academia */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                  <div
                    onClick={() => setActiveTab('gasolina')}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 cursor-pointer hover:border-amber-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-1 text-amber-400 mb-0.5 font-semibold text-[11px]">
                      <Fuel className="w-3 h-3" />
                      <span>Gasolina</span>
                    </div>
                    <p className="font-bold text-slate-100">{formatCurrency(totalGastoGasolina)}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {formatNumber(totalLitrosGasolina, 1)} L
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveTab('energia')}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 cursor-pointer hover:border-emerald-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-1 text-emerald-400 mb-0.5 font-semibold text-[11px]">
                      <Zap className="w-3 h-3" />
                      <span>Energia</span>
                    </div>
                    <p className="font-bold text-slate-100">{formatCurrency(totalGastoEnergia)}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {formatNumber(totalKwaEnergia, 1)} kWh
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveTab('academia')}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 cursor-pointer hover:border-purple-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-1 text-purple-400 mb-0.5 font-semibold text-[11px]">
                      <Dumbbell className="w-3 h-3" />
                      <span>Academia</span>
                    </div>
                    <p className="font-bold text-purple-200">
                      {totalIdasAcademia} {totalIdasAcademia === 1 ? 'ida' : 'idas'}
                    </p>
                    <p className="text-[10px] text-purple-400 font-semibold mt-0.5">
                      {formatCurrency(valorTotalAcademia)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Feed de Atividades Recentes */}
              {recentActivity.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Últimos Lançamentos
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {recentActivity.map((act, index) => {
                      if (act.type === 'gasolina') {
                        const a = act.data as Abastecimento;
                        return (
                          <div
                            key={a.id || index}
                            onClick={() => {
                              setFuelToEdit(a);
                              setIsFuelModalOpen(true);
                            }}
                            className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                                <Fuel className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white">Gasolina {a.tipo_gasolina}</span>
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                                    {a.placa}
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-400 block mt-0.5">
                                  {formatDateBR(a.data_hora || a.data)} • {formatNumber(a.litros, 2)} L
                                </span>
                              </div>
                            </div>
                            <span className="font-bold text-emerald-400">
                              {formatCurrency(a.valor)}
                            </span>
                          </div>
                        );
                      } else {
                        const r = act.data as Recarga;
                        return (
                          <div
                            key={r.id || index}
                            onClick={() => {
                              setRechargeToEdit(r);
                              setIsRechargeModalOpen(true);
                            }}
                            className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`p-2 rounded-lg ${
                                  r.academia
                                    ? 'bg-purple-500/10 text-purple-400'
                                    : 'bg-emerald-500/10 text-emerald-400'
                                }`}
                              >
                                {r.academia ? (
                                  <Dumbbell className="w-4 h-4" />
                                ) : (
                                  <Zap className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white">
                                    Recarga {r.perc_inicial}% → {r.perc_final}%
                                  </span>
                                  {r.academia && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                                      Academia
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-400 block mt-0.5">
                                  {formatDateBR(r.data_hora || r.data)} • {formatNumber(r.kwa, 2)} kWh
                                </span>
                              </div>
                            </div>
                            <span className="font-bold text-slate-200">
                              {formatCurrency(r.valor)}
                            </span>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              ABA 2: GASOLINA (HISTÓRICO HIERÁRQUICO ANO -> MÊS -> DETALHES)
             ========================================================================= */}
          {activeTab === 'gasolina' && (
            <div className="space-y-3.5">
              {/* Header do Módulo */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Fuel className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider font-bold">Gasolina</span>
                  </div>
                  <h3 className="text-2xl font-black text-white mt-1">
                    {formatCurrency(totalGastoGasolina)}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span>{formatNumber(totalLitrosGasolina, 2)} Litros</span>
                    <span>•</span>
                    <span>{filteredAbastecimentos.length} abastecimentos</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setFuelToEdit(null);
                    setIsFuelModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95 shadow-md shadow-amber-500/20"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Abastecer</span>
                </button>
              </div>

              {/* Acordeom de 2 Níveis */}
              <HierarquiaAnoMes
                mode="gasolina"
                abastecimentos={filteredAbastecimentos}
                onEditAbastecimento={(item) => {
                  setFuelToEdit(item);
                  setIsFuelModalOpen(true);
                }}
                onDeleteAbastecimento={handleDeleteAbastecimento}
              />
            </div>
          )}

          {/* =========================================================================
              ABA 3: ENERGIA (RECARGAS GERAIS COM DESTAQUE ACADEMIA)
             ========================================================================= */}
          {activeTab === 'energia' && (
            <div className="space-y-3.5">
              {/* Header do Módulo */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider font-bold">
                      Recargas Elétricas
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white mt-1">
                    {formatCurrency(totalGastoEnergia)}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span>{formatNumber(totalKwaEnergia, 2)} kWh</span>
                    <span>•</span>
                    <span>{filteredRecargas.length} recargas</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setRechargeToEdit(null);
                    setIsRechargeModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95 shadow-md shadow-emerald-500/20"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Recarregar</span>
                </button>
              </div>

              {/* Acordeom de 2 Níveis */}
              <HierarquiaAnoMes
                mode="energia"
                recargas={filteredRecargas}
                onEditRecarga={(item) => {
                  setRechargeToEdit(item);
                  setIsRechargeModalOpen(true);
                }}
                onDeleteRecarga={handleDeleteRecarga}
              />
            </div>
          )}

          {/* =========================================================================
              ABA 4: ACADEMIA (RECARGAS FILTRADAS ACADEMIA = TRUE + R$ 60 POR IDA)
             ========================================================================= */}
          {activeTab === 'academia' && (
            <div className="space-y-3.5">
              {/* Header do Módulo Academia */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 border border-purple-800/60 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-purple-300">
                        Custo Estimado Academia
                      </span>
                      <h3 className="text-2xl font-black text-white leading-tight">
                        {formatCurrency(valorTotalAcademia)}
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setRechargeToEdit(null);
                      setIsRechargeModalOpen(true);
                    }}
                    className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95 shadow-md shadow-purple-600/30"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Nova Ida</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-purple-900/40">
                    <span className="text-[10px] text-slate-400 block">Total de Idas</span>
                    <span className="font-bold text-purple-300 text-sm">
                      {totalIdasAcademia} {totalIdasAcademia === 1 ? 'ida' : 'idas'}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">R$ 60,00 por ida</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-purple-900/40">
                    <span className="text-[10px] text-slate-400 block">Energia no Treino</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {formatNumber(
                        recargasAcademia.reduce((acc, c) => acc + (Number(c.kwa) || 0), 0),
                        2
                      )}{' '}
                      kWh
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Recargas conjugadas
                    </span>
                  </div>
                </div>
              </div>

              {/* Acordeom de 2 Níveis para Academia */}
              <HierarquiaAnoMes
                mode="academia"
                recargas={filteredRecargas}
                onEditRecarga={(item) => {
                  setRechargeToEdit(item);
                  setIsRechargeModalOpen(true);
                }}
                onDeleteRecarga={handleDeleteRecarga}
              />
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SPEED-DIAL / QUICK ADD MODAL AO CLICAR NO BOTÃO '+' CENTRAL
         ========================================================================= */}
      {isQuickAddOpen && (
        <div
          onClick={() => setIsQuickAddOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm p-4 flex flex-col justify-end pb-24 items-center animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-3xl p-3 shadow-2xl space-y-2 animate-in slide-in-from-bottom-6 duration-200"
          >
            <div className="flex items-center justify-between px-3 py-1 text-slate-400 text-xs font-semibold">
              <span>Novo Registro</span>
              <button
                onClick={() => setIsQuickAddOpen(false)}
                className="p-1 rounded-full hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Novo Abastecimento */}
            <button
              onClick={() => {
                setIsQuickAddOpen(false);
                setFuelToEdit(null);
                setIsFuelModalOpen(true);
              }}
              className="w-full p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 flex items-center gap-3 transition-colors text-left"
            >
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                <Fuel className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Novo Abastecimento</p>
                <p className="text-[10px] text-slate-400">Gasolina, aditivada ou podium</p>
              </div>
            </button>

            {/* Nova Recarga Elétrica */}
            <button
              onClick={() => {
                setIsQuickAddOpen(false);
                setRechargeToEdit(null);
                setIsRechargeModalOpen(true);
              }}
              className="w-full p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 flex items-center gap-3 transition-colors text-left"
            >
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Nova Recarga Elétrica</p>
                <p className="text-[10px] text-slate-400">kWh, porcentagens e academia</p>
              </div>
            </button>

            {/* Novo Veículo */}
            <button
              onClick={() => {
                setIsQuickAddOpen(false);
                setVehicleToEdit(null);
                setIsVehicleModalOpen(true);
              }}
              className="w-full p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 flex items-center gap-3 transition-colors text-left"
            >
              <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Cadastrar Veículo</p>
                <p className="text-[10px] text-slate-400">Placa, marca, modelo e foto</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Formulário Modal de Veículo */}
      <FormVeiculo
        isOpen={isVehicleModalOpen}
        veiculoToEdit={vehicleToEdit}
        onClose={() => {
          setIsVehicleModalOpen(false);
          setVehicleToEdit(null);
        }}
        onSave={handleSaveVeiculo}
        onDelete={handleDeleteVeiculo}
      />

      {/* Formulário Modal de Abastecimento */}
      <FormAbastecimento
        isOpen={isFuelModalOpen}
        abastecimentoToEdit={fuelToEdit}
        veiculos={veiculos}
        defaultPlaca={selectedPlaca || undefined}
        onClose={() => {
          setIsFuelModalOpen(false);
          setFuelToEdit(null);
        }}
        onSave={handleSaveAbastecimento}
        onDelete={handleDeleteAbastecimento}
      />

      {/* Formulário Modal de Recarga */}
      <FormRecarga
        isOpen={isRechargeModalOpen}
        recargaToEdit={rechargeToEdit}
        veiculos={veiculos}
        defaultPlaca={selectedPlaca || undefined}
        onClose={() => {
          setIsRechargeModalOpen(false);
          setRechargeToEdit(null);
        }}
        onSave={handleSaveRecarga}
        onDelete={handleDeleteRecarga}
      />

      {/* Barra de Navegação Inferior Fixa */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
      />
    </main>
  );
}
