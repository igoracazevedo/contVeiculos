'use client';

import React, { useState, useEffect } from 'react';
import { Veiculo } from '@/types/database';
import { formatGoogleDriveUrl } from '@/lib/utils';
import { Car, X, Save, Trash2, AlertCircle, Image as ImageIcon } from 'lucide-react';

interface FormVeiculoProps {
  veiculoToEdit?: Veiculo | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (veiculo: Partial<Veiculo>, isEdit: boolean) => Promise<void>;
  onDelete?: (placa: string) => Promise<void>;
}

export function FormVeiculo({
  veiculoToEdit,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: FormVeiculoProps) {
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [foto, setFoto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (veiculoToEdit) {
      setPlaca(veiculoToEdit.placa);
      setMarca(veiculoToEdit.marca);
      setModelo(veiculoToEdit.modelo);
      setFoto(veiculoToEdit.foto || '');
    } else {
      setPlaca('');
      setMarca('');
      setModelo('');
      setFoto('');
    }
    setError(null);
    setShowConfirmDelete(false);
  }, [veiculoToEdit, isOpen]);

  if (!isOpen) return null;

  const isEdit = Boolean(veiculoToEdit);
  const previewUrl = formatGoogleDriveUrl(foto);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPlaca = placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanPlaca) {
      setError('Informe a placa do veículo.');
      return;
    }
    if (!marca.trim()) {
      setError('Informe a marca.');
      return;
    }
    if (!modelo.trim()) {
      setError('Informe o modelo.');
      return;
    }

    try {
      setLoading(true);
      await onSave(
        {
          placa: cleanPlaca,
          marca: marca.trim(),
          modelo: modelo.trim(),
          foto: foto.trim() || null,
        },
        isEdit
      );
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Erro ao salvar veículo no banco.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!veiculoToEdit || !onDelete) return;
    try {
      setLoading(true);
      await onDelete(veiculoToEdit.placa);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao excluir veículo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-sky-400">
            <Car className="w-5 h-5" />
            <h3 className="font-bold text-white text-base">
              {isEdit ? 'Editar Veículo' : 'Cadastrar Veículo'}
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
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Placa
            </label>
            <input
              type="text"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="Ex: ABC1D23"
              disabled={isEdit}
              maxLength={8}
              className={`w-full px-3 py-2.5 rounded-xl bg-slate-950 border text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono uppercase tracking-wider text-sm ${
                isEdit ? 'opacity-60 cursor-not-allowed border-slate-800' : 'border-slate-800'
              }`}
            />
            {isEdit && (
              <p className="text-[10px] text-slate-500 mt-1">
                A placa não pode ser alterada pois é identificador único.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Marca
              </label>
              <input
                type="text"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="Ex: BYD, Toyota"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Modelo
              </label>
              <input
                type="text"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Ex: Song Plus, Corolla"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              URL da Foto
            </label>
            <input
              type="url"
              value={foto}
              onChange={(e) => setFoto(e.target.value)}
              placeholder="https://drive.google.com/file/d/... ou link direto"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Links do Google Drive (/file/d/...) são convertidos automaticamente.
            </p>
          </div>

          {/* Preview da Imagem */}
          {previewUrl && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-2 overflow-hidden">
              <span className="text-[10px] text-slate-500 flex items-center gap-1 mb-1.5 font-medium">
                <ImageIcon className="w-3 h-3" /> Pré-visualização da foto:
              </span>
              <div className="h-28 w-full rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Pré-visualização"
                  className="w-full h-full object-cover"
                  onError={() => setError('Não foi possível carregar a imagem desta URL.')}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="pt-2 flex items-center gap-2">
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="p-2.5 rounded-xl border border-red-900/60 bg-red-950/30 text-red-400 hover:bg-red-900/50 transition-colors"
                title="Excluir veículo"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Cadastrar Veículo'}
            </button>
          </div>
        </form>

        {/* Modal de Confirmação de Exclusão */}
        {showConfirmDelete && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm p-4 flex flex-col justify-center items-center text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-2" />
            <h4 className="font-bold text-white text-base">Excluir este veículo?</h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1 mb-4">
              Ao excluir o veículo <span className="text-white font-semibold">{placa}</span>, os abastecimentos e recargas associados poderão ficar órfãos.
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
export default FormVeiculo;
