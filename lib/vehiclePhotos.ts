/**
 * Utilitário para busca e fallback de fotos públicas e sem direitos autorais de veículos.
 * Usa Wikimedia Commons (domínio público / Creative Commons) e catálogo curado de alta disponibilidade.
 */

// Catálogo curado de veículos com fotos públicas de alta qualidade e CDN garantido
const CURATED_PUBLIC_PHOTOS: Record<string, string[]> = {
  'TIGGO 5X': [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/2020_Chery_Tiggo_5X_%28facelift%2C_front%29.jpg/800px-2020_Chery_Tiggo_5X_%28facelift%2C_front%29.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Chery_Tiggo_5X.jpg/800px-Chery_Tiggo_5X.jpg',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
  ],
  'SONG PRO': [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/BYD_Song_Pro_DM-i_Champion_Edition_001.jpg/800px-BYD_Song_Pro_DM-i_Champion_Edition_001.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/BYD_Song_Plus_DM-i_001.jpg/800px-BYD_Song_Plus_DM-i_001.jpg',
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
  ],
  'SONG PLUS': [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/BYD_Song_Plus_DM-i_001.jpg/800px-BYD_Song_Plus_DM-i_001.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/BYD_Song_Pro_DM-i_Champion_Edition_001.jpg/800px-BYD_Song_Pro_DM-i_Champion_Edition_001.jpg',
  ],
  'DOLPHIN': [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/BYD_Dolphin_001.jpg/800px-BYD_Dolphin_001.jpg',
  ],
  'SEAL': [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/BYD_Seal_001.jpg/800px-BYD_Seal_001.jpg',
  ],
  'HAVAL H6': [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Haval_H6_III_01_China_2020-10-06.jpg/800px-Haval_H6_III_01_China_2020-10-06.jpg',
  ],
  'COROLLA CROSS': [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Toyota_Corolla_Cross_1.8_Hybrid_Premium_Safety_2020.jpg/800px-Toyota_Corolla_Cross_1.8_Hybrid_Premium_Safety_2020.jpg',
  ],
  'KWID': [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Renault_Kwid_E-Tech_Electric_01.jpg/800px-Renault_Kwid_E-Tech_Electric_01.jpg',
  ],
  'COMPASS': [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Jeep_Compass_4xe_IAA_2021_1X7A0086.jpg/800px-Jeep_Compass_4xe_IAA_2021_1X7A0086.jpg',
  ],
  'VOLVO EX30': [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Volvo_EX30_Single_Motor_Ultra_Cloud_Blue_2024.jpg/800px-Volvo_EX30_Single_Motor_Ultra_Cloud_Blue_2024.jpg',
  ],
};

// Fotos genéricas de alta qualidade (Unsplash Car Photos)
export const GENERIC_VEHICLE_PHOTOS = [
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80',
];

export const GENERIC_VEHICLE_PHOTO = GENERIC_VEHICLE_PHOTOS[0];

/**
 * Retorna uma foto pública sem direitos autorais para a marca/modelo informados.
 */
export function getDefaultVehiclePhoto(marca?: string | null, modelo?: string | null): string {
  const searchKey = `${marca || ''} ${modelo || ''}`.toUpperCase().trim();

  for (const [key, urls] of Object.entries(CURATED_PUBLIC_PHOTOS)) {
    if (searchKey.includes(key)) {
      return urls[0];
    }
  }

  const modeloKey = (modelo || '').toUpperCase().trim();
  if (modeloKey) {
    for (const [key, urls] of Object.entries(CURATED_PUBLIC_PHOTOS)) {
      if (key.includes(modeloKey) || modeloKey.includes(key)) {
        return urls[0];
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
 * Busca fotos públicas e sem direitos autorais via Wikimedia Commons e catálogo curado.
 */
export async function searchPublicVehiclePhotos(query: string): Promise<PublicPhotoResult[]> {
  const clean = query.trim();
  if (!clean) return [];

  const results: PublicPhotoResult[] = [];
  const queryUpper = clean.toUpperCase();

  // 1. Verificar correspondências no catálogo curado
  for (const [key, urls] of Object.entries(CURATED_PUBLIC_PHOTOS)) {
    if (queryUpper.includes(key) || key.includes(queryUpper)) {
      urls.forEach((u, i) => {
        results.push({
          url: u,
          title: `${clean} - Opção ${i + 1}`,
          source: 'Wikimedia / Unsplash (Livre)',
        });
      });
      break;
    }
  }

  // 2. Consulta à API oficial do Wikimedia Commons com CORS aberto
  try {
    const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      clean + ' car'
    )}&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`;

    const res = await fetch(endpoint, { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      const pages = data?.query?.pages || {};

      for (const pageId of Object.keys(pages)) {
        const p = pages[pageId];
        const ii = p?.imageinfo?.[0];
        if (ii) {
          // Limpar parâmetros de query (ex: ?utm_...) que quebravam validação de formato
          const rawUrl = ii.thumburl || ii.url || '';
          const cleanUrl = rawUrl.split('?')[0].replace('http://', 'https://');
          const lower = cleanUrl.toLowerCase();

          if (
            (lower.endsWith('.jpg') ||
              lower.endsWith('.jpeg') ||
              lower.endsWith('.png') ||
              lower.endsWith('.webp')) &&
            !results.some((r) => r.url === cleanUrl)
          ) {
            results.push({
              url: cleanUrl,
              title: p.title?.replace('File:', '').replace(/\.[^/.]+$/, '') || clean,
              source: 'Wikimedia Commons (Domínio Público)',
            });
          }
        }
        if (results.length >= 8) break;
      }
    }
  } catch (err) {
    console.warn('Erro ao consultar Wikimedia Commons:', err);
  }

  // 3. Adicionar fotos de alta definição garantidas do Unsplash Automotive
  GENERIC_VEHICLE_PHOTOS.forEach((u, idx) => {
    if (results.length < 6 && !results.some((r) => r.url === u)) {
      results.push({
        url: u,
        title: `Carro Moderno ${idx + 1}`,
        source: 'Unsplash (Livre de Direitos)',
      });
    }
  });

  return results;
}
