'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Fuel, Zap, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

interface LoginScreenProps {
  errorMessage?: string | null;
}

export function LoginScreen({ errorMessage }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(errorMessage || null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // Determinar a URL de redirecionamento correta (Vercel ou localhost)
      const redirectUrl =
        typeof window !== 'undefined'
          ? window.location.origin
          : 'https://iaz-gas-energia.vercel.app';

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('Erro ao autenticar com Google:', err);
      setError(err?.message || 'Falha ao iniciar autenticação com o Google.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 select-none">
      <div className="w-full max-w-sm space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Logo / Header Visual */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-sky-500/20 via-slate-900 to-emerald-500/20 border border-slate-800 shadow-2xl relative">
            <Fuel className="w-8 h-8 text-sky-400 absolute -translate-x-2 -translate-y-1" />
            <Zap className="w-7 h-7 text-emerald-400 absolute translate-x-2 translate-y-1" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
              IazGas <span className="text-sky-400">&</span> Energia
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Controle independente de frotas, combustível e recargas elétricas
            </p>
          </div>
        </div>

        {/* Card de Login */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold text-white">Acesse sua Conta</h2>
            <p className="text-xs text-slate-400">
              Faça login com sua conta do Google autorizada
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Botão Entrar com Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-98 shadow-lg shadow-white/5 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-900" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{loading ? 'Conectando ao Google...' : 'Continuar com o Google'}</span>
          </button>

          {/* Aviso de Segurança e Acesso Restrito */}
          <div className="pt-2 border-t border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <span>
              O acesso é restrito a emails autorizados com período de vigência ativo. Cada usuário gerencia seus próprios veículos e registros de forma independente.
            </span>
          </div>
        </div>

        {/* Rodapé */}
        <p className="text-[11px] text-center text-slate-600">
          IazGas & Energia • Sistema Privado de Gestão
        </p>
      </div>
    </div>
  );
}
export default LoginScreen;
