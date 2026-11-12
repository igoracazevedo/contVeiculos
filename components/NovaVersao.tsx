'use client';

import { RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import novidadesLocais from "../novidades.json";

type Novidade = { versao: string; data: string; itens: string[] };
type Tela = { modo: "disponivel" | "atualizado"; versao: string; novidades: Novidade[] };

const VERSAO = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";
const VISTA = "lv_versao_vista";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const INTERVALO_MS = 5 * 60_000;

/** compara "1.5.0" com "1.4.6": >0 se a primeira for mais nova */
function comparar(a: string, b: string) {
  const x = a.split(".").map(Number);
  const y = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0);
  return 0;
}

const dataBR = (d: string) => d.split("-").reverse().join("/");

/**
 * Tela cheia de versão:
 * - "disponível": o servidor tem versão mais nova que a aberta (confere ao abrir, a cada 5 min e ao voltar ao app);
 * - "atualizado": acabou de abrir uma versão nova pela primeira vez, mostra o que mudou uma vez.
 */
export default function NovaVersao() {
  const [tela, setTela] = useState<Tela | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const dispensada = useRef(""); // "Agora não": não insiste com a mesma versão até reabrir o app

  // primeira abertura desta versão: mostra o que mudou (no cliente, para não divergir da renderização do servidor)
  useEffect(() => {
    try {
      const vista = localStorage.getItem(VISTA);
      const lista = novidadesLocais as Novidade[];
      const novidades = vista
        ? lista.filter((n) => comparar(n.versao, vista) > 0 && comparar(n.versao, VERSAO) <= 0)
        : lista.filter((n) => n.versao === VERSAO);
      if (novidades.length && (!vista || comparar(VERSAO, vista) > 0)) setTela({ modo: "atualizado", versao: VERSAO, novidades });
      else localStorage.setItem(VISTA, VERSAO);
    } catch {
      // sem armazenamento: segue sem a tela
    }
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    let parado = false;
    async function conferir() {
      try {
        const r = await fetch(`${BASE}/version.json?t=${Date.now()}`, { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as { versao: string; novidades: Novidade[] };
        if (parado || !j.versao || comparar(j.versao, VERSAO) <= 0 || dispensada.current === j.versao) return;
        const novidades = (j.novidades || []).filter((n) => comparar(n.versao, VERSAO) > 0);
        setTela((t) => (t?.modo === "disponivel" && t.versao === j.versao ? t : { modo: "disponivel", versao: j.versao, novidades }));
      } catch {
        // sem internet: tenta depois
      }
    }
    void conferir();
    const timer = setInterval(conferir, INTERVALO_MS);
    const aoVoltar = () => document.visibilityState === "visible" && void conferir();
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      parado = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, []);

  async function atualizar() {
    setAtualizando(true);
    try {
      localStorage.setItem(VISTA, tela?.versao ?? VERSAO); // já viu o que mudou: não repete depois de atualizar
      const reg = await navigator.serviceWorker?.getRegistration();
      await reg?.update();
    } catch {
      // recarrega mesmo assim
    }
    const url = new URL(location.href);
    url.searchParams.set("v", tela?.versao ?? String(Date.now()));
    location.replace(url.toString());
  }

  function fechar() {
    try {
      localStorage.setItem(VISTA, VERSAO);
    } catch {
      // ignora
    }
    setTela(null);
  }

  if (!tela) return null;
  const disponivel = tela.modo === "disponivel";

  return (
    <div className="fixed inset-0 z-[300] overflow-y-auto bg-[#0a0a0a] text-white" role="dialog" aria-modal="true" aria-labelledby="nova-versao-titulo">
      <div className="mx-auto flex min-h-full max-w-xl flex-col px-6 pt-[max(env(safe-area-inset-top),40px)] pb-[max(env(safe-area-inset-bottom),24px)]">
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-[#bef264] text-black">
          <Sparkles className="h-8 w-8" />
        </div>
        <p className="mt-6 text-sm text-white/60">{disponivel ? "Versão nova disponível" : "Aplicativo atualizado"}</p>
        <h1 id="nova-versao-titulo" className="mt-1 text-4xl font-semibold tracking-tight text-white">
          Versão {tela.versao}
        </h1>
        <p className="mt-2 text-sm text-white/60">{disponivel ? "Atualize para usar as novidades:" : "O que mudou:"}</p>

        <div className="mt-6 flex-1 space-y-4">
          {tela.novidades.length === 0 && <p className="text-white/70">Melhorias e correções.</p>}
          {tela.novidades.map((n) => (
            <section key={n.versao} className="rounded-3xl border border-white/[0.08] bg-[#161616] p-5">
              <p className="text-xs text-white/50">
                Versão {n.versao} · {dataBR(n.data)}
              </p>
              <ul className="mt-3 space-y-2.5">
                {n.itens.map((t, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-snug text-white/90">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#bef264]" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-8 space-y-2">
          {disponivel ? (
            <>
              <button onClick={atualizar} disabled={atualizando} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#bef264] py-4 text-base font-extrabold text-black transition hover:bg-[#d9f99d] disabled:opacity-60">
                <RefreshCw className={`h-5 w-5 ${atualizando ? "animate-spin" : ""}`} /> {atualizando ? "Atualizando…" : "Atualizar aplicativo"}
              </button>
              <button onClick={() => ((dispensada.current = tela.versao), setTela(null))} className="w-full rounded-full py-3 text-sm text-white/60 hover:text-white">
                Agora não
              </button>
            </>
          ) : (
            <button onClick={fechar} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#bef264] py-4 text-base font-extrabold text-black transition hover:bg-[#d9f99d] disabled:opacity-60">
              Continuar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
