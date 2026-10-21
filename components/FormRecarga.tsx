'use client';

import React, { useState, useEffect } from 'react';
import { Recarga, Veiculo } from '@/types/database';
import { formatCurrency, formatNumber, dateToInputDateTime, formatToDbDate, formatToDbDateTime } from '@/lib/utils';
import { Zap, X, Save, Trash2, MapPin, Dumbbell, AlertCircle, Loader2 } from 'lucide-react';

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
  const [valor, setValor] = useState<string>('');
  const [local, setLocal] = useState('');
  const [academia, setAcademia] = useState(false);

  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (recargaToEdit) {
      setPlaca(recargaToEdit.placa);
      setDataHora(dateToInputDateTime(recargaToEdit.data_hora || recargaToEdit.data));
      setPercInicial(String(recargaToEdit.perc_inicial ?? ''));
      setPercFinal(String(recargaToEdit.perc_final ?? ''));
      setKwa(String(recargaToEdit.kwa ?? ''));
      setValor(String(recargaToEdit.valor ?? ''));
      setLocal(recargaToEdit.local || '');
      setAcademia(Boolean(recargaToEdit.academia));
    } else {
      const initialPlaca = defaultPlaca || (veiculos.length > 0 ? veiculos[0].placa : '');
      setPlaca(initialPlaca);
      setDataHora(dateToInputDateTime(new Date().toISOString()));
      setPercInicial('20');
      setPercFinal('100');
      setKwa('');
      setValor('');
      setLocal('');
      setAcademia(false);
    }
    setError(null);
    setShowConfirmDelete(false);
  }, [recargaToEdit, isOpen, defaultPlaca, veiculos]);

  if (!isOpen) return null;

  const isEdit = Boolean(recargaToEdit);

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
      setError('Selecione o veículo da recarga.');
      return;
    }

    const numInicial = parseFloat(percInicial.replace(',', '.'));
    const numFinal = parseFloat(percFinal.replace(',', '.'));
    const numKwa = parseFloat(kwa.replace(',', '.'));
    const numValor = parseFloat(valor.replace(',', '.')) || 0;

    if (isNaN(numInicial) || numInicial < 0 || numInicial > 100) {
      setError('Percentual inicial deve estar entre 0% e 100%.');
      return;
    }
    if (isNaN(numFinal) || numFinal < 0 || numFinal > 100) {
      setError('Percentual final deve estar entre 0% e 100%.');
      return;
    }
    if (numFinal < numInicial) {
      setError('O percentual final não pode ser menor que o inicial.');
      return;
    }
    if (isNaN(numKwa) || numKwa < 0) {
      setError('Informe a quantidade de energia (kWh/kwa) recarregada.');
      return;
    }

    try {
      setLoading(true);
      const chosenDate = dataHora ? new Date(dataHora) : new Date();
      const strData = formatToDbDate(chosenDate);
      const strDataHora = formatToDbDateTime(chosenDate);

      await onSave(
        {
          ...(isEdit && recargaToEdit ? { id: recargaToEdit.id } : {}),
          placa,
          data_hora: strDataHora,
          data: strData,
          perc_inicial: numInicial,
          perc_final: numFinal,
          kwa: numKwa,
          valor: numValor,
          local: local.trim() || null,
          academia,
        },
        isEdit
      );
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Erro ao salvar recarga.');
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
      setError(err?.message || 'Erro ao excluir registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400">
            <Zap className="w-5 h-5" />
            <h3 className="font-bold text-white text-base">
              {isEdit ? 'Editar Recarga Elétrica' : 'Nova Recarga Elétrica'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Placa & Data/Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Veículo</label>
              {veiculos.length > 0 ? (
                <select
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {veiculos.map((v) => (
                    <option key={v.placa} value={v.placa}>
                      {v.placa} - {v.modelo}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                  placeholder="Placa"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 font-mono uppercase"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Data e Hora</label>
              <input
                type="datetime-local"
                value={dataHora}
                onChange={(e) => setDataHora(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* % Inicial e % Final */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">% Inicial</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={percInicial}
                  onChange={(e) => setPercInicial(e.target.value)}
                  placeholder="20"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 font-medium pr-7"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500">%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">% Final</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={percFinal}
                  onChange={(e) => setPercFinal(e.target.value)}
                  placeholder="100"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 font-medium pr-7"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500">%</span>
              </div>
            </div>
          </div>

          {/* kWh (kwa) e Valor Total (R$) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Energia (kWh / kwa)</label>
              <input
                type="number"
                step="0.01"
                value={kwa}
                onChange={(e) => setKwa(e.target.value)}
                placeholder="Ex: 38.50"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Valor Total (R$)</label>
              <input
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Ex: 0.00 ou 45.00"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* Opção Academia (Highlight e Toggle) */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Ida à Academia</p>
                <p className="text-[10px] text-slate-400">Inclui no cálculo mensal de R$ 60 por ida</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={academia}
                onChange={(e) => setAcademia(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Local e GPS */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">Local ou Coordenadas GPS</label>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={gettingLocation}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
              >
                {gettingLocation ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <MapPin className="w-3 h-3" />
                )}
                Obter GPS Atual
              </button>
            </div>
            <input
              type="text"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Ex: Eletroposto Shopping ou -23.5505, -46.6333"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            />
          </div>

          {/* Ações */}
          <div className="pt-2 flex items-center gap-2">
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="p-2.5 rounded-xl border border-red-900/60 bg-red-950/30 text-red-400 hover:bg-red-900/50 transition-colors"
                title="Excluir recarga"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Registrar Recarga'}
            </button>
          </div>
        </form>

        {/* Modal Confirmação de Exclusão */}
        {showConfirmDelete && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm p-4 flex flex-col justify-center items-center text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-2" />
            <h4 className="font-bold text-white text-base">Excluir recarga?</h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1 mb-4">
              Esta ação removerá esta recarga e recalculará os totais de energia e academia.
            </p>
            <div className="flex gap-2 w-full max-w-xs">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default FormRecarga;
