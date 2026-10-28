'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UsuarioLiberado } from '@/types/database';
import { formatDateBR } from '@/lib/utils';
import {
  ShieldAlert,
  LogOut,
  Calendar,
  AlertTriangle,
  Mail,
  Copy,
  Check,
  Database,
  ExternalLink,
} from 'lucide-react';

export type BlockReason =
  | 'unauthorized'
  | 'inactive'
  | 'expired'
  | 'not_started'
  | 'table_missing';

interface AccessBlockedScreenProps {
  userEmail: string;
  userName?: string | null;
  userAvatar?: string | null;
  reason: BlockReason;
  whitelistData?: UsuarioLiberado | null;
  onRefresh: () => void;
}

export function AccessBlockedScreen({
  userEmail,
  userName,
  userAvatar,
  reason,
  whitelistData,
  onRefresh,
}: AccessBlockedScreenProps) {
  const [copiedSql, setCopiedSql] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      window.location.reload();
    } catch (err) {
      console.error('Erro ao deslogar:', err);
      setLoggingOut(false);
    }
  };

  const copySqlScript = () => {
    const sql = `-- Script de Atualização: Tabela de Usuários Liberados
CREATE TABLE IF NOT EXISTS public.usuarios_liberados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nome TEXT,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
  ativo BOOLEAN NOT NULL DEFAULT true,
  role TEXT NOT NULL DEFAULT 'usuario',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.abastecimentos ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.abastecimentos ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.recargas ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.recargas ADD COLUMN IF NOT EXISTS user_email TEXT;

INSERT INTO public.usuarios_liberados (email, nome, data_inicio, data_fim, ativo, role)
VALUES ('${userEmail}', '${userName || 'Administrador'}', CURRENT_DATE, (CURRENT_DATE + INTERVAL '10 years'), true, 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin', ativo = true;

ALTER TABLE public.usuarios_liberados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura de usuarios_liberados" ON public.usuarios_liberados FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins gerenciam usuarios_liberados" ON public.usuarios_liberados FOR ALL TO authenticated USING (true);
`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 select-none">
      <div className="w-full max-w-sm space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Identificação do Usuário */}
        <div className="text-center space-y-2">
          <div className="relative inline-block">
            {userAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userAvatar}
                alt={userName || userEmail}
                className="w-20 h-20 rounded-full border-2 border-red-500/40 object-cover mx-auto shadow-xl"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-red-500/40 flex items-center justify-center mx-auto text-xl font-bold text-slate-300">
                {userEmail.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-red-500 text-slate-950 shadow">
              <ShieldAlert className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          <div>
            <h2 className="text-base font-bold text-white">{userName || 'Usuário Conectado'}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{userEmail}</p>
          </div>
        </div>

        {/* Card de Mensagem do Bloqueio */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          {reason === 'unauthorized' && (
            <div className="space-y-2 text-center">
              <div className="inline-flex p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 mb-1">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Acesso Não Liberado</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Esta conta do Google não está cadastrada na lista de usuários autorizados a utilizar o aplicativo.
              </p>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400">
                Entre em contato com o administrador do sistema para solicitar a liberação do seu email.
              </div>
            </div>
          )}

          {reason === 'expired' && (
            <div className="space-y-2 text-center">
              <div className="inline-flex p-2.5 rounded-2xl bg-red-500/10 text-red-400 mb-1">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Período de Acesso Expirado</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sua permissão de uso venceu em{' '}
                <span className="font-bold text-red-400">
                  {formatDateBR(whitelistData?.data_fim)}
                </span>
                .
              </p>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400">
                Solicite ao administrador a renovação da sua data de término.
              </div>
            </div>
          )}

          {reason === 'not_started' && (
            <div className="space-y-2 text-center">
              <div className="inline-flex p-2.5 rounded-2xl bg-sky-500/10 text-sky-400 mb-1">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Acesso Agendado</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seu período de utilização começará em{' '}
                <span className="font-bold text-sky-400">
                  {formatDateBR(whitelistData?.data_inicio)}
                </span>
                .
              </p>
            </div>
          )}

          {reason === 'inactive' && (
            <div className="space-y-2 text-center">
              <div className="inline-flex p-2.5 rounded-2xl bg-slate-800 text-slate-400 mb-1">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Cadastro Inativo</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seu cadastro de usuário está temporariamente desativado pelo administrador.
              </p>
            </div>
          )}

          {reason === 'table_missing' && (
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-2 text-amber-400">
                <Database className="w-5 h-5 flex-shrink-0" />
                <h3 className="text-sm font-bold text-white">Configuração Inicial do Banco</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                A tabela <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono text-[11px]">usuarios_liberados</code> ainda não foi criada no seu Supabase.
              </p>
              <p className="text-[11px] text-slate-400">
                Copie o script abaixo e execute-o na aba <strong>SQL Editor</strong> do painel Supabase. Seu email será cadastrado automaticamente como o Administrador principal!
              </p>

              <div className="flex gap-2">
                <button
                  onClick={copySqlScript}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-amber-500/20"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Script Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Script SQL</span>
                    </>
                  )}
                </button>
                <a
                  href="https://supabase.com/dashboard/project/cyzohyvnpnjpkuusdxiq/sql"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center"
                  title="Abrir Supabase SQL Editor"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <button
                onClick={onRefresh}
                className="w-full py-2 text-xs font-semibold rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 transition-colors"
              >
                Já executei o SQL, verificar novamente ↻
              </button>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              <LogOut className="w-4 h-4" />
              <span>{loggingOut ? 'Desconectando...' : 'Trocar de Conta / Sair'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AccessBlockedScreen;
