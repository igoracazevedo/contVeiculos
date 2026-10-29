'use client';

import React, { useState, useEffect } from 'react';
import { Abastecimento, TipoGasolina, Veiculo } from '@/types/database';
import {
  formatCurrency,
  formatNumber,
  dateToInputDateTime,
  formatToDbDate,
  formatToDbDateTime,
  formatCurrencyMask,
  parseCurrencyMask,
} from '@/lib/utils';
import { Fuel, X, Save, Trash2, MapPin, AlertCircle, Loader2, Gauge } from 'lucide-react';

interface FormAbastecimentoProps {
  abastecimentoToEdit?: Abastecimento | null;
  veiculos: Veiculo[];
  defaultPlaca?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Abastecimento>, isEdit: boolean) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function FormAbastecimento({
  abastecimentoToEdit,
  veiculos,
  defaultPlaca,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: FormAbastecimentoProps) {
  const [placa, setPlaca] = useState('');
  const [dataHora, setDataHora] = useState('');
  const [km, setKm] = useState<string>('');
  const [litros, setLitros] = useState<string>('');
  const [valorMasked, setValorMasked] = useState<string>('');
  const [tipoGasolina, setTipoGasolina] = useState<TipoGasolina>('COMUM');
  const [local, setLocal] = useState('');

  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (abastecimentoToEdit) {
      setPlaca(abastecimentoToEdit.placa);
      setDataHora(dateToInputDateTime(abastecimentoToEdit.data_hora || abastecimentoToEdit.data));
      setKm(String(abastecimentoToEdit.km || ''));
      setLitros(String(abastecimentoToEdit.litros || ''));
      setValorMasked(
        abastecimentoToEdit.valor !== undefined && abastecimentoToEdit.valor !== null
          ? formatCurrencyMask(Math.round(abastecimentoToEdit.valor * 100))
          : ''
      );
      setTipoGasolina(abastecimentoToEdit.tipo_gasolina || 'COMUM');
      setLocal(abastecimentoToEdit.local || '');
    } else {
      const initialPlaca = defaultPlaca || (veiculos.length > 0 ? veiculos[0].placa : '');
      setPlaca(initialPlaca);
      setDataHora(dateToInputDateTime(new Date().toISOString()));
      setKm('');
      setLitros('');
      setValorMasked('0,00');
      setTipoGasolina('COMUM');
      setLocal('');
    }
    setError(null);
    setShowConfirmDelete(false);
  }, [abastecimentoToEdit, isOpen, defaultPlaca, veiculos]);

  if (!isOpen) return null;

  const isEdit = Boolean(abastecimentoToEdit);

  // Preço por litro calculado em tempo real
  const numValor = parseCurrencyMask(valorMasked);
  const numLitros = parseFloat(litros.replace(',', '.')) || 0;
  const precoPorLitro = numLitros > 0 ? numValor / numLitros : 0;

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = formatCurrencyMask(e.target.value);
    setValorMasked(masked);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!placa) {
      setError('Selecione ou informe o veículo.');
      return;
    }

    const numKm = parseInt(km.replace(/\D/g, ''), 10);
    if (isNaN(numKm) || numKm <= 0) {
      setError('Informe a quilometragem atual do odômetro.');
      return;
    }
    if (isNaN(numLitros) || numLitros <= 0) {
      setError('Informe a quantidade de litros abastecida.');
      return;
    }
    if (numValor <= 0) {
      setError('Informe o valor total pago.');
      return;
    }

    const dateObj = new Date(dataHora || new Date().toISOString());

    try {
      setLoading(true);
      await onSave(
        {
          id: abastecimentoToEdit?.id,
          placa,
          data_hora: formatToDbDateTime(dateObj),
          data: formatToDbDate(dateObj),
          km: numKm,
          litros: numLitros,
          valor: numValor,
          tipo_gasolina: tipoGasolina,
          local: local.trim() || null,
        },
        isEdit
      );
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Erro ao registrar abastecimento.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!abastecimentoToEdit || !onDelete) return;
    try {
      setLoading(true);
      await onDelete(abastecimentoToEdit.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao excluir abastecimento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#151f32] border border-slate-200/80 dark:border-[#293548] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Topo Azul-Marinho IAZ */}
        <div className="bg-[#000d3c] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-amber-500">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white">
                {isEdit ? 'Editar Abastecimento' : 'Novo Abastecimento'}
              </h3>
              <p className="text-[11px] text-slate-300">
                {isEdit ? 'Atualize os dados do abastecimento' : 'LitroWatt IAZ • Gestão de Combustível'}
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

          {/* Tipo de Gasolina */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Tipo de Combustível *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['COMUM', 'ADITIVADA', 'PODIUM'] as TipoGasolina[]).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setTipoGasolina(tipo)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    tipoGasolina === tipo
                      ? 'bg-[#ff6200] text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#293548] hover:border-[#ff6200]/40'
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>

          {/* KM do Odômetro */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-slate-400" />
              KM do Odômetro Atual *
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Ex: 45280"
              value={km}
              onChange={(e) => setKm(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#293548] bg-slate-50/50 dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#ff6200]"
            />
          </div>

          {/* Litros e Valor Pago com Máscara BRL */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Litros *
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ex: 40,5"
                value={litros}
                onChange={(e) => setLitros(e.target.value)}
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

          {/* Indicador de Preço por Litro calculado */}
          {precoPorLitro > 0 && (
            <div className="p-2.5 rounded-xl bg-orange-50/50 dark:bg-slate-900 border border-orange-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">Preço Calculado por Litro:</span>
              <span className="font-extrabold text-[#ff6200]">
                {formatCurrency(precoPorLitro)} / L
              </span>
            </div>
          )}

          {/* Local do Posto (input + datalist) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Posto ou Local (Opcional)</span>
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
              list="postos-sugestoes"
              placeholder="Ex: Posto Shell, Posto Ipiranga..."
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#293548] bg-slate-50/50 dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-[#ff6200]"
            />
            <datalist id="postos-sugestoes">
              <option value="Posto Shell" />
              <option value="Posto Ipiranga" />
              <option value="Posto Petrobras / BR" />
              <option value="Posto Ale" />
              <option value="Auto Posto Rodovia" />
            </datalist>
          </div>

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
                <span>{loading ? 'Salvando...' : 'Salvar Abastecimento'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FormAbastecimento;
