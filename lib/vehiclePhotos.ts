/**
 * Utilitário para busca e fallback de fotos públicas e sem direitos autorais de veículos.
 * Usa Wikimedia Commons (domínio público / Creative Commons) e catálogo curado.
 */

// Catálogo curado de veículos comuns com fotos de domínio público / Wikimedia Commons
const CURATED_PUBLIC_PHOTOS: Record<string, string> = {
  'BYD SONG PRO':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/BYD_Song_Pro_DM-i_Champion_Edition_001.jpg/800px-BYD_Song_Pro_DM-i_Champion_Edition_001.jpg',
  'BYD SONG PLUS':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/BYD_Song_Plus_DM-i_001.jpg/800px-BYD_Song_Plus_DM-i_001.jpg',
  'BYD DOLPHIN':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/BYD_Dolphin_001.jpg/800px-BYD_Dolphin_001.jpg',
  'BYD SEAL':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/BYD_Seal_001.jpg/800px-BYD_Seal_001.jpg',
  'BYD YUAN PLUS':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/BYD_Yuan_Plus_001.jpg/800px-BYD_Yuan_Plus_001.jpg',
  'TIGGO 5X':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/2020_Chery_Tiggo_5X_%28facelift%2C_front%29.jpg/800px-2020_Chery_Tiggo_5X_%28facelift%2C_front%29.jpg',
  'TIGGO 7':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Chery_Tiggo_7_Pro_001.jpg/800px-Chery_Tiggo_7_Pro_001.jpg',
  'TIGGO 8':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Chery_Tiggo_8_Pro_PHEV_001.jpg/800px-Chery_Tiggo_8_Pro_PHEV_001.jpg',
  'HAVAL H6':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Haval_H6_III_01_China_2020-10-06.jpg/800px-Haval_H6_III_01_China_2020-10-06.jpg',
  'ORA 03':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Ora_Funky_Cat_IAA_2021_1X7A0265.jpg/800px-Ora_Funky_Cat_IAA_2021_1X7A0265.jpg',
  'COROLLA CROSS':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Toyota_Corolla_Cross_1.8_Hybrid_Premium_Safety_2020.jpg/800px-Toyota_Corolla_Cross_1.8_Hybrid_Premium_Safety_2020.jpg',
  'COROLLA':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Toyota_Corolla_%28E210%29_Sedan_IMG_2357.jpg/800px-Toyota_Corolla_%28E210%29_Sedan_IMG_2357.jpg',
  'KWID':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Renault_Kwid_E-Tech_Electric_01.jpg/800px-Renault_Kwid_E-Tech_Electric_01.jpg',
  'COMPASS':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Jeep_Compass_4xe_IAA_2021_1X7A0086.jpg/800px-Jeep_Compass_4xe_IAA_2021_1X7A0086.jpg',
  'RENEGADE':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/2019_Jeep_Renegade_Night_Eagle_1.0.jpg/800px-2019_Jeep_Renegade_Night_Eagle_1.0.jpg',
  'VOLVO XC60':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Volvo_XC60_T8_Recharge_IAA_2021_1X7A0146.jpg/800px-Volvo_XC60_T8_Recharge_IAA_2021_1X7A0146.jpg',
  'VOLVO EX30':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Volvo_EX30_Single_Motor_Ultra_Cloud_Blue_2024.jpg/800px-Volvo_EX30_Single_Motor_Ultra_Cloud_Blue_2024.jpg',
};

// Foto genérica de carro moderna sem direitos autorais para fallback geral
export const GENERIC_VEHICLE_PHOTO =
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80';

/**
 * Retorna uma foto pública sem direitos autorais para a marca/modelo informados.
 */
export function getDefaultVehiclePhoto(marca?: string | null, modelo?: string | null): string {
  const searchKey = `${marca || ''} ${modelo || ''}`.toUpperCase().trim();

  for (const [key, url] of Object.entries(CURATED_PUBLIC_PHOTOS)) {
    if (searchKey.includes(key)) {
      return url;
    }
  }

  // Tentar match apenas por modelo
  const modeloKey = (modelo || '').toUpperCase().trim();
  if (modeloKey) {
    for (const [key, url] of Object.entries(CURATED_PUBLIC_PHOTOS)) {
      if (key.includes(modeloKey) || modeloKey.includes(key)) {
        return url;
      }
    }
  }

  return GENERIC_VEHICLE_PHOTO;
}

/**
 * Formata ou provê uma foto pública segura para exibição do veículo.
 */
export function getVehicleDisplayPhoto(veiculo?: {
  marca?: string | null;
  modelo?: string | null;
  foto?: string | null;
}): string {
  if (!veiculo) return GENERIC_VEHICLE_PHOTO;

  const raw = veiculo.foto?.trim();
  if (raw && raw.length > 5) {
    // Caso seja link do Google Drive
    if (raw.includes('drive.google.com') || raw.includes('googleusercontent.com')) {
      const matchFile = raw.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (matchFile && matchFile[1]) {
        return `https://lh3.googleusercontent.com/d/${matchFile[1]}`;
      }
      const matchId = raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (matchId && matchId[1]) {
        return `https://lh3.googleusercontent.com/d/${matchId[1]}`;
      }
      return raw;
    }
    return raw;
  }

  return getDefaultVehiclePhoto(veiculo.marca, veiculo.modelo);
}

export interface PublicPhotoResult {
  url: string;
  title: string;
  source: string;
}

/**
 * Busca fotos públicas e sem direitos autorais no Wikimedia Commons via API oficial com CORS livre.
 */
export async function searchPublicVehiclePhotos(query: string): Promise<PublicPhotoResult[]> {
  const clean = query.trim();
  if (!clean) return [];

  const results: PublicPhotoResult[] = [];

  // 1. Verificar se temos no catálogo curado de alta qualidade
  const defaultFromCatalog = getDefaultVehiclePhoto('', clean);
  if (defaultFromCatalog && defaultFromCatalog !== GENERIC_VEHICLE_PHOTO) {
    results.push({
      url: defaultFromCatalog,
      title: `${clean} (Recomendada)`,
      source: 'Wikimedia Commons',
    });
  }

  try {
    const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      clean + ' car'
    )}&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`;

    const res = await fetch(endpoint, { cache: 'force-cache' });
    if (!res.ok) throw new Error('Falha na resposta do Wikimedia');
    const data = await res.json();

    const pages = data?.query?.pages || {};
    for (const pageId of Object.keys(pages)) {
      const p = pages[pageId];
      const ii = p?.imageinfo?.[0];
      if (ii) {
        const thumbUrl = ii.thumburl || ii.url;
        const lower = thumbUrl.toLowerCase();
        // Apenas imagens jpg, png, webp
        if (
          (lower.endsWith('.jpg') ||
            lower.endsWith('.jpeg') ||
            lower.endsWith('.png') ||
            lower.endsWith('.webp')) &&
          !results.some((r) => r.url === thumbUrl)
        ) {
          results.push({
            url: thumbUrl,
            title: p.title?.replace('File:', '') || clean,
            source: 'Wikimedia Commons (Domínio Público)',
          });
        }
      }
      if (results.length >= 8) break;
    }
  } catch (err) {
    console.warn('Erro ao pesquisar fotos no Wikimedia Commons:', err);
  }

  if (results.length === 0) {
    results.push({
      url: GENERIC_VEHICLE_PHOTO,
      title: 'Veículo Moderno (Unsplash Free)',
      source: 'Unsplash (Livre)',
    });
  }

  return results;
}
