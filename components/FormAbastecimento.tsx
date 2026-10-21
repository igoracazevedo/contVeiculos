'use client';

import React, { useState, useEffect } from 'react';
import { Abastecimento, TipoGasolina, Veiculo } from '@/types/database';
import { formatCurrency, formatNumber, dateToInputDateTime, formatToDbDate, formatToDbDateTime } from '@/lib/utils';
import { Fuel, X, Save, Trash2, MapPin, AlertCircle, Loader2 } from 'lucide-react';

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
  const [valor, setValor] = useState<string>('');
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
      setValor(String(abastecimentoToEdit.valor || ''));
      setTipoGasolina(abastecimentoToEdit.tipo_gasolina || 'COMUM');
      setLocal(abastecimentoToEdit.local || '');
    } else {
      const initialPlaca = defaultPlaca || (veiculos.length > 0 ? veiculos[0].placa : '');
      setPlaca(initialPlaca);
      setDataHora(dateToInputDateTime(new Date().toISOString()));
      setKm('');
      setLitros('');
      setValor('');
      setTipoGasolina('COMUM');
      setLocal('');
    }
    setError(null);
    setShowConfirmDelete(false);
  }, [abastecimentoToEdit, isOpen, defaultPlaca, veiculos]);

  if (!isOpen) return null;

  const isEdit = Boolean(abastecimentoToEdit);

  // Preço por litro em tempo real
  const numValor = parseFloat(valor.replace(',', '.')) || 0;
  const numLitros = parseFloat(litros.replace(',', '.')) || 0;
  const precoPorLitro = numLitros > 0 ? numValor / numLitros : 0;

  // Capturar coordenadas GPS do celular/navegador
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
        alert('Não foi possível obter a localização atual. Verifique as permissões de GPS.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!placa) {
      setError('Selecione ou informe a placa do veículo.');
      return;
    }

    const numKm = parseFloat(km.replace(',', '.'));
    if (isNaN(numKm) || numKm <= 0) {
      setError('Informe um KM válido.');
      return;
    }

    if (numLitros <= 0) {
      setError('Informe a quantidade de litros abastecida.');
      return;
    }

    if (numValor <= 0) {
      setError('Informe o valor total do abastecimento.');
      return;
    }

    try {
      setLoading(true);
      const chosenDate = dataHora ? new Date(dataHora) : new Date();
      const strData = formatToDbDate(chosenDate);
      const strDataHora = formatToDbDateTime(chosenDate);

      await onSave(
        {
          ...(isEdit && abastecimentoToEdit ? { id: abastecimentoToEdit.id } : {}),
          placa,
          data_hora: strDataHora,
          data: strData,
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
      setError(err?.message || 'Erro ao salvar abastecimento.');
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
          <div className="flex items-center gap-2 text-amber-400">
            <Fuel className="w-5 h-5" />
            <h3 className="font-bold text-white text-base">
              {isEdit ? 'Editar Abastecimento' : 'Novo Abastecimento'}
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
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-2 focus:ring-amber-500 font-medium"
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
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-2 focus:ring-amber-500 font-mono uppercase"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Data e Hora</label>
              <input
                type="datetime-local"
                value={dataHora}
                onChange={(e) => setDataHora(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Odômetro KM e Tipo Gasolina */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">KM Odômetro</label>
              <input
                type="number"
                step="any"
                value={km}
                onChange={(e) => setKm(e.target.value)}
                placeholder="Ex: 45200"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Gasolina</label>
              <select
                value={tipoGasolina}
                onChange={(e) => setTipoGasolina(e.target.value as TipoGasolina)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-2 focus:ring-amber-500 font-medium"
              >
                <option value="COMUM">COMUM</option>
                <option value="ADITIVADA">ADITIVADA</option>
                <option value="PODIUM">PODIUM</option>
              </select>
            </div>
          </div>

          {/* Litros e Valor Total */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Litros</label>
              <input
                type="number"
                step="0.01"
                value={litros}
                onChange={(e) => setLitros(e.target.value)}
                placeholder="Ex: 42.50"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Valor Total (R$)</label>
              <input
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Ex: 250.00"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
          </div>

          {/* Destaque Preço por Litro calculado automaticamente */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Preço Calculado por Litro:</span>
            <span className="font-bold text-amber-400 text-sm">
              {precoPorLitro > 0 ? `${formatCurrency(precoPorLitro)} / L` : 'R$ 0,00 / L'}
            </span>
          </div>

          {/* Local e Botão GPS */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">Local ou Coordenadas GPS</label>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={gettingLocation}
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
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
              placeholder="Ex: Posto Ipiranga ou -23.5505, -46.6333"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
            />
          </div>

          {/* Ações */}
          <div className="pt-2 flex items-center gap-2">
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="p-2.5 rounded-xl border border-red-900/60 bg-red-950/30 text-red-400 hover:bg-red-900/50 transition-colors"
                title="Excluir abastecimento"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Registrar Abastecimento'}
            </button>
          </div>
        </form>

        {/* Modal Confirmação de Exclusão */}
        {showConfirmDelete && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm p-4 flex flex-col justify-center items-center text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-2" />
            <h4 className="font-bold text-white text-base">Excluir abastecimento?</h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1 mb-4">
              Esta ação removerá este abastecimento do histórico e recalculará a média do veículo.
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
export default FormAbastecimento;
