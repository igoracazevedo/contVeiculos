'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UsuarioLiberado, UserRole } from '@/types/database';
import { formatDateBR } from '@/lib/utils';
import {
  Users,
  X,
  Plus,
  Search,
  ShieldCheck,
  Shield,
  Calendar,
  Edit2,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
} from 'lucide-react';

interface GerenciarUsuariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
}

export function GerenciarUsuariosModal({
  isOpen,
  onClose,
  currentUserEmail,
}: GerenciarUsuariosModalProps) {
  const [usuarios, setUsuarios] = useState<UsuarioLiberado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Form State (para criar ou editar)
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formEmail, setFormEmail] = useState('');
  const [formNome, setFormNome] = useState('');
  const [formDataInicio, setFormDataInicio] = useState('');
  const [formDataFim, setFormDataFim] = useState('');
  const [formAtivo, setFormAtivo] = useState(true);
  const [formRole, setFormRole] = useState<UserRole>('usuario');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Confirmação de exclusão
  const [userToDelete, setUserToDelete] = useState<UsuarioLiberado | null>(null);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('usuarios_liberados')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar usuarios_liberados:', err);
      setError(err?.message || 'Falha ao buscar usuários liberados no banco.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsuarios();
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormEmail('');
    setFormNome('');
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearStr = nextYear.toISOString().split('T')[0];

    setFormDataInicio(today);
    setFormDataFim(nextYearStr);
    setFormAtivo(true);
    setFormRole('usuario');
    setFormError(null);
  };

  const handleStartEdit = (u: UsuarioLiberado) => {
    setEditingId(u.id);
    setFormEmail(u.email);
    setFormNome(u.nome || '');
    setFormDataInicio(u.data_inicio);
    setFormDataFim(u.data_fim);
    setFormAtivo(u.ativo);
    setFormRole(u.role);
    setIsEditing(true);
    setFormError(null);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanEmail = formEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormError('Informe um email válido da conta Google.');
      return;
    }
    if (!formDataInicio) {
      setFormError('Informe a data de início de uso.');
      return;
    }
    if (!formDataFim) {
      setFormError('Informe a data de término de uso.');
      return;
    }
    if (new Date(formDataFim) < new Date(formDataInicio)) {
      setFormError('A data de término não pode ser anterior à data de início.');
      return;
    }

    try {
      setFormLoading(true);
      if (editingId) {
        // Atualizar
        const { error } = await supabase
          .from('usuarios_liberados')
          .update({
            email: cleanEmail,
            nome: formNome.trim() || null,
            data_inicio: formDataInicio,
            data_fim: formDataFim,
            ativo: formAtivo,
            role: formRole,
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Inserir novo
        const { error } = await supabase.from('usuarios_liberados').insert([
          {
            email: cleanEmail,
            nome: formNome.trim() || null,
            data_inicio: formDataInicio,
            data_fim: formDataFim,
            ativo: formAtivo,
            role: formRole,
          },
        ]);

        if (error) throw error;
      }

      await fetchUsuarios();
      resetForm();
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      setFormError(err?.message || 'Erro ao gravar usuário no Supabase.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (u: UsuarioLiberado) => {
    try {
      const { error } = await supabase
        .from('usuarios_liberados')
        .update({ ativo: !u.ativo })
        .eq('id', u.id);

      if (error) throw error;
      setUsuarios((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, ativo: !item.ativo } : item))
      );
    } catch (err: any) {
      alert(`Erro ao alterar status: ${err?.message}`);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const { error } = await supabase
        .from('usuarios_liberados')
        .delete()
        .eq('id', userToDelete.id);

      if (error) throw error;
      setUserToDelete(null);
      await fetchUsuarios();
    } catch (err: any) {
      alert(`Erro ao excluir usuário: ${err?.message}`);
    }
  };

  // Filtragem
  const filteredUsers = usuarios.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.nome && u.nome.toLowerCase().includes(search.toLowerCase()))
  );

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5 text-purple-400">
            <div className="p-2 rounded-xl bg-purple-500/10">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                Usuários Liberados
              </h3>
              <p className="text-[11px] text-slate-400">
                Gerencie quem pode logar e o período de vigência de cada conta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com rolagem */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-2xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Se estiver no modo de formulário (Adicionar / Editar) */}
          {isEditing ? (
            <form onSubmit={handleSaveUser} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  {editingId ? 'Editar Usuário Liberado' : 'Novo Usuário Liberado'}
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-[11px] text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              {formError && (
                <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email da Conta Google *
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="exemplo@gmail.com"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome / Identificação
                </label>
                <input
                  type="text"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Nome do motorista ou usuário"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={formDataInicio}
                    onChange={(e) => setFormDataInicio(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data de Término
                  </label>
                  <input
                    type="date"
                    value={formDataFim}
                    onChange={(e) => setFormDataFim(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nível de Acesso
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="usuario">Usuário Comum</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <input
                      type="checkbox"
                      checked={formAtivo}
                      onChange={(e) => setFormAtivo(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-purple-600 focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-slate-300">
                      {formAtivo ? 'Acesso Ativo' : 'Acesso Inativo'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-purple-600/20 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{formLoading ? 'Salvando...' : 'Salvar Usuário'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-2">
              {/* Barra de Pesquisa */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por email ou nome..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Botão Adicionar */}
              <button
                onClick={() => {
                  resetForm();
                  setIsEditing(true);
                }}
                className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-purple-600/20 flex-shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Novo</span>
              </button>
            </div>
          )}

          {/* Lista de Usuários */}
          <div className="space-y-2.5">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500 animate-pulse">
                Carregando usuários liberados...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-8 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-4">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-semibold">Nenhum usuário liberado encontrado</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Cadastre contas do Google para liberar o acesso ao app.
                </p>
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isExpired = u.data_fim < todayStr;
                const isNotStarted = u.data_inicio > todayStr;
                const isSelf = u.email.toLowerCase() === currentUserEmail.toLowerCase();

                return (
                  <div
                    key={u.id}
                    className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white text-xs">{u.nome || u.email}</span>
                          {isSelf && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30">
                              Você
                            </span>
                          )}
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              u.role === 'admin'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {u.role === 'admin' ? 'Admin' : 'Usuário'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{u.email}</p>
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.ativo
                              ? 'text-emerald-400 hover:bg-emerald-500/10'
                              : 'text-slate-500 hover:bg-slate-800'
                          }`}
                          title={u.ativo ? 'Desativar acesso' : 'Ativar acesso'}
                        >
                          {u.ativo ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleStartEdit(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
                          title="Editar vigência"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => setUserToDelete(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                            title="Remover liberação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Vigência e Status Badges */}
                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-900 text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>
                          {formatDateBR(u.data_inicio)} até {formatDateBR(u.data_fim)}
                        </span>
                      </div>

                      <div>
                        {!u.ativo ? (
                          <span className="text-slate-500 font-medium">Inativo</span>
                        ) : isExpired ? (
                          <span className="text-red-400 font-bold">Expirado</span>
                        ) : isNotStarted ? (
                          <span className="text-sky-400 font-medium">Inicia em breve</span>
                        ) : (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                            Liberado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal de confirmação de exclusão */}
        {userToDelete && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full text-center shadow-2xl space-y-3">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
              <h4 className="font-bold text-white text-base">Remover autorização?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tem certeza que deseja revogar o acesso de{' '}
                <span className="text-white font-mono font-semibold">{userToDelete.email}</span>? O usuário não conseguirá mais logar no aplicativo.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors"
                >
                  Sim, Revogar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default GerenciarUsuariosModal;
