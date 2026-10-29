'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Veiculo, Abastecimento, Recarga, UsuarioLiberado } from '@/types/database';
import {
  formatCurrency,
  formatNumber,
  calcularMediaKmL,
  formatDateBR,
  parseDate,
  getMonthName,
} from '@/lib/utils';
import { LogoBadge } from '@/components/LogoBadge';
import { CarCard } from '@/components/CarCard';
import { HierarquiaAnoMes } from '@/components/HierarquiaAnoMes';
import { GraficosScreen } from '@/components/GraficosScreen';
import { FormVeiculo } from '@/components/FormVeiculo';
import { FormAbastecimento } from '@/components/FormAbastecimento';
import { FormRecarga } from '@/components/FormRecarga';
import { LoginScreen } from '@/components/LoginScreen';
import { AccessBlockedScreen, BlockReason } from '@/components/AccessBlockedScreen';
import { GerenciarUsuariosModal } from '@/components/GerenciarUsuariosModal';
import {
  Fuel,
  Zap,
  Dumbbell,
  Plus,
  RefreshCw,
  Car,
  TrendingUp,
  Clock,
  Layers,
  Sparkles,
  AlertCircle,
  X,
  CheckCircle2,
  Users,
  LogOut,
  ShieldCheck,
  Search,
  HelpCircle,
  Moon,
  Sun,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Download,
  Filter,
} from 'lucide-react';

export type IazTab = 'resumo' | 'gasolina' | 'energia' | 'graficos' | 'academia' | 'veiculos';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<IazTab>('resumo');

  // Estados de Autenticação e Whitelist
  const [authLoading, setAuthLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [whitelistStatus, setWhitelistStatus] = useState<
    'checking' | 'authorized' | 'unauthorized' | 'expired' | 'not_started' | 'inactive' | 'table_missing'
  >('checking');
  const [whitelistData, setWhitelistData] = useState<UsuarioLiberado | null>(null);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);

  // Modo de visualização para admins: 'my_records' ou 'all_records'
  const [viewAllRecords, setViewAllRecords] = useState(false);

  // Dados do banco Supabase
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
  const [recargas, setRecargas] = useState<Recarga[]>([]);

  // Filtro de veículo selecionado (null = todos)
  const [selectedPlaca, setSelectedPlaca] = useState<string | null>(null);

  // Estados de controle de UI
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'success' | 'error' } | null>(null);

  // Padrão IAZ: Ocultar valores monetários (Olho)
  const [hideValues, setHideValues] = useState<boolean>(false);

  // Padrão IAZ: Modo Escuro (.dark-theme)
  const [isDark, setIsDark] = useState<boolean>(false);

  // Padrão IAZ: Menu de Perfil / Avatar Dropdown
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Padrão IAZ: Barra de Busca Rápida
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Padrão IAZ: Guia de Ajuda Contextual (?)
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Seletor de Período em Linha Única (Mês Atual por padrão)
  const [selectedPeriodDate, setSelectedPeriodDate] = useState<Date>(new Date());
  const [filterByPeriod, setFilterByPeriod] = useState<boolean>(false);

  // Modais de Criação e Edição
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Veiculo | null>(null);

  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [fuelToEdit, setFuelToEdit] = useState<Abastecimento | null>(null);

  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [rechargeToEdit, setRechargeToEdit] = useState<Recarga | null>(null);

  // Inicialização de Tema e Preferências
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('iaz_theme');
      if (savedTheme === 'dark') {
        setIsDark(true);
        document.documentElement.classList.add('dark', 'dark-theme');
      }
      const savedHide = localStorage.getItem('iaz_hide_values');
      if (savedHide === 'true') {
        setHideValues(true);
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark', 'dark-theme');
      localStorage.setItem('iaz_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark', 'dark-theme');
      localStorage.setItem('iaz_theme', 'light');
    }
  };

  const toggleHideValues = () => {
    const nextVal = !hideValues;
    setHideValues(nextVal);
    localStorage.setItem('iaz_hide_values', String(nextVal));
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const isAdmin = useMemo(() => {
    if (!sessionUser) return false;
    const email = sessionUser.email?.toLowerCase();
    return (
      email === 'igoracazevedo@gmail.com' ||
      whitelistData?.role === 'admin'
    );
  }, [sessionUser, whitelistData]);

  // Prevenção de perda de foco e reinicialização de modais
  const hasInitialAuthLoadedRef = React.useRef(false);

  // Checagem de Autenticação e Whitelist de Usuários
  const checkAuthAndWhitelist = useCallback(async (user: any) => {
    if (!user) {
      setSessionUser(null);
      setWhitelistStatus('checking');
      setAuthLoading(false);
      hasInitialAuthLoadedRef.current = false;
      return;
    }

    setSessionUser(user);
    if (!hasInitialAuthLoadedRef.current) {
      setAuthLoading(true);
    }

    const email = user.email?.toLowerCase();
    const isMasterAdmin = email === 'igoracazevedo@gmail.com';

    try {
      const { data, error } = await supabase
        .from('ge_usuarios_liberados')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        if (
          error.code === '42P01' ||
          error.message?.includes('Could not find the table') ||
          error.message?.includes('schema cache')
        ) {
          if (isMasterAdmin) {
            setWhitelistStatus('authorized');
            setWhitelistData({
              id: 'master-admin',
              email: email,
              nome: user.user_metadata?.full_name || 'Admin',
              data_inicio: '2020-01-01',
              data_fim: '2099-12-31',
              ativo: true,
              role: 'admin',
            });
            hasInitialAuthLoadedRef.current = true;
            setAuthLoading(false);
            return;
          } else {
            setWhitelistStatus('table_missing');
            setAuthLoading(false);
            return;
          }
        }
        throw error;
      }

      if (!data) {
        if (isMasterAdmin) {
          setWhitelistStatus('authorized');
          setWhitelistData({
            id: 'master-admin',
            email: email,
            nome: user.user_metadata?.full_name || 'Admin',
            data_inicio: '2020-01-01',
            data_fim: '2099-12-31',
            ativo: true,
            role: 'admin',
          });
          hasInitialAuthLoadedRef.current = true;
          setAuthLoading(false);
          return;
        }

        setWhitelistStatus('unauthorized');
        setAuthLoading(false);
        return;
      }

      const todayStr = new Date().toISOString().split('T')[0];

      if (!data.ativo) {
        setWhitelistStatus('inactive');
        setWhitelistData(data);
        setAuthLoading(false);
        return;
      }

      if (data.data_fim && data.data_fim < todayStr) {
        setWhitelistStatus('expired');
        setWhitelistData(data);
        setAuthLoading(false);
        return;
      }

      if (data.data_inicio && data.data_inicio > todayStr) {
        setWhitelistStatus('not_started');
        setWhitelistData(data);
        setAuthLoading(false);
      } else {
        setWhitelistStatus('authorized');
        setWhitelistData(data);
        hasInitialAuthLoadedRef.current = true;
        setAuthLoading(false);
      }
    } catch (err: any) {
      console.error('Erro ao verificar usuário liberado:', err);
      if (isMasterAdmin) {
        setWhitelistStatus('authorized');
        hasInitialAuthLoadedRef.current = true;
      } else {
        setWhitelistStatus('unauthorized');
      }
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        checkAuthAndWhitelist(session?.user ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        // Ignorar eventos de atualização silenciosa de token ao alternar abas/foco no navegador
        if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          return;
        }
        checkAuthAndWhitelist(session?.user ?? null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkAuthAndWhitelist]);

  // Carregar dados do Supabase
  const fetchData = useCallback(
    async (isSilent = false) => {
      if (!sessionUser) return;

      try {
        // Se já temos veículos carregados, não exibir skeleton de tela inteira
        if (!isSilent && veiculos.length === 0) setLoading(true);
        setError(null);

        const [vRes, aRes, rRes] = await Promise.all([
          supabase.from('ge_veiculos').select('*').order('created_at', { ascending: false }),
          supabase.from('ge_abastecimentos').select('*').order('created_at', { ascending: false }),
          supabase.from('ge_recargas').select('*').order('created_at', { ascending: false }),
        ]);

        if (vRes.error) throw new Error(`Erro ao carregar veículos: ${vRes.error.message}`);
        if (aRes.error) throw new Error(`Erro ao carregar abastecimentos: ${aRes.error.message}`);
        if (rRes.error) throw new Error(`Erro ao carregar recargas: ${rRes.error.message}`);

        const allV: Veiculo[] = vRes.data || [];
        const allA: Abastecimento[] = aRes.data || [];
        const allR: Recarga[] = rRes.data || [];

        const currentEmail = sessionUser.email?.toLowerCase();
        const filterForUser = !isAdmin || !viewAllRecords;

        const myV = filterForUser
          ? allV.filter(
              (v) =>
                !v.user_email ||
                v.user_email.toLowerCase() === currentEmail
            )
          : allV;

        const myA = filterForUser
          ? allA.filter(
              (a) =>
                !a.user_email ||
                a.user_email.toLowerCase() === currentEmail
            )
          : allA;

        const myR = filterForUser
          ? allR.filter(
              (r) =>
                !r.user_email ||
                r.user_email.toLowerCase() === currentEmail
            )
          : allR;

        setVeiculos(myV);
        setAbastecimentos(myA);
        setRecargas(myR);
      } catch (err: any) {
        console.error(err);
        setError(err?.message || 'Falha ao carregar dados do Supabase.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [sessionUser, isAdmin, viewAllRecords]
  );

  useEffect(() => {
    if (whitelistStatus === 'authorized' && sessionUser) {
      fetchData();
    }
  }, [whitelistStatus, sessionUser, fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
    showToast('Dados sincronizados com sucesso!');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // Carregar e persistir o último veículo selecionado no localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && veiculos.length > 0) {
      const savedPlaca = localStorage.getItem('iaz_selected_placa');
      if (savedPlaca && veiculos.some((v) => v.placa === savedPlaca)) {
        setSelectedPlaca(savedPlaca);
      }
    }
  }, [veiculos]);

  const handleSelectPlaca = (placa: string | null) => {
    setSelectedPlaca(placa);
    if (typeof window !== 'undefined') {
      if (placa) {
        localStorage.setItem('iaz_selected_placa', placa);
      } else {
        localStorage.removeItem('iaz_selected_placa');
      }
    }
  };

  // Determinar se o menu Academia deve aparecer:
  // Se houver veículo selecionado, obedece o tem_academia dele;
  // Se não houver, exibe se pelo menos um veículo tiver academia habilitada.
  const hasAcademiaEnabled = useMemo(() => {
    if (selectedPlaca) {
      const v = veiculos.find((veic) => veic.placa === selectedPlaca);
      return Boolean(v?.tem_academia);
    }
    return veiculos.some((v) => v.tem_academia);
  }, [veiculos, selectedPlaca]);

  // Se academia estiver inativa e o usuário estiver nela, redireciona para resumo
  useEffect(() => {
    if (activeTab === 'academia' && !hasAcademiaEnabled) {
      setActiveTab('resumo');
    }
  }, [activeTab, hasAcademiaEnabled]);

  // Filtragem por placa caso selecionado
  const baseFilteredAbastecimentos = useMemo(() => {
    if (!selectedPlaca) return abastecimentos;
    return abastecimentos.filter((a) => a.placa === selectedPlaca);
  }, [abastecimentos, selectedPlaca]);

  const baseFilteredRecargas = useMemo(() => {
    if (!selectedPlaca) return recargas;
    return recargas.filter((r) => r.placa === selectedPlaca);
  }, [recargas, selectedPlaca]);

  // Filtragem opcional pelo seletor de período (ano e mês)
  const filteredAbastecimentos = useMemo(() => {
    let list = baseFilteredAbastecimentos;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.placa.toLowerCase().includes(q) ||
          a.local?.toLowerCase().includes(q) ||
          a.tipo_gasolina.toLowerCase().includes(q) ||
          a.data.includes(q)
      );
    }
    if (!filterByPeriod) return list;
    const targetYear = selectedPeriodDate.getFullYear();
    const targetMonth = selectedPeriodDate.getMonth() + 1;
    return list.filter((a) => {
      const d = parseDate(a.data_hora || a.data);
      return d.getFullYear() === targetYear && d.getMonth() + 1 === targetMonth;
    });
  }, [baseFilteredAbastecimentos, searchQuery, filterByPeriod, selectedPeriodDate]);

  const filteredRecargas = useMemo(() => {
    let list = baseFilteredRecargas;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.placa.toLowerCase().includes(q) ||
          r.local?.toLowerCase().includes(q) ||
          r.data.includes(q)
      );
    }
    if (!filterByPeriod) return list;
    const targetYear = selectedPeriodDate.getFullYear();
    const targetMonth = selectedPeriodDate.getMonth() + 1;
    return list.filter((r) => {
      const d = parseDate(r.data_hora || r.data);
      return d.getFullYear() === targetYear && d.getMonth() + 1 === targetMonth;
    });
  }, [baseFilteredRecargas, searchQuery, filterByPeriod, selectedPeriodDate]);

  // Recargas da Academia
  const recargasAcademia = useMemo(() => {
    return filteredRecargas.filter((r) => r.academia === true);
  }, [filteredRecargas]);

  // Totais Gerais
  const totalGastoGasolina = useMemo(() => {
    return filteredAbastecimentos.reduce((acc, cur) => acc + (Number(cur.valor) || 0), 0);
  }, [filteredAbastecimentos]);

  const totalLitrosGasolina = useMemo(() => {
    return filteredAbastecimentos.reduce((acc, cur) => acc + (Number(cur.litros) || 0), 0);
  }, [filteredAbastecimentos]);

  const totalGastoEnergia = useMemo(() => {
    return filteredRecargas.reduce((acc, cur) => acc + (Number(cur.valor) || 0), 0);
  }, [filteredRecargas]);

  const totalKwaEnergia = useMemo(() => {
    return filteredRecargas.reduce((acc, cur) => acc + (Number(cur.kwa) || 0), 0);
  }, [filteredRecargas]);

  const totalGeral = totalGastoGasolina + totalGastoEnergia;

  const mediaGeralKmL = useMemo(() => {
    return calcularMediaKmL(filteredAbastecimentos);
  }, [filteredAbastecimentos]);

  const totalIdasAcademia = recargasAcademia.length;
  const valorTotalAcademia = totalIdasAcademia * 60;

  // Atividades Recentes (combinação dos últimos 4 registros)
  const recentActivity = useMemo(() => {
    const list: Array<
      | { type: 'gasolina'; data: Abastecimento; time: number }
      | { type: 'energia'; data: Recarga; time: number }
    > = [];

    for (const a of baseFilteredAbastecimentos) {
      list.push({
        type: 'gasolina',
        data: a,
        time: parseDate(a.data_hora || a.data).getTime(),
      });
    }

    for (const r of baseFilteredRecargas) {
      list.push({
        type: 'energia',
        data: r,
        time: parseDate(r.data_hora || r.data).getTime(),
      });
    }

    list.sort((a, b) => b.time - a.time);
    return list.slice(0, 5);
  }, [baseFilteredAbastecimentos, baseFilteredRecargas]);

  // Manipulação do Seletor de Período
  const handlePrevMonth = () => {
    setFilterByPeriod(true);
    setSelectedPeriodDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setFilterByPeriod(true);
    setSelectedPeriodDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const handleResetCurrentMonth = () => {
    setSelectedPeriodDate(new Date());
    setFilterByPeriod(false);
  };

  const currentPeriodLabel = useMemo(() => {
    const m = selectedPeriodDate.getMonth() + 1;
    const y = selectedPeriodDate.getFullYear();
    return `${getMonthName(m)} de ${y}`;
  }, [selectedPeriodDate]);

  // CRUD Operations
  const handleSaveVeiculo = async (data: Partial<Veiculo>, isEdit: boolean) => {
    const currentEmail = sessionUser?.email?.toLowerCase() || null;
    const currentUserId = sessionUser?.id || null;

    if (isEdit) {
      const updatePayload: any = {
        marca: data.marca,
        modelo: data.modelo,
        foto: data.foto,
        tem_academia: data.tem_academia ?? false,
      };
      if (currentEmail) updatePayload.user_email = currentEmail;

      const { error } = await supabase
        .from('ge_veiculos')
        .update(updatePayload)
        .eq('placa', data.placa as string);
      if (error) throw error;
      showToast('Veículo atualizado com sucesso!');
    } else {
      const insertPayload: any = {
        placa: data.placa as string,
        marca: data.marca as string,
        modelo: data.modelo as string,
        foto: data.foto,
        tem_academia: data.tem_academia ?? false,
        user_email: currentEmail,
        user_id: currentUserId,
      };

      const { error } = await supabase.from('ge_veiculos').insert([insertPayload]);
      if (error) throw error;
      showToast('Veículo cadastrado na sua conta!');
    }
    await fetchData(true);
  };

  const handleDeleteVeiculo = async (placa: string) => {
    const { error } = await supabase.from('ge_veiculos').delete().eq('placa', placa);
    if (error) throw error;
    if (selectedPlaca === placa) setSelectedPlaca(null);
    showToast(`Veículo ${placa} excluído.`);
    await fetchData(true);
  };

  const handleSaveAbastecimento = async (data: Partial<Abastecimento>, isEdit: boolean) => {
    const currentEmail = sessionUser?.email?.toLowerCase() || null;
    const currentUserId = sessionUser?.id || null;

    if (isEdit && data.id) {
      const updatePayload: any = {
        placa: data.placa,
        data_hora: data.data_hora,
        data: data.data,
        km: data.km,
        litros: data.litros,
        valor: data.valor,
        tipo_gasolina: data.tipo_gasolina,
        local: data.local,
      };
      if (currentEmail) updatePayload.user_email = currentEmail;

      const { error } = await supabase
        .from('ge_abastecimentos')
        .update(updatePayload)
        .eq('id', data.id);
      if (error) throw error;
      showToast('Abastecimento atualizado com sucesso!');
    } else {
      const insertPayload: any = {
        placa: data.placa as string,
        data_hora: data.data_hora as string,
        data: data.data as string,
        km: data.km as number,
        litros: data.litros as number,
        valor: data.valor as number,
        tipo_gasolina: data.tipo_gasolina as any,
        local: data.local,
        user_email: currentEmail,
        user_id: currentUserId,
      };

      const { error } = await supabase.from('ge_abastecimentos').insert([insertPayload]);
      if (error) throw error;
      showToast('Abastecimento registrado com sucesso!');
    }
    await fetchData(true);
  };

  const handleDeleteAbastecimento = async (id: string) => {
    const { error } = await supabase.from('ge_abastecimentos').delete().eq('id', id);
    if (error) throw error;
    showToast('Abastecimento excluído.');
    await fetchData(true);
  };

  const handleSaveRecarga = async (data: Partial<Recarga>, isEdit: boolean) => {
    const currentEmail = sessionUser?.email?.toLowerCase() || null;
    const currentUserId = sessionUser?.id || null;

    if (isEdit && data.id) {
      const updatePayload: any = {
        placa: data.placa,
        data_hora: data.data_hora,
        data: data.data,
        perc_inicial: data.perc_inicial,
        perc_final: data.perc_final,
        kwa: data.kwa,
        valor: data.valor,
        local: data.local,
        academia: data.academia ?? false,
      };
      if (currentEmail) updatePayload.user_email = currentEmail;

      const { error } = await supabase
        .from('ge_recargas')
        .update(updatePayload)
        .eq('id', data.id);
      if (error) throw error;
      showToast('Recarga atualizada com sucesso!');
    } else {
      const insertPayload: any = {
        placa: data.placa as string,
        data_hora: data.data_hora as string,
        data: data.data as string,
        perc_inicial: data.perc_inicial as number,
        perc_final: data.perc_final as number,
        kwa: data.kwa as number,
        valor: data.valor as number,
        local: data.local,
        academia: data.academia ?? false,
        user_email: currentEmail,
        user_id: currentUserId,
      };

      const { error } = await supabase.from('ge_recargas').insert([insertPayload]);
      if (error) throw error;
      showToast('Recarga registrada com sucesso!');
    }
    await fetchData(true);
  };

  const handleDeleteRecarga = async (id: string) => {
    const { error } = await supabase.from('ge_recargas').delete().eq('id', id);
    if (error) throw error;
    showToast('Recarga excluída.');
    await fetchData(true);
  };

  // Itens de Navegação em Squircles
  const navItems = useMemo(() => {
    const list: Array<{ id: IazTab; label: string; icon: any }> = [
      { id: 'resumo', label: 'Resumo', icon: Layers },
      { id: 'gasolina', label: 'Gasolina', icon: Fuel },
      { id: 'energia', label: 'Energia', icon: Zap },
      { id: 'graficos', label: 'Gráficos', icon: BarChart3 },
    ];

    if (hasAcademiaEnabled) {
      list.push({ id: 'academia', label: 'Academia', icon: Dumbbell });
    }

    list.push({ id: 'veiculos', label: 'Veículos', icon: Car });
    return list;
  }, [hasAcademiaEnabled]);

  // Título da Tela Ativa
  const activeScreenTitle = useMemo(() => {
    switch (activeTab) {
      case 'resumo':
        return 'Resumo Geral';
      case 'gasolina':
        return 'Combustível';
      case 'energia':
        return 'Recargas Elétricas';
      case 'graficos':
        return 'Gráficos & Análise';
      case 'academia':
        return 'Recargas na Academia';
      case 'veiculos':
        return 'Meus Veículos';
      default:
        return 'LitroWatt IAZ';
    }
  }, [activeTab]);

  // Condicionais de Carregamento e Bloqueio
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#000d3c] flex flex-col justify-center items-center px-4">
        <LogoBadge size="lg" className="animate-bounce mb-3" />
        <p className="text-xs text-slate-300 font-semibold tracking-wide">
          Carregando LitroWatt IAZ...
        </p>
      </div>
    );
  }

  if (!sessionUser) {
    return <LoginScreen />;
  }

  if (whitelistStatus !== 'authorized') {
    return (
      <AccessBlockedScreen
        userEmail={sessionUser.email || ''}
        userName={sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name}
        userAvatar={sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture}
        reason={whitelistStatus as BlockReason}
        whitelistData={whitelistData}
        onRefresh={() => checkAuthAndWhitelist(sessionUser)}
      />
    );
  }

  const userAvatar =
    sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture;
  const userName =
    sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email;
  const firstName = userName.split(' ')[0];

  return (
    <div className="min-h-screen bg-[#000d3c] text-slate-800 dark:text-slate-200">
      {/* Toast Padrão IAZ: Canto Superior Direito, Azul-Marinho com borda Laranja */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full animate-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between border ${
              toastMessage.type === 'error'
                ? 'bg-[#001652] text-white border-rose-600'
                : 'bg-[#001652] text-white border-[#ff6200]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  toastMessage.type === 'error' ? 'bg-rose-500' : 'bg-[#ff6200]'
                }`}
              />
              <span className="text-xs font-semibold">{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          1. TOPO AZUL-MARINHO (#000d3c, pb-7)
         ========================================================================= */}
      <header className="bg-[#000d3c] text-white pt-4 pb-8 px-4 sm:px-6 relative z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Esquerda: Avatar do usuário (+ pill com primeiro nome no >=sm) */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 p-1 rounded-full hover:bg-white/10 transition-colors focus:outline-none"
              title="Meu perfil"
            >
              {userAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-9 h-9 rounded-full object-cover border-2 border-[#ff6200]"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#001652] border-2 border-[#ff6200] flex items-center justify-center text-xs font-extrabold text-[#ffb800]">
                  {sessionUser.email?.slice(0, 2).toUpperCase()}
                </div>
              )}

              {/* Pill com primeiro nome e identificador no >=sm */}
              <div className="hidden sm:flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full text-xs font-bold text-white">
                <span>{firstName}</span>
                {isAdmin && (
                  <span className="bg-[#ff6200] text-white text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase">
                    Admin
                  </span>
                )}
              </div>
            </button>

            {/* Dropdown do Perfil */}
            {isProfileOpen && (
              <div
                className="absolute left-0 mt-2 w-72 bg-[#001652] text-white rounded-3xl p-4 shadow-2xl border border-white/15 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  {userAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="w-11 h-11 rounded-full object-cover border-2 border-[#ff6200]"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-[#000d3c] border-2 border-[#ff6200] flex items-center justify-center text-sm font-black text-[#ffb800]">
                      {sessionUser.email?.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="truncate">
                    <h4 className="text-sm font-extrabold text-white truncate">{userName}</h4>
                    <p className="text-[11px] text-slate-300 truncate font-mono">{sessionUser.email}</p>
                    <span className="inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#ff6200]/20 text-[#ffb800] uppercase">
                      {isAdmin ? 'Administrador' : 'Usuário Padrão'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between py-1 text-slate-300">
                    <span>Versão do App:</span>
                    <span className="font-mono text-white font-bold">LitroWatt v1.2.0</span>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsUsersModalOpen(true);
                      }}
                      className="w-full text-left py-2 px-3 rounded-xl hover:bg-white/10 text-white font-bold flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#ff6200]" />
                        <span>Painel de Usuários</span>
                      </span>
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">
                        Gerenciar
                      </span>
                    </button>
                  )}

                  {/* Toggle Exibição Admin */}
                  {isAdmin && (
                    <div className="pt-2 border-t border-white/10 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-300 flex items-center gap-1">
                        <Filter className="w-3 h-3 text-[#ff6200]" /> Filtro de Registros:
                      </span>
                      <div className="flex bg-[#000d3c] p-0.5 rounded-xl border border-white/10">
                        <button
                          onClick={() => setViewAllRecords(false)}
                          className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            !viewAllRecords ? 'bg-[#ff6200] text-white' : 'text-slate-400'
                          }`}
                        >
                          Meus
                        </button>
                        <button
                          onClick={() => setViewAllRecords(true)}
                          className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            viewAllRecords ? 'bg-[#ff6200] text-white' : 'text-slate-400'
                          }`}
                        >
                          Todos
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSignOut}
                    className="w-full text-left py-2 px-3 rounded-xl hover:bg-rose-500/20 text-rose-300 font-bold flex items-center gap-2 transition-colors pt-2 border-t border-white/10"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Sair da Conta</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Centro: Nome do App sem slogans */}
          <div className="flex items-center gap-2">
            <LogoBadge size="sm" />
            <span className="text-base sm:text-lg font-black tracking-tight text-white leading-none">
              LitroWatt <span className="text-[#ff6200]">IAZ</span>
            </span>
          </div>

          {/* Direita: Ícones Redondos nesta ordem: Buscar · Ajuda (?) em dourado · Tema · Sincronizar */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* 1. Buscar (lupa) */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-2 rounded-full transition-colors ${
                isSearchOpen ? 'bg-[#ff6200] text-white' : 'hover:bg-white/10 text-white'
              }`}
              title="Buscar registros"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* 2. Ajuda (?) em dourado #ffb800 */}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="p-2 rounded-full hover:bg-white/10 text-[#ffb800] transition-colors"
              title="Como usar esta tela"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* 3. Tema (lua/sol) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
              title={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
            >
              {isDark ? <Sun className="w-4 h-4 text-[#ffb800]" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* 4. Sincronizar */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
              title="Sincronizar dados com o Supabase"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#ff6200]' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. FOLHA CURVADA (-mt-4 rounded-t-[26px] bg-[#f4f5f7], max-w-5xl mx-auto)
         ========================================================================= */}
      <main className="iaz-sheet -mt-4 bg-[#f4f5f7] min-h-[calc(100vh-60px)] px-4 sm:px-6 pt-5 pb-16 relative z-30">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Barra de Busca Rápida (Expansível ao clicar na lupa) */}
          {isSearchOpen && (
            <div className="iaz-card p-3 animate-in fade-in slide-in-from-top-2 duration-150 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Buscar por placa, local, posto, tipo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* =========================================================================
              3. CABEÇALHO DA TELA (Título à esquerda, Botão de Olho à direita)
             ========================================================================= */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {activeScreenTitle}
              </h2>
            </div>

            {/* Botão de Olho: Ocultar / Mostrar Valores Monetários */}
            <button
              onClick={toggleHideValues}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all ${
                hideValues
                  ? 'bg-[#ff6200] text-white border-[#ff6200] shadow-sm'
                  : 'bg-white dark:bg-[#151f32] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-[#293548] hover:border-[#ff6200]'
              }`}
              title={hideValues ? 'Mostrar valores monetários' : 'Ocultar valores monetários'}
            >
              {hideValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {hideValues ? 'Valores Ocultos' : 'Ocultar Valores'}
              </span>
            </button>
          </div>

          {/* =========================================================================
              4. MENU DE ATALHOS EM SQUIRCLES (NAVEGAÇÃO PRINCIPAL EM TODAS AS TELAS)
             ========================================================================= */}
          <div className="flex items-center justify-between sm:justify-start sm:gap-4 w-full py-2 px-0.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const IconComponent = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="flex-1 sm:flex-initial sm:w-[68px] flex flex-col items-center group transition-all"
                >
                  <div
                    className={`w-11 h-11 sm:w-13 sm:h-13 squircle-btn flex items-center justify-center transition-all duration-200 border ${
                      isActive
                        ? 'bg-[#ff6200] text-white scale-105 shadow-md shadow-orange-500/25 ring-2 ring-[#ff6200]/25 ring-offset-2 ring-offset-[#f4f5f7] dark:ring-offset-[#0b1120] border-transparent'
                        : 'bg-white dark:bg-[#151f32] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-[#293548] group-hover:border-[#ff6200] group-hover:text-[#ff6200]'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 stroke-[1.9]" />
                  </div>
                  <span
                    className={`mt-1.5 text-[10px] sm:text-[11px] leading-tight text-center transition-colors ${
                      isActive
                        ? 'font-bold text-[#ff6200]'
                        : 'font-medium text-slate-600 dark:text-slate-400 group-hover:text-[#ff6200]'
                    }`}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="h-1 w-5 rounded-full bg-[#ff6200] mt-1 transition-all" />
                  )}
                </button>
              );
            })}
          </div>

          {/* =========================================================================
              5. SELETOR DE PERÍODO EM UMA ÚNICA LINHA
              ‹ · data início até data fim · › + pill "Mês Atual"
             ========================================================================= */}
          <div className="iaz-card px-4 py-2.5 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-extrabold text-slate-900 dark:text-slate-100">
                {currentPeriodLabel}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold"
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleResetCurrentMonth}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                !filterByPeriod
                  ? 'bg-[#ff6200]/15 text-[#ec7000]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#ec7000]'
              }`}
            >
              Mês Atual
            </button>
          </div>

          {/* =========================================================================
              COMBOBOX DE SELEÇÃO DE VEÍCULO (Substitui barra e memoriza último veículo)
             ========================================================================= */}
          {veiculos.length > 0 && (
            <div className="iaz-card p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-500/10 text-[#ff6200] flex-shrink-0">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                    Filtrar por Veículo
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {selectedPlaca
                      ? `${selectedPlaca} • ${
                          veiculos.find((v) => v.placa === selectedPlaca)?.modelo || ''
                        }`
                      : `Frota Completa (${veiculos.length} veículos)`}
                  </span>
                </div>
              </div>

              <div className="w-full sm:w-auto">
                <select
                  value={selectedPlaca || ''}
                  onChange={(e) => handleSelectPlaca(e.target.value ? e.target.value : null)}
                  className="w-full sm:min-w-[240px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#293548] bg-white dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#ff6200] cursor-pointer shadow-2xs"
                >
                  <option value="">🚗 Todos os Veículos ({veiculos.length})</option>
                  {veiculos.map((v) => (
                    <option key={v.placa} value={v.placa}>
                      {v.placa} • {v.marca} {v.modelo}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Erro de conexão se houver */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => fetchData()}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="space-y-4 py-2 animate-pulse">
              <div className="h-44 bg-slate-200 dark:bg-[#151f32] rounded-3xl" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-24 bg-slate-200 dark:bg-[#151f32] rounded-3xl" />
                <div className="h-24 bg-slate-200 dark:bg-[#151f32] rounded-3xl" />
              </div>
            </div>
          )}

          {/* =========================================================================
              CONTEÚDO DAS TELAS
             ========================================================================= */}
          {!loading && (
            <div className="space-y-4">
              {/* -------------------------------------------------------------------
                  TELA 1: RESUMO (DASHBOARD)
                 ------------------------------------------------------------------- */}
              {activeTab === 'resumo' && (
                <div className="space-y-4">
                  {/* Visão Geral do Investimento */}
                  <div className="iaz-card p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-orange-500/10 text-[#ff6200]">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] uppercase tracking-wide text-slate-500 font-bold block">
                            Total Investido
                          </span>
                          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                            {hideValues ? '••••' : formatCurrency(totalGeral)}
                          </h3>
                        </div>
                      </div>

                      {mediaGeralKmL !== null && (
                        <div className="text-right bg-slate-50 dark:bg-slate-900/60 px-3 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 block font-bold uppercase">
                            Média Global
                          </span>
                          <span className="text-xs font-black text-[#ff6200]">
                            {formatNumber(mediaGeralKmL, 2)} km/l
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Sub-cards: Combustível, Energia, Academia */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div
                        onClick={() => setActiveTab('gasolina')}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:border-amber-500/50 transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-bold text-xs">
                          <span className="flex items-center gap-1.5">
                            <Fuel className="w-4 h-4" /> Combustível
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {filteredAbastecimentos.length} reg.
                          </span>
                        </div>
                        <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                          {hideValues ? '••••' : formatCurrency(totalGastoGasolina)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {formatNumber(totalLitrosGasolina, 1)} L abastecidos
                        </p>
                      </div>

                      <div
                        onClick={() => setActiveTab('energia')}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:border-blue-500/50 transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold text-xs">
                          <span className="flex items-center gap-1.5">
                            <Zap className="w-4 h-4" /> Energia Elétrica
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {filteredRecargas.length} reg.
                          </span>
                        </div>
                        <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                          {hideValues ? '••••' : formatCurrency(totalGastoEnergia)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {formatNumber(totalKwaEnergia, 1)} kWh recarregados
                        </p>
                      </div>

                      {hasAcademiaEnabled && (
                        <div
                          onClick={() => setActiveTab('academia')}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:border-[#ff6200]/50 transition-all space-y-1"
                        >
                          <div className="flex items-center justify-between text-[#ff6200] font-bold text-xs">
                            <span className="flex items-center gap-1.5">
                              <Dumbbell className="w-4 h-4" /> Academia
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {totalIdasAcademia} idas
                            </span>
                          </div>
                          <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                            {hideValues ? '••••' : formatCurrency(valorTotalAcademia)}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {totalIdasAcademia} idas × R$ 60
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Carros em Destaque */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] uppercase tracking-wide text-slate-500 font-bold">
                        Veículo Ativo
                      </span>
                      <button
                        onClick={() => setActiveTab('veiculos')}
                        className="text-xs font-bold text-[#ff6200] hover:text-[#ec7000]"
                      >
                        Ver todos →
                      </button>
                    </div>

                    {veiculos.length === 0 ? (
                      <div className="iaz-card p-6 text-center space-y-3">
                        <Car className="w-10 h-10 text-slate-400 mx-auto" />
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          Nenhum veículo cadastrado
                        </h4>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">
                          Cadastre seu carro para começar a registrar consumo com fotos públicas sem direitos autorais.
                        </p>
                        <button
                          onClick={() => {
                            setVehicleToEdit(null);
                            setIsVehicleModalOpen(true);
                          }}
                          className="px-4 py-2 bg-[#ff6200] hover:bg-[#ec7000] text-white text-xs font-bold rounded-xl shadow-md transition-all"
                        >
                          Cadastrar Veículo
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {veiculos
                          .filter((v) => !selectedPlaca || v.placa === selectedPlaca)
                          .map((v) => (
                            <CarCard
                              key={v.placa}
                              veiculo={v}
                              abastecimentos={abastecimentos}
                              recargas={recargas}
                              isSelected={selectedPlaca === v.placa}
                              onSelect={() => handleSelectPlaca(v.placa)}
                              onEdit={(veic) => {
                                setVehicleToEdit(veic);
                                setIsVehicleModalOpen(true);
                              }}
                              onDelete={handleDeleteVeiculo}
                              hideValues={hideValues}
                            />
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Últimos Lançamentos */}
                  {recentActivity.length > 0 && (
                    <div className="iaz-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-wide text-slate-500 font-bold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> Últimos Lançamentos
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setFuelToEdit(null);
                              setIsFuelModalOpen(true);
                            }}
                            className="text-[11px] font-bold text-amber-600 hover:underline"
                          >
                            + Abastecer
                          </button>
                          <span>•</span>
                          <button
                            onClick={() => {
                              setRechargeToEdit(null);
                              setIsRechargeModalOpen(true);
                            }}
                            className="text-[11px] font-bold text-blue-600 hover:underline"
                          >
                            + Recarregar
                          </button>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {recentActivity.map((act, index) => {
                          if (act.type === 'gasolina') {
                            const a = act.data as Abastecimento;
                            return (
                              <div
                                key={a.id || index}
                                onClick={() => {
                                  setFuelToEdit(a);
                                  setIsFuelModalOpen(true);
                                }}
                                className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl cursor-pointer transition-colors"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <Fuel className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-slate-900 dark:text-slate-100">
                                        Gasolina {a.tipo_gasolina}
                                      </span>
                                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                                        {a.placa}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 block">
                                      {formatDateBR(a.data_hora || a.data)} • {formatNumber(a.litros, 2)} L
                                    </span>
                                  </div>
                                </div>
                                <span className="font-extrabold text-[#ff6200]">
                                  {hideValues ? '••••' : formatCurrency(a.valor)}
                                </span>
                              </div>
                            );
                          } else {
                            const r = act.data as Recarga;
                            return (
                              <div
                                key={r.id || index}
                                onClick={() => {
                                  setRechargeToEdit(r);
                                  setIsRechargeModalOpen(true);
                                }}
                                className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl cursor-pointer transition-colors"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    <Zap className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-slate-900 dark:text-slate-100">
                                        Recarga Elétrica
                                      </span>
                                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                                        {r.placa}
                                      </span>
                                      {r.academia && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ff6200]/10 text-[#ff6200] font-bold">
                                          Academia
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] text-slate-500 block">
                                      {formatDateBR(r.data_hora || r.data)} • {formatNumber(r.kwa, 2)} kWh
                                    </span>
                                  </div>
                                </div>
                                <span className="font-extrabold text-[#ff6200]">
                                  {hideValues ? '••••' : formatCurrency(r.valor)}
                                </span>
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* -------------------------------------------------------------------
                  TELA 2: GASOLINA (COMBUSTÍVEL)
                 ------------------------------------------------------------------- */}
              {activeTab === 'gasolina' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] uppercase tracking-wide text-slate-500 font-bold">
                        Histórico por Ano e Mês
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setFuelToEdit(null);
                        setIsFuelModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#ff6200] hover:bg-[#ec7000] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Novo Abastecimento</span>
                    </button>
                  </div>

                  <HierarquiaAnoMes
                    mode="gasolina"
                    abastecimentos={filteredAbastecimentos}
                    onEditAbastecimento={(item) => {
                      setFuelToEdit(item);
                      setIsFuelModalOpen(true);
                    }}
                    onDeleteAbastecimento={handleDeleteAbastecimento}
                    hideValues={hideValues}
                  />
                </div>
              )}

              {/* -------------------------------------------------------------------
                  TELA 3: ENERGIA (RECARDAS ELÉTRICAS)
                 ------------------------------------------------------------------- */}
              {activeTab === 'energia' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] uppercase tracking-wide text-slate-500 font-bold">
                        Histórico de Recargas por Ano e Mês
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setRechargeToEdit(null);
                        setIsRechargeModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#ff6200] hover:bg-[#ec7000] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nova Recarga</span>
                    </button>
                  </div>

                  <HierarquiaAnoMes
                    mode="energia"
                    recargas={filteredRecargas}
                    onEditRecarga={(item) => {
                      setRechargeToEdit(item);
                      setIsRechargeModalOpen(true);
                    }}
                    onDeleteRecarga={handleDeleteRecarga}
                    hideValues={hideValues}
                  />
                </div>
              )}

              {/* -------------------------------------------------------------------
                  TELA 4: GRÁFICOS (ANÁLISE MÊS A MÊS DE COMBUSTÍVEL E ENERGIA)
                 ------------------------------------------------------------------- */}
              {activeTab === 'graficos' && (
                <div className="space-y-4">
                  <GraficosScreen
                    abastecimentos={baseFilteredAbastecimentos}
                    recargas={baseFilteredRecargas}
                    veiculos={veiculos}
                    selectedPlaca={selectedPlaca}
                    hideValues={hideValues}
                  />
                </div>
              )}

              {/* -------------------------------------------------------------------
                  TELA 5: ACADEMIA (CONDICIONADA AO VEÍCULO)
                 ------------------------------------------------------------------- */}
              {activeTab === 'academia' && hasAcademiaEnabled && (
                <div className="space-y-4">
                  <div className="iaz-card p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] uppercase tracking-wide text-slate-500 font-bold">
                        Saldo Academia
                      </span>
                      <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">
                        {hideValues ? '••••' : formatCurrency(valorTotalAcademia)}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Total de {totalIdasAcademia} idas calculadas a R$ 60,00 cada
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-orange-500/10 text-[#ff6200]">
                      <Dumbbell className="w-6 h-6" />
                    </div>
                  </div>

                  <HierarquiaAnoMes
                    mode="academia"
                    recargas={filteredRecargas}
                    onEditRecarga={(item) => {
                      setRechargeToEdit(item);
                      setIsRechargeModalOpen(true);
                    }}
                    onDeleteRecarga={handleDeleteRecarga}
                    hideValues={hideValues}
                  />
                </div>
              )}

              {/* -------------------------------------------------------------------
                  TELA 6: VEÍCULOS (GARAGEM, FOTOS PÚBLICAS, ACADEMIA)
                 ------------------------------------------------------------------- */}
              {activeTab === 'veiculos' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] uppercase tracking-wide text-slate-500 font-bold">
                        Garagem Cadastrada
                      </span>
                      <p className="text-xs text-slate-500">
                        {veiculos.length} {veiculos.length === 1 ? 'veículo ativo' : 'veículos ativos'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setVehicleToEdit(null);
                        setIsVehicleModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#ff6200] hover:bg-[#ec7000] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Novo Veículo</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {veiculos.map((v) => (
                      <CarCard
                        key={v.placa}
                        veiculo={v}
                        abastecimentos={abastecimentos}
                        recargas={recargas}
                        isSelected={selectedPlaca === v.placa}
                        onSelect={() =>
                          setSelectedPlaca(selectedPlaca === v.placa ? null : v.placa)
                        }
                        onEdit={(veic) => {
                          setVehicleToEdit(veic);
                          setIsVehicleModalOpen(true);
                        }}
                        onDelete={handleDeleteVeiculo}
                        hideValues={hideValues}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* =========================================================================
          MODAIS DE CADASTRO E EDIÇÃO
         ========================================================================= */}
      <FormVeiculo
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        veiculoToEdit={vehicleToEdit}
        onSave={handleSaveVeiculo}
        onDelete={handleDeleteVeiculo}
      />

      <FormAbastecimento
        isOpen={isFuelModalOpen}
        onClose={() => setIsFuelModalOpen(false)}
        abastecimentoToEdit={fuelToEdit}
        veiculos={veiculos}
        defaultPlaca={selectedPlaca || undefined}
        onSave={handleSaveAbastecimento}
        onDelete={handleDeleteAbastecimento}
      />

      <FormRecarga
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        recargaToEdit={rechargeToEdit}
        veiculos={veiculos}
        defaultPlaca={selectedPlaca || undefined}
        onSave={handleSaveRecarga}
        onDelete={handleDeleteRecarga}
      />

      {isAdmin && (
        <GerenciarUsuariosModal
          isOpen={isUsersModalOpen}
          onClose={() => setIsUsersModalOpen(false)}
          currentUserEmail={sessionUser.email || ''}
        />
      )}

      {/* =========================================================================
          MODAL DE AJUDA CONTEXTUAL (?)
         ========================================================================= */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#151f32] border border-slate-200/80 dark:border-[#293548] w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-[#ffb800]">
                <HelpCircle className="w-5 h-5 text-[#ff6200]" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  Como usar: {activeScreenTitle}
                </h3>
              </div>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              {activeTab === 'resumo' && (
                <>
                  <p>
                    • <strong>Visão Geral:</strong> Acompanhe o total investido em reais e o consumo médio global em km/l.
                  </p>
                  <p>
                    • <strong>Ocultar Valores:</strong> Clique no botão com o ícone de olho no topo para mascarar os valores monetários quando estiver em público.
                  </p>
                  <p>
                    • <strong>Filtro de Veículo:</strong> Toque na placa de qualquer veículo na barra superior para filtrar os dados exclusivamente para ele.
                  </p>
                </>
              )}

              {activeTab === 'gasolina' && (
                <>
                  <p>
                    • <strong>Histórico Hierárquico:</strong> Os abastecimentos são agrupados automaticamente por Ano e Mês. Toque nas setas para expandir ou recolher.
                  </p>
                  <p>
                    • <strong>Novo Lançamento:</strong> Clique em "+ Novo Abastecimento" para registrar litros, odômetro e valor total pago.
                  </p>
                </>
              )}

              {activeTab === 'energia' && (
                <>
                  <p>
                    • <strong>Recargas Elétricas:</strong> Visualize todas as cargas realizadas com medição de energia (kWh) e porcentagem de bateria.
                  </p>
                  <p>
                    • <strong>Localização:</strong> Você pode usar o botão "GPS Atual" para salvar o local exato da recarga.
                  </p>
                </>
              )}

              {activeTab === 'graficos' && (
                <>
                  <p>
                    • <strong>Comparativo Mensal:</strong> Acompanhe a evolução mês a mês dos seus gastos em R$ ou do volume (Litros x kWh).
                  </p>
                  <p>
                    • <strong>Proporção:</strong> Veja a divisão percentual entre gastos com combustível e eletricidade para mensurar a economia.
                  </p>
                </>
              )}

              {activeTab === 'academia' && (
                <>
                  <p>
                    • <strong>Controle de Idas:</strong> Esta tela contabiliza as recargas associadas aos treinos na academia, multiplicando cada ida por R$ 60,00.
                  </p>
                  <p>
                    • <strong>Configuração:</strong> Esta aba só aparece se o veículo ativo tiver a opção "Academia" marcada no seu cadastro.
                  </p>
                </>
              )}

              {activeTab === 'veiculos' && (
                <>
                  <p>
                    • <strong>Fotos Públicas Automáticas:</strong> Se você não informar uma foto própria, o LitroWatt IAZ busca uma foto pública sem direitos autorais no Wikimedia Commons.
                  </p>
                  <p>
                    • <strong>Opção Academia:</strong> Marque a opção de academia em cada veículo híbrido/elétrico para habilitar o rastreamento correspondente.
                  </p>
                </>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsHelpOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#ff6200] hover:bg-[#ec7000] text-white font-bold text-xs transition-colors shadow-sm"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
