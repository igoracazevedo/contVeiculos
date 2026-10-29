'use client';

import React, { useState, useEffect } from 'react';
import { Veiculo } from '@/types/database';
import {
  getDefaultVehiclePhoto,
  getVehicleDisplayPhoto,
  searchPublicVehiclePhotos,
  PublicPhotoResult,
} from '@/lib/vehiclePhotos';
import {
  Car,
  X,
  Save,
  Trash2,
  AlertCircle,
  Image as ImageIcon,
  Dumbbell,
  Search,
  Check,
  Sparkles,
  Loader2,
} from 'lucide-react';

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
  const [temAcademia, setTemAcademia] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Busca de fotos públicas
  const [searchingPhotos, setSearchingPhotos] = useState(false);
  const [publicPhotos, setPublicPhotos] = useState<PublicPhotoResult[]>([]);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  useEffect(() => {
    if (veiculoToEdit) {
      setPlaca(veiculoToEdit.placa);
      setMarca(veiculoToEdit.marca);
      setModelo(veiculoToEdit.modelo);
      setFoto(veiculoToEdit.foto || '');
      setTemAcademia(Boolean(veiculoToEdit.tem_academia));
    } else {
      setPlaca('');
      setMarca('');
      setModelo('');
      setFoto('');
      setTemAcademia(false);
    }
    setError(null);
    setShowConfirmDelete(false);
    setPublicPhotos([]);
    setShowPhotoPicker(false);
  }, [veiculoToEdit, isOpen]);

  if (!isOpen) return null;

  const isEdit = Boolean(veiculoToEdit);
  const displayPhoto = getVehicleDisplayPhoto({ marca, modelo, foto });

  const handleSearchPhotos = async () => {
    const query = `${marca} ${modelo}`.trim();
    if (!query) {
      setError('Preencha a marca ou o modelo antes de buscar fotos.');
      return;
    }
    setError(null);
    setSearchingPhotos(true);
    setShowPhotoPicker(true);
    try {
      const results = await searchPublicVehiclePhotos(query);
      setPublicPhotos(results);
    } catch (err: any) {
      console.error(err);
      setError('Não foi possível buscar fotos online no momento.');
    } finally {
      setSearchingPhotos(false);
    }
  };

  const handleSelectPublicPhoto = (url: string) => {
    setFoto(url);
    setShowPhotoPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPlaca = placa.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
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

    // Se o usuário não colocou foto própria, busca automaticamente foto pública sem direitos autorais
    let finalFoto = foto.trim();
    if (!finalFoto) {
      finalFoto = getDefaultVehiclePhoto(marca.trim(), modelo.trim());
    }

    try {
      setLoading(true);
      await onSave(
        {
          placa: cleanPlaca,
          marca: marca.trim(),
          modelo: modelo.trim(),
          foto: finalFoto || null,
          tem_academia: temAcademia,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#151f32] border border-slate-200/80 dark:border-[#293548] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabeçalho Topo Azul-Marinho IAZ */}
        <div className="bg-[#000d3c] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-[#ff6200]">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white">
                {isEdit ? 'Editar Veículo' : 'Novo Veículo'}
              </h3>
              <p className="text-[11px] text-slate-300">
                {isEdit ? 'Atualize as informações do carro' : 'Cadastre seu carro para gestão individual'}
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

        {/* Formulário com Scroll Suave */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Pré-visualização da Foto Atual */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-[#293548]">
            <div className="w-16 h-14 rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden relative flex-shrink-0 border border-slate-300/60 dark:border-slate-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayPhoto}
                alt="Foto do veículo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getDefaultVehiclePhoto(marca, modelo);
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Foto do Veículo
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 truncate">
                {foto ? 'Foto personalizada' : 'Foto pública automática (sem direitos autorais)'}
              </p>
              <button
                type="button"
                onClick={handleSearchPhotos}
                disabled={searchingPhotos}
                className="mt-1 text-[11px] font-bold text-[#ff6200] hover:text-[#ec7000] flex items-center gap-1"
              >
                {searchingPhotos ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Search className="w-3 h-3" />
                )}
                <span>Buscar foto pública na web</span>
              </button>
            </div>
          </div>

          {/* Seletor de Fotos Públicas Encontradas */}
          {showPhotoPicker && (
            <div className="p-3 rounded-2xl bg-orange-50/50 dark:bg-slate-900 border border-orange-200 dark:border-slate-700 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#ff6200]" />
                  Fotos públicas sugeridas (Wikimedia):
                </span>
                <button
                  type="button"
                  onClick={() => setShowPhotoPicker(false)}
                  className="text-[10px] text-slate-500 hover:text-slate-800"
                >
                  Fechar
                </button>
              </div>

              {publicPhotos.length === 0 && !searchingPhotos ? (
                <p className="text-xs text-slate-500 py-2">
                  Nenhuma imagem adicional encontrada. O app usará a imagem padrão de alta qualidade do modelo.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto pt-1">
                  {publicPhotos.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPublicPhoto(p.url)}
                      className="group relative h-16 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 hover:border-[#ff6200] focus:ring-2 focus:ring-[#ff6200] transition-all"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Placa */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Placa do Veículo *
            </label>
            <input
              type="text"
              placeholder="Ex: ABC1D23"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              disabled={isEdit}
              maxLength={8}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#293548] bg-slate-50/50 dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 font-mono text-sm uppercase tracking-wider font-bold focus:outline-none focus:ring-2 focus:ring-[#ff6200]"
            />
          </div>

          {/* Marca e Modelo (com datalists para sugestão ou valor novo) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Marca *
              </label>
              <input
                type="text"
                list="marcas-sugestoes"
                placeholder="Ex: BYD, Caoa Chery"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#293548] bg-slate-50/50 dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#ff6200]"
              />
              <datalist id="marcas-sugestoes">
                <option value="BYD" />
                <option value="Caoa Chery" />
                <option value="GWM" />
                <option value="Toyota" />
                <option value="Renault" />
                <option value="Jeep" />
                <option value="Volvo" />
                <option value="Volkswagen" />
                <option value="Chevrolet" />
                <option value="Fiat" />
              </datalist>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Modelo *
              </label>
              <input
                type="text"
                list="modelos-sugestoes"
                placeholder="Ex: Song Pro, Tiggo 5x"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#293548] bg-slate-50/50 dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#ff6200]"
              />
              <datalist id="modelos-sugestoes">
                <option value="Song Pro GS" />
                <option value="Song Plus DM-i" />
                <option value="Tiggo 5x Sport" />
                <option value="Tiggo 7 Pro" />
                <option value="Tiggo 8 Pro PHEV" />
                <option value="Haval H6 HEV/PHEV" />
                <option value="Dolphin EV" />
                <option value="Seal EV" />
                <option value="Corolla Cross Hybrid" />
              </datalist>
            </div>
          </div>

          {/* Campo de URL Própria para Foto */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Link da Foto Própria (Opcional)</span>
              {foto && (
                <button
                  type="button"
                  onClick={() => setFoto('')}
                  className="text-[10px] text-[#ff6200] hover:underline"
                >
                  Usar pública padrão
                </button>
              )}
            </label>
            <div className="relative">
              <input
                type="url"
                placeholder="Cole URL direta ou do Google Drive"
                value={foto}
                onChange={(e) => setFoto(e.target.value)}
                className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-slate-200 dark:border-[#293548] bg-slate-50/50 dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-[#ff6200]"
              />
              <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <p className="text-[10px] text-slate-400">
              Se deixar em branco, o LitroWatt IAZ associa automaticamente uma foto pública e sem direitos autorais.
            </p>
          </div>

          {/* CONFIGURAÇÃO DO ITEM ACADEMIA (NOVO REQUISITO) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-[#293548] space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${temAcademia ? 'bg-[#ff6200]/10 text-[#ff6200]' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Vincular a Recargas na Academia
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Exibe a aba de academia e a opção no cadastro de recargas
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={temAcademia}
                onChange={(e) => setTemAcademia(e.target.checked)}
                className="w-5 h-5 rounded-lg text-[#ff6200] focus:ring-[#ff6200] border-slate-300 dark:border-slate-600 cursor-pointer"
              />
            </label>
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
                    Confirmar Exclusão
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
                <span>{loading ? 'Salvando...' : 'Salvar Veículo'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FormVeiculo;
