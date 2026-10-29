'use client';

import React, { useState, useEffect } from 'react';
import { Recarga, Veiculo } from '@/types/database';
import {
  formatCurrency,
  formatNumber,
  dateToInputDateTime,
  formatToDbDate,
  formatToDbDateTime,
  formatCurrencyMask,
  parseCurrencyMask,
} from '@/lib/utils';
import {
  Zap,
  X,
  Save,
  Trash2,
  MapPin,
  Dumbbell,
  AlertCircle,
  Loader2,
  BatteryCharging,
} from 'lucide-react';

interface FormRecargaProps {
  recargaToEdit?: Recarga | null;
  veiculos: Veiculo[];
  defaultPlaca?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Recarga>, isEdit: boolean) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function FormRecarga({
  recargaToEdit,
  veiculos,
  defaultPlaca,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: FormRecargaProps) {
  const [placa, setPlaca] = useState('');
  const [dataHora, setDataHora] = useState('');
  const [percInicial, setPercInicial] = useState<string>('');
  const [percFinal, setPercFinal] = useState<string>('');
  const [kwa, setKwa] = useState<string>('');
  const [valorMasked, setValorMasked] = useState<string>('');
  const [local, setLocal] = useState('');
  const [academia, setAcademia] = useState(false);

  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Rastreamento para não perder dados digitados quando a janela/celular perde o foco
  const prevOpenRef = React.useRef(false);
  const editingIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    const justOpened = isOpen && !prevOpenRef.current;
    const editingChanged = (recargaToEdit?.id || null) !== editingIdRef.current;
    prevOpenRef.current = isOpen;

    if (!isOpen) return;

    if (justOpened || editingChanged) {
      editingIdRef.current = recargaToEdit?.id || null;
      if (recargaToEdit) {
        setPlaca(recargaToEdit.placa);
        setDataHora(dateToInputDateTime(recargaToEdit.data_hora || recargaToEdit.data));
        setPercInicial(String(recargaToEdit.perc_inicial ?? ''));
        setPercFinal(String(recargaToEdit.perc_final ?? ''));
        setKwa(String(recargaToEdit.kwa ?? ''));
        setValorMasked(
          recargaToEdit.valor !== undefined && recargaToEdit.valor !== null
            ? formatCurrencyMask(Math.round(recargaToEdit.valor * 100))
            : ''
        );
        setLocal(recargaToEdit.local || '');
        setAcademia(Boolean(recargaToEdit.academia));
      } else {
        const initialPlaca = defaultPlaca || (veiculos.length > 0 ? veiculos[0].placa : '');
        setPlaca(initialPlaca);
        setDataHora(dateToInputDateTime(new Date().toISOString()));
        setPercInicial('20');
        setPercFinal('100');
        setKwa('');
        setValorMasked('0,00');
        setLocal('');
        setAcademia(false);
      }
      setError(null);
      setShowConfirmDelete(false);
    }
  }, [recargaToEdit, isOpen]);

  if (!isOpen) return null;

  const isEdit = Boolean(recargaToEdit);

  // Verifica se o veículo selecionado possui o recurso de academia habilitado
  const selectedVehicle = veiculos.find((v) => v.placa === placa);
  const vehicleHasAcademia = Boolean(selectedVehicle?.tem_academia);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada pelo seu navegador.');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocal(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        setGettingLocation(false);
      },
      (err) => {
        console.warn('Erro ao obter localização:', err);
        alert('Não foi possível obter a localização atual.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = formatCurrencyMask(e.target.value);
    setValorMasked(masked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!placa) {
      setError('Selecione o veículo da recarga.');
      return;
    }

    const numInicial = parseFloat(percInicial.replace(',', '.'));
    const numFinal = parseFloat(percFinal.replace(',', '.'));
    const numKwa = parseFloat(kwa.replace(',', '.'));
    const numValor = parseCurrencyMask(valorMasked);

    if (isNaN(numInicial) || numInicial < 0 || numInicial > 100) {
      setError('A porcentagem inicial da bateria deve ser entre 0% e 100%.');
      return;
    }
    if (isNaN(numFinal) || numFinal < 0 || numFinal > 100) {
      setError('A porcentagem final da bateria deve ser entre 0% e 100%.');
      return;
    }
    if (numFinal < numInicial) {
      setError('A porcentagem final não pode ser menor que a inicial.');
      return;
    }
    if (isNaN(numKwa) || numKwa < 0) {
      setError('Informe a quantidade de kWh recarregada.');
      return;
    }

    const dateObj = new Date(dataHora || new Date().toISOString());

    try {
      setLoading(true);
      await onSave(
        {
          id: recargaToEdit?.id,
          placa,
          data_hora: formatToDbDateTime(dateObj),
          data: formatToDbDate(dateObj),
          perc_inicial: numInicial,
          perc_final: numFinal,
          kwa: numKwa,
          valor: numValor,
          local: local.trim() || null,
          // Se o veículo não tiver academia habilitada, salva false
          academia: vehicleHasAcademia ? academia : false,
        },
        isEdit
      );
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Erro ao registrar recarga.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!recargaToEdit || !onDelete) return;
    try {
      setLoading(true);
      await onDelete(recargaToEdit.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao excluir recarga.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#151f32] border border-slate-200/80 dark:border-[#293548] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabeçalho Topo Azul-Marinho IAZ */}
        <div className="bg-[#000d3c] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white">
                {isEdit ? 'Editar Recarga' : 'Nova Recarga Elétrica'}
              </h3>
              <p className="text-[11px] text-slate-300">
                {isEdit ? 'Atualize os dados da recarga' : 'LitroWatt IAZ • Gestão de Energia'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Veículo e Data */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Veículo *
              </label>
              <select
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#293548] bg-slate-50/50 dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#ff6200]"
              >
                {veiculos.map((v) => (
                  <option key={v.placa} value={v.placa}>
                    {v.placa} - {v.modelo}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Data e Hora *
              </label>
              <input
                type="datetime-local"
                value={dataHora}
                onChange={(e) => setDataHora(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#293548] bg-slate-50/50 dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#ff6200]"
              />
            </div>
          </div>

          {/* Bateria: % Inicial e % Final */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-[#293548] space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
              <BatteryCharging className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Nível da Bateria
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-medium">Bateria Inicial (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="20"
                  value={percInicial}
                  onChange={(e) => setPercInicial(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#ff6200]"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-medium">Bateria Final (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="100"
                  value={percFinal}
                  onChange={(e) => setPercFinal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#ff6200]"
                />
              </div>
            </div>
          </div>

          {/* Energia (kWh) e Valor Total (R$) com Máscara Brasileira */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Energia (kWh) *
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ex: 15,5"
                value={kwa}
                onChange={(e) => setKwa(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#293548] bg-slate-50/50 dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#ff6200]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Valor Total (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0,00"
                  value={valorMasked}
                  onChange={handleValorChange}
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-slate-200 dark:border-[#293548] bg-slate-50/50 dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#ff6200]"
                />
              </div>
            </div>
          </div>

          {/* Local da Recarga (input + datalist) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Local ou Coordenadas (Opcional)</span>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={gettingLocation}
                className="text-[11px] font-bold text-[#ff6200] hover:text-[#ec7000] flex items-center gap-1"
              >
                {gettingLocation ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <MapPin className="w-3 h-3" />
                )}
                <span>GPS Atual</span>
              </button>
            </label>
            <input
              type="text"
              list="locais-recarga"
              placeholder="Ex: Garagem Residencial, Estação de Recarga..."
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#293548] bg-slate-50/50 dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-[#ff6200]"
            />
            <datalist id="locais-recarga">
              <option value="Garagem Residencial" />
              <option value="Academia" />
              <option value="Posto Shell Recharge" />
              <option value="Shopping Center" />
              <option value="Trabalho / Escritório" />
            </datalist>
          </div>

          {/* CHECKBOX ACADEMIA: CONDICIONADO AO VEÍCULO SELECIONADO TER ACADEMIA HABILITADA */}
          {vehicleHasAcademia && (
            <div className="p-3.5 rounded-2xl bg-orange-50/60 dark:bg-[#1e293b] border border-orange-200/80 dark:border-[#293548] space-y-2 animate-in fade-in">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-xl ${
                      academia
                        ? 'bg-[#ff6200] text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                      Recarga na Academia
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Contabiliza idas e saldo da academia
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={academia}
                  onChange={(e) => setAcademia(e.target.checked)}
                  className="w-5 h-5 rounded-lg text-[#ff6200] focus:ring-[#ff6200] border-slate-300 dark:border-slate-600 cursor-pointer"
                />
              </label>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="pt-2 flex items-center justify-between gap-3">
            {isEdit && onDelete ? (
              showConfirmDelete ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-3 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(false)}
                    className="px-3 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="px-3 py-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-[#ff6200] hover:bg-[#ec7000] text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Salvando...' : 'Salvar Recarga'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FormRecarga;
