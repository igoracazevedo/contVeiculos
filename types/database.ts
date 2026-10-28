export type TipoGasolina = 'COMUM' | 'ADITIVADA' | 'PODIUM';
export type UserRole = 'admin' | 'usuario';

export interface UsuarioLiberado {
  id: string;
  email: string;
  nome?: string | null;
  data_inicio: string; // YYYY-MM-DD
  data_fim: string;    // YYYY-MM-DD
  ativo: boolean;
  role: UserRole;
  created_at?: string;
}

export interface Veiculo {
  placa: string;
  marca: string;
  modelo: string;
  foto?: string | null;
  user_id?: string | null;
  user_email?: string | null;
  created_at?: string;
}

export interface Abastecimento {
  id: string;
  data_hora: string;
  data: string;
  placa: string;
  km: number;
  litros: number;
  valor: number;
  tipo_gasolina: TipoGasolina;
  local?: string | null;
  user_id?: string | null;
  user_email?: string | null;
  created_at?: string;
}

export interface Recarga {
  id: string;
  data_hora: string;
  data: string;
  placa: string;
  perc_inicial: number;
  perc_final: number;
  kwa: number;
  valor: number;
  local?: string | null;
  academia: boolean;
  user_id?: string | null;
  user_email?: string | null;
  created_at?: string;
}

export interface Database {
  public: {
    Tables: {
      veiculos: {
        Row: Veiculo;
        Insert: Partial<Veiculo>;
        Update: Partial<Veiculo>;
      };
      abastecimentos: {
        Row: Abastecimento;
        Insert: Partial<Abastecimento>;
        Update: Partial<Abastecimento>;
      };
      recargas: {
        Row: Recarga;
        Insert: Partial<Recarga>;
        Update: Partial<Recarga>;
      };
      usuarios_liberados: {
        Row: UsuarioLiberado;
        Insert: Partial<UsuarioLiberado>;
        Update: Partial<UsuarioLiberado>;
      };
    };
  };
}
