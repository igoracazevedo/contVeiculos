export type TipoGasolina = 'COMUM' | 'ADITIVADA' | 'PODIUM';

export interface Veiculo {
  placa: string;
  marca: string;
  modelo: string;
  foto?: string | null;
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
    };
  };
}
