import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Faz o parse confiável de datas nos formatos:
 * - DD/MM/YYYY HH:mm:ss ou DD/MM/YYYY HH:mm
 * - DD/MM/YYYY
 * - YYYY-MM-DDTHH:mm:ss ou YYYY-MM-DD
 */
export function parseDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();
  const trimmed = dateStr.trim();

  // Formato brasileiro: DD/MM/YYYY ou DD/MM/YYYY HH:mm:ss
  const brMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (brMatch) {
    const [, day, month, year, hours, minutes, seconds] = brMatch;
    return new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
      hours ? parseInt(hours, 10) : 0,
      minutes ? parseInt(minutes, 10) : 0,
      seconds ? parseInt(seconds, 10) : 0
    );
  }

  // Tentar parse ISO padrão
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Formata um objeto Date para string no padrão do banco: DD/MM/YYYY
 */
export function formatToDbDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formata um objeto Date para string no padrão do banco: DD/MM/YYYY HH:mm:ss
 */
export function formatToDbDateTime(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Converte data do banco para formato do input HTML datetime-local (YYYY-MM-DDTHH:mm)
 */
export function dateToInputDateTime(dateStr: string | null | undefined): string {
  const d = parseDate(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Formata valores numéricos para a moeda brasileira (BRL).
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formata valor digitado como máscara de moeda brasileira: '1.234,56'
 */
export function formatCurrencyMask(input: string | number | null | undefined): string {
  if (input === null || input === undefined || input === '') return '0,00';
  // Extrair apenas dígitos
  const digits = String(input).replace(/\D/g, '');
  if (!digits) return '0,00';
  const floatVal = parseInt(digits, 10) / 100;
  return floatVal.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte string mascarada '1.234,56' para número float: 1234.56
 */
export function parseCurrencyMask(maskedText: string | null | undefined): number {
  if (!maskedText) return 0;
  const digits = String(maskedText).replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

/**
 * Formata números no padrão pt-BR (ex: 1.234,56).
 */
export function formatNumber(
  value: number | null | undefined,
  minimumFractionDigits = 2,
  maximumFractionDigits = 2
): string {
  if (value === null || value === undefined || isNaN(value)) return '0,00';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits,
    maximumFractionDigits,
  });
}

/**
 * Converte para DD/MM/AAAA.
 */
export function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const d = parseDate(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Converte para DD/MM/AAAA HH:mm.
 */
export function formatDateTimeBR(dateTimeStr: string | null | undefined): string {
  if (!dateTimeStr) return '-';
  const d = parseDate(dateTimeStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} às ${hours}:${minutes}`;
}

/**
 * Retorna o nome por extenso do mês (1 a 12).
 */
export function getMonthName(monthNumber: number): string {
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return months[monthNumber - 1] || `Mês ${monthNumber}`;
}

/**
 * Converte links públicos do Google Drive (/file/d/ID/view) para link direto de imagem:
 * https://lh3.googleusercontent.com/d/ID
 */
export function formatGoogleDriveUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Caso já seja lh3
  if (trimmed.includes('googleusercontent.com')) return trimmed;

  // Formato /file/d/ID
  const matchFile = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFile && matchFile[1]) {
    return `https://lh3.googleusercontent.com/d/${matchFile[1]}`;
  }

  // Formato ?id=ID ou &id=ID
  const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) {
    return `https://lh3.googleusercontent.com/d/${matchId[1]}`;
  }

  return trimmed;
}

/**
 * Tenta extrair latitude e longitude de uma string de local (ex: "-23.55052, -46.633309")
 */
export function parseCoordinates(local?: string | null): { lat: number; lng: number } | null {
  if (!local) return null;
  const regex = /([-+]?[1-8]?\d(?:\.\d+)?|[-+]?90(?:\.0+)?),\s*([-+]?(?:180(?:\.0+)?|(?:1[0-7]\d|\d{1,2})(?:\.\d+)?))/;
  const match = local.match(regex);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }
  return null;
}

/**
 * Calcula a média geral em km/l por veículo:
 * (max(km) - min(km)) / total(litros)
 */
export function calcularMediaKmL(
  abastecimentos: { km: number; litros: number }[]
): number | null {
  if (!abastecimentos || abastecimentos.length < 2) return null;

  let minKm = Infinity;
  let maxKm = -Infinity;
  let totalLitros = 0;

  for (const ab of abastecimentos) {
    const km = Number(ab.km);
    const litros = Number(ab.litros);
    if (!isNaN(km)) {
      if (km < minKm) minKm = km;
      if (km > maxKm) maxKm = km;
    }
    if (!isNaN(litros)) {
      totalLitros += litros;
    }
  }

  const deltaKm = maxKm - minKm;
  if (deltaKm <= 0 || totalLitros <= 0) return null;

  return deltaKm / totalLitros;
}
