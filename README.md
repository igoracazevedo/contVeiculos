# 🚗 IazGas & Energia

Aplicação **mobile-first** desenvolvida com **Next.js (App Router)**, **TypeScript** e **Tailwind CSS**, conectada diretamente ao **Supabase** para controle e gestão inteligente de veículos a combustão, elétricos e híbridos.

---

## ⚡ Funcionalidades

- **Dashboard Geral**: visão consolidada dos veículos, fotos, média de consumo geral em km/l e total acumulado (Gasolina + Energia).
- **Controle de Abastecimentos**:
  - Cálculo automático de preço por litro (`R$/L`).
  - Registro de tipo de gasolina (`COMUM`, `ADITIVADA`, `PODIUM`).
  - Cálculo de média geral em km/l por veículo: `(max(km) - min(km)) / total(litros)`.
- **Controle de Recargas Elétricas**:
  - % inicial e final da bateria, consumo em kWh e valor total.
  - Tag destacada para recargas realizadas na academia.
- **Seção Academia**:
  - Filtro exclusivo de idas à academia (`academia = true`).
  - Cálculo mensal automático de custo/economia por quantidade de idas ($\text{Idas} \times \text{R\$\ }60{,}00$).
- **Mini-Mapa OpenStreetMap**:
  - Detecção de coordenadas GPS com botão "Obter GPS Atual".
  - Iframe nativo OpenStreetMap embutido e atalho direto para o Google Maps.
- **Visualização Hierárquica em Acordeom (2 Níveis)**:
  - **Nível 1**: Agrupamento por Ano com resumo monetário e volumétrico acumulado.
  - **Nível 2**: Agrupamento por Mês.
  - **Nível 3**: Cards com detalhes completos e ações de edição e exclusão.
- **CRUD Completo com Confirmação**: Veículos, Abastecimentos e Recargas.
- **Tema Escuro Moderno**: paleta em tons `slate-950`, `slate-900`, `sky-400` e `emerald-400`.

---

## 🛠️ Tecnologias Utilizadas

- **[Next.js 14](https://nextjs.org/)** (App Router)
- **[React 18](https://react.dev/)**
- **[TypeScript](https://www.typescriptlang.org/)**
- **[Tailwind CSS](https://tailwindcss.com/)**
- **[@supabase/supabase-js](https://supabase.com/)**
- **[Lucide React](https://lucide.dev/)** (Ícones vetoriais modernos)

---

## 🚀 Como Executar Localmente

### 1. Clonar o repositório
```bash
git clone https://github.com/igoracazevedo/contVeiculos.git
cd contVeiculos
```

### 2. Configurar variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto com as credenciais do seu Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://cyzohyvnpnjpkuusdxiq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### 3. Instalar dependências
```bash
npm install
```

### 4. Iniciar em modo de desenvolvimento
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.
