-- ==============================================================================
-- IazGas & Energia - Script Completo com Prefixo GE_
-- Projeto: kslmyvlewsmjnrhwklfd (https://kslmyvlewsmjnrhwklfd.supabase.co)
-- Executar no SQL Editor: https://supabase.com/dashboard/project/kslmyvlewsmjnrhwklfd/sql
-- ==============================================================================

-- 1. Criar Tabela de Veículos (ge_veiculos)
CREATE TABLE IF NOT EXISTS public.ge_veiculos (
  placa TEXT PRIMARY KEY,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  foto TEXT,
  user_id UUID,
  user_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Criar Tabela de Abastecimentos (ge_abastecimentos)
CREATE TABLE IF NOT EXISTS public.ge_abastecimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_hora TEXT NOT NULL,
  data TEXT NOT NULL,
  placa TEXT NOT NULL REFERENCES public.ge_veiculos(placa) ON DELETE CASCADE,
  km NUMERIC NOT NULL,
  litros NUMERIC NOT NULL,
  valor NUMERIC NOT NULL,
  tipo_gasolina TEXT NOT NULL DEFAULT 'COMUM',
  local TEXT,
  user_id UUID,
  user_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Criar Tabela de Recargas (ge_recargas)
CREATE TABLE IF NOT EXISTS public.ge_recargas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_hora TEXT NOT NULL,
  data TEXT NOT NULL,
  placa TEXT NOT NULL REFERENCES public.ge_veiculos(placa) ON DELETE CASCADE,
  perc_inicial NUMERIC NOT NULL,
  perc_final NUMERIC NOT NULL,
  kwa NUMERIC NOT NULL,
  valor NUMERIC NOT NULL,
  local TEXT,
  academia BOOLEAN NOT NULL DEFAULT false,
  user_id UUID,
  user_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Criar Tabela de Usuários Liberados (ge_usuarios_liberados)
CREATE TABLE IF NOT EXISTS public.ge_usuarios_liberados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nome TEXT,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '10 years'),
  ativo BOOLEAN NOT NULL DEFAULT true,
  role TEXT NOT NULL DEFAULT 'usuario',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir Administrador Inicial
INSERT INTO public.ge_usuarios_liberados (email, nome, data_inicio, data_fim, ativo, role)
VALUES ('igoracazevedo@gmail.com', 'Igor Azevedo (Admin)', CURRENT_DATE, (CURRENT_DATE + INTERVAL '10 years'), true, 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin', ativo = true;

-- Habilitar RLS nas tabelas GE_
ALTER TABLE public.ge_veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ge_abastecimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ge_recargas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ge_usuarios_liberados ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Acesso ge_veiculos para autenticados e anon" ON public.ge_veiculos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso ge_abastecimentos para autenticados e anon" ON public.ge_abastecimentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso ge_recargas para autenticados e anon" ON public.ge_recargas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso ge_usuarios_liberados para autenticados e anon" ON public.ge_usuarios_liberados FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 5. Importação dos Dados Existentes
-- ==============================================================================

-- Inserir Veículos em ge_veiculos
INSERT INTO public.ge_veiculos (placa, marca, modelo, foto, user_email) VALUES ('TID-5G50', 'BYD', 'SONG PRO GS', 'https://lh3.googleusercontent.com/d/1RLYwxAsMnzJOOYe4AnYLhsvBM9uC4kvP', 'igoracazevedo@gmail.com') ON CONFLICT (placa) DO NOTHING;

-- Inserir Abastecimentos em ge_abastecimentos
INSERT INTO public.ge_abastecimentos (id, data_hora, data, placa, km, litros, valor, tipo_gasolina, local, user_email) VALUES ('1ad4c2da-06c0-415f-89f5-e314bcf2a831', '03/11/2025 16:28:00', '03/11/2025', 'TID-5G50', 24, 44.07, 280.72, 'ADITIVADA', '-3.737951, -38.474991', 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_abastecimentos (id, data_hora, data, placa, km, litros, valor, tipo_gasolina, local, user_email) VALUES ('967ff89b-ad50-4588-93fc-5d5932a295e3', '02/12/2025 16:29:00', '02/12/2025', 'TID-5G50', 624, 43.53, 266.84, 'COMUM', '-3.738087, -38.474834', 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_abastecimentos (id, data_hora, data, placa, km, litros, valor, tipo_gasolina, local, user_email) VALUES ('a0507ec1-808d-4aa9-adc9-9dff78e4faeb', '27/12/2025 16:30:00', '27/12/2025', 'TID-5G50', 1662, 44.28, 269.67, 'COMUM', '-3.741624, -38.474729', 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_abastecimentos (id, data_hora, data, placa, km, litros, valor, tipo_gasolina, local, user_email) VALUES ('1c44ffd9-2a33-4b1d-8660-b37dbfa14bc9', '15/01/2026 16:31:00', '15/01/2026', 'TID-5G50', 2042, 30.77, 242.78, 'PODIUM', '-3.738046, -38.474835', 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_abastecimentos (id, data_hora, data, placa, km, litros, valor, tipo_gasolina, local, user_email) VALUES ('91fc1961-818f-4062-a830-62381d7ba552', '20/01/2026 16:32:00', '20/01/2026', 'TID-5G50', 2527, 41.15, 250.6, 'COMUM', '-3.738044, -38.474834', 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_abastecimentos (id, data_hora, data, placa, km, litros, valor, tipo_gasolina, local, user_email) VALUES ('80e5aaa1-48d1-4b89-8ced-b643fe8eb53f', '19/02/2026 16:32:00', '19/02/2026', 'TID-5G50', 3132, 39.73, 313.47, 'PODIUM', '-3.738019, -38.474824', 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_abastecimentos (id, data_hora, data, placa, km, litros, valor, tipo_gasolina, local, user_email) VALUES ('b0022b48-2182-4b8b-bb7a-150989dbeefe', '16/03/2026 16:33:00', '16/03/2026', 'TID-5G50', 3648, 35.3, 239.69, 'ADITIVADA', '-3.738571, -38.474863', 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_abastecimentos (id, data_hora, data, placa, km, litros, valor, tipo_gasolina, local, user_email) VALUES ('e2ce3695-0440-4260-ad78-4a27131f7a92', '30/04/2026 12:27:50', '30/04/2026', 'TID-5G50', 4693, 38.12, 273.32, 'COMUM', '-3.743037, -38.477631', 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_abastecimentos (id, data_hora, data, placa, km, litros, valor, tipo_gasolina, local, user_email) VALUES ('beea2b33-80a0-47d2-b3c7-7e62e29c7234', '03/06/2026 12:30:51', '03/06/2026', 'TID-5G50', 5429, 21.58, 138, 'COMUM', '-3.743231, -38.477660', 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_abastecimentos (id, data_hora, data, placa, km, litros, valor, tipo_gasolina, local, user_email) VALUES ('9d07fd32-6571-4a9f-906e-b929a1cb7a6f', '21/06/2026 13:07:59', '21/06/2026', 'TID-5G50', 5874, 21.58, 138, 'COMUM', '-3.743089, -38.477619', 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_abastecimentos (id, data_hora, data, placa, km, litros, valor, tipo_gasolina, local, user_email) VALUES ('ca860676-f0ed-44ec-9c73-919dc82ccf00', '18/07/2026 13:55:05', '18/07/2026', 'TID-5G50', 6560, 22.22, 138, 'COMUM', '-3.743135, -38.477533', 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_abastecimentos (id, data_hora, data, placa, km, litros, valor, tipo_gasolina, local, user_email) VALUES ('bdcc60ef-0044-45ca-9e27-a3c9d26d7fa7', '06/08/2026 18:32:40', '06/08/2026', 'TID-5G50', 7071, 37.29, 235.23, 'COMUM', '-3.743539, -38.475770', 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_abastecimentos (id, data_hora, data, placa, km, litros, valor, tipo_gasolina, local, user_email) VALUES ('f0d65e62-2b11-4b2e-ad7d-8704153eac1e', '29/08/2026 09:55:26', '29/08/2026', 'TID-5G50', 7774, 29.1, 250, 'PODIUM', '-3.734611, -38.493209', 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_abastecimentos (id, data_hora, data, placa, km, litros, valor, tipo_gasolina, local, user_email) VALUES ('dc7103ec-dd80-462c-8770-66150d588e2f', '24/09/2026 12:27:00', '24/09/2026', 'TID-5G50', 8352, 35, 245.95, 'COMUM', '-3.743135, -38.477624', 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_abastecimentos (id, data_hora, data, placa, km, litros, valor, tipo_gasolina, local, user_email) VALUES ('14d0d7a6-8cd2-494c-9bb9-ddd7e5f8e4ee', '13/10/2026 13:01:00', '13/10/2026', 'TID-5G50', 8891, 30, 209.1, 'COMUM', '-3.743063, -38.477639', 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;

-- Inserir Recargas em ge_recargas
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('f8ad925b-cb34-40f7-9749-14ab586b112b', '20/04/2026 20:00:00', '20/04/2026', 'TID-5G50', 48, 92, 10.06, 20.02, '-3.736368, -38.490162', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('4fa9ff2e-cb46-4fe1-b397-7445dea1b8b0', '22/04/2026 18:01:17', '22/04/2026', 'TID-5G50', 56, 91, 6.14, 14.84, '-3.736368, -38.490162', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('30212d55-a933-4f99-ad46-d277e78b0534', '25/04/2026 12:16:51', '25/04/2026', 'TID-5G50', 50, 100, 10.15, 0, '-3.740834, -38.471744', false, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('bdb74ffa-4134-41d9-ae3b-f331c158f5d2', '27/04/2026 17:40:36', '27/04/2026', 'TID-5G50', 79, 100, 5.83, 9.46, '-3.736315, -38.490100', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('fc67d230-dfa1-4e79-a1b9-8dd69843cb5d', '29/04/2026 19:43:29', '29/04/2026', 'TID-5G50', 68, 100, 7, 14, '-3.736292, -38.490075', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('6c3bea21-e3cc-4c8c-869b-bc7576ecfb4d', '30/04/2026 20:53:08', '13/04/2026', 'TID-5G50', 30, 90, 7.88, 11.74, '-3.736776, -38.481587', false, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('4a76ca70-c5e3-4213-827a-2f6f4a56da79', '06/05/2026 19:57:50', '06/05/2026', 'TID-5G50', 56, 90, 7.38, 14.86, '-3.736291, -38.490064', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('395bab31-2d9c-4c6e-8cbf-fa8874a08706', '11/05/2026 20:06:52', '11/05/2026', 'TID-5G50', 45, 71, 6.12, 11.02, '-3.736323, -38.490080', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('1fff123b-7e99-456c-905a-264d32c317bb', '18/05/2026 19:54:41', '18/05/2026', 'TID-5G50', 24, 56, 6.34, 14.22, '-3.736307, -38.490067', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('c013d1c4-cd67-4c8a-b7be-f2b236c41be4', '19/05/2026 18:09:11', '19/05/2026', 'TID-5G50', 25, 62, 7.94, 15.8, '-3.783607, -38.482082', false, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('34e7f1a8-e4ca-48f4-81a9-4d3a7c0e0c08', '01/06/2026 19:59:13', '01/06/2026', 'TID-5G50', 30, 62, 5.77, 14.44, '-3.736311, -38.490065', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('ba491a81-c7dd-4569-bc13-04feedf3fcc1', '03/06/2026 19:47:42', '03/06/2026', 'TID-5G50', 37, 85, 9.38, 21.06, '-3.736299, -38.490058', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('eb20f15c-3e30-46a5-9836-b4232ef8834f', '09/06/2026 19:28:04', '09/06/2026', 'TID-5G50', 39, 76, 8.31, 16.54, '-3.736320, -38.490060', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('d8ae578c-43a0-46a5-8b62-4a94311d7e68', '10/06/2026 19:50:00', '10/06/2026', 'TID-5G50', 52, 100, 7.5, 17.09, '-3.736300, -38.490059', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('5c7aeba8-5f2a-44cf-819e-c9ec6b7d8223', '22/06/2026 19:33:01', '22/06/2026', 'TID-5G50', 51, 100, 8.08, 18.96, '-3.736339, -38.490095', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('1626aa95-a59c-4d28-8b74-d1bb5f736c22', '26/06/2026 18:52:08', '26/06/2026', 'TID-5G50', 35, 50, 3.17, 4.72, '-3.737084, -38.482270', false, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('e4fda8da-bcb3-4e6b-bd5d-84ac9aeeac83', '01/07/2026 19:41:00', '01/07/2026', 'TID-5G50', 27, 76, 9.53, 22.23, '-3.736330, -38.490069', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('1dddc440-fb4a-4e65-bea6-6a5153f0b55d', '05/07/2026 13:06:16', '05/07/2026', 'TID-5G50', 34, 83, 9.54, 0, '-3.738103, -38.474930', false, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('49625355-f76d-40d7-a25b-bbbfe839ff81', '06/07/2026 18:35:11', '06/07/2026', 'TID-5G50', 78, 100, 4.01, 8.74, '-3.736412, -38.490068', false, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('11d34655-8683-4d80-9b98-d21196d6d522', '07/07/2026 19:38:11', '07/07/2026', 'TID-5G50', 67, 100, 6.66, 15.24, '-3.736362, -38.490080', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('3a343856-4110-49e1-9fec-396fef9b716c', '09/07/2026 19:11:13', '09/07/2026', 'TID-5G50', 43.5, 70, 5.23, 11.5, '-3.736407, -38.490078', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('3c90c753-2492-4186-a328-f4642da46ff9', '14/07/2026 18:26:45', '14/07/2026', 'TID-5G50', 34.5, 80.2, 8.88, 20.84, '-3.736350, -38.490044', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('53ef88db-8363-4b9e-bc55-ed95ba8890a7', '16/07/2026 18:46:49', '16/07/2026', 'TID-5G50', 34.6, 70.5, 7, 14, '-3.736313, -38.490024', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('a766ed54-ddfb-49a6-8ab3-b1b0eda29447', '19/07/2026 15:52:20', '19/07/2026', 'TID-5G50', 32.3, 59.7, 5.37, 0, '-3.817576, -38.463665', false, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('a278d4da-66fe-47b9-8f04-4971bb9c959a', '20/07/2026 18:15:04', '20/07/2026', 'TID-5G50', 26, 67, 8.68, 17.28, '-3.783582, -38.482090', false, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('6da2bdd0-4dd5-45b2-876f-2eab66e525b8', '21/07/2026 18:33:40', '21/07/2026', 'TID-5G50', 35.2, 72.1, 7.23, 16.22, '-3.736314, -38.490028', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('b3b97b5b-c748-40ad-bd28-98687e01d4f5', '28/07/2026 18:55:59', '28/07/2026', 'TID-5G50', 42.9, 74.1, 6.13, 13.81, '-3.736335, -38.490063', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('b32fec36-8070-4bfc-8acd-cdaf86be2fdd', '30/07/2026 17:23:49', '30/07/2026', 'TID-5G50', 25.3, 100, 13.78, 27.41, '-3.745985, -38.475957', false, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('628ee10f-50fa-4554-b5bb-05ed38c3fb6a', '04/08/2026 17:56:06', '04/08/2026', 'TID-5G50', 27.1, 60.7, 6.41, 14.47, '-3.736331, -38.490056', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('e7d4b2da-6c81-4f4a-9e8a-b8216b1bf02d', '12/08/2026 21:06:22', '12/08/2026', 'TID-5G50', 37.2, 59.3, 4.2, 14.55, '-3.736326, -38.490041', false, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('0232f685-7b95-40e9-ab25-05ca15a9e04f', '13/08/2026 16:59:55', '13/08/2026', 'TID-5G50', 25.8, 57.3, 5.97, 11.88, '-3.737978, -38.474909', false, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('6ecf92ad-1738-4509-ab62-6bffc7dd04cd', '13/08/2026 18:54:22', '13/08/2026', 'TID-5G50', 48.5, 69.4, 3.99, 8.64, '-3.740813, -38.476550', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('882a2cf2-2f0f-468d-b244-fc016762d993', '20/08/2026 17:40:26', '20/08/2026', 'TID-5G50', 20, 20, 0, 0, '-3.736360, -38.490098', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('ff27085c-db19-4db1-80c8-16e275e9ab17', '25/08/2026 19:51:14', '25/08/2026', 'TID-5G50', 35.6, 61.6, 4.96, 11.04, '-3.736348, -38.490080', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('af6f7142-6530-4b55-b028-f0e11eefd960', '31/08/2026 09:33:28', '31/08/2026', 'TID-5G50', 26.4, 93.1, 11.95, 23.78, '-3.737984, -38.474902', false, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('e82a28f6-ee49-4e08-aeb5-e5ab0bc706be', '11/09/2026 18:41:02', '11/09/2026', 'TID-5G50', 46.8, 80.7, 6.68, 9.95, '-3.735907, -38.484171', false, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('492a41e2-609f-4b0c-a30b-2c890339dac5', '16/09/2026 19:23:00', '16/09/2026', 'TID-5G50', 24.6, 68.2, 8.28, 16.48, '-3.736326, -38.490041', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('391e739a-996f-499c-8270-88ad4c1761ae', '01/09/2026 17:06:00', '01/09/2026', 'TID-5G50', 0, 0, 0, 0, '-3.737982, -38.474901', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('c1adeafb-7e73-441e-a426-36d5869c7061', '29/09/2026 18:09:00', '29/09/2026', 'TID-5G50', 0, 0, 0, 0, '-3.736122, -38.490674', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('1c524247-f850-4dc4-9672-7456d78a233f', '01/10/2026 17:40:00', '01/10/2026', 'TID-5G50', 28.1, 70.2, 8.06, 18.71, '-3.736293, -38.490073', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('d7c9f450-66c7-453a-9ea2-4f98f3a71c07', '05/10/2026 20:56:00', '05/10/2026', 'TID-5G50', 43.2, 77.1, 6.49, 12.92, '-3.736318, -38.490089', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('5f7dfa7d-4841-4de7-a8d9-a15ab15c7b40', '15/10/2026 18:43:00', '15/10/2026', 'TID-5G50', 32, 40, 3, 6, '-3.736313, -38.490080', true, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ge_recargas (id, data_hora, data, placa, perc_inicial, perc_final, kwa, valor, local, academia, user_email) VALUES ('2f095cc7-60ee-4e39-b56c-795899c44fb3', '19/10/2026 19:22:00', '19/10/2026', 'TID-5G50', 24, 70, 8.72, 18.99, '-3.784024, -38.482052', false, 'igoracazevedo@gmail.com') ON CONFLICT (id) DO NOTHING;
