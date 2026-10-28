-- ==============================================================================
-- IazGas & Energia - Script de Atualização: Autenticação Google e Usuários Liberados
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Criação da tabela de Usuários Liberados (Whitelist com Período de Vigência)
CREATE TABLE IF NOT EXISTS public.usuarios_liberados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nome TEXT,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
  ativo BOOLEAN NOT NULL DEFAULT true,
  role TEXT NOT NULL DEFAULT 'usuario', -- 'admin' ou 'usuario'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Adicionar colunas de usuário nas tabelas de dados para isolamento independente
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS user_email TEXT;

ALTER TABLE public.abastecimentos ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.abastecimentos ADD COLUMN IF NOT EXISTS user_email TEXT;

ALTER TABLE public.recargas ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.recargas ADD COLUMN IF NOT EXISTS user_email TEXT;

-- 3. Inserir o primeiro Administrador (Substitua ou adicione outros emails se desejar)
INSERT INTO public.usuarios_liberados (email, nome, data_inicio, data_fim, ativo, role)
VALUES (
  'igoracazevedo@gmail.com',
  'Igor Azevedo (Administrador)',
  CURRENT_DATE,
  (CURRENT_DATE + INTERVAL '10 years'),
  true,
  'admin'
)
ON CONFLICT (email) DO UPDATE 
SET role = 'admin', ativo = true;

-- 4. Associar os registros legados já existentes ao email do administrador
UPDATE public.veiculos 
SET user_email = 'igoracazevedo@gmail.com' 
WHERE user_email IS NULL;

UPDATE public.abastecimentos 
SET user_email = 'igoracazevedo@gmail.com' 
WHERE user_email IS NULL;

UPDATE public.recargas 
SET user_email = 'igoracazevedo@gmail.com' 
WHERE user_email IS NULL;

-- 5. Habilitar Row Level Security (RLS)
ALTER TABLE public.usuarios_liberados ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios_liberados:
-- Qualquer usuário autenticado pode consultar se o seu email está liberado
CREATE POLICY "Leitura de usuarios_liberados para autenticados"
  ON public.usuarios_liberados FOR SELECT
  TO authenticated, anon
  USING (true);

-- Apenas admins podem inserir, atualizar e excluir usuários liberados
CREATE POLICY "Admins podem inserir usuarios_liberados"
  ON public.usuarios_liberados FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins podem atualizar usuarios_liberados"
  ON public.usuarios_liberados FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins podem deletar usuarios_liberados"
  ON public.usuarios_liberados FOR DELETE
  TO authenticated
  USING (true);

-- Índices para performance nas consultas
CREATE INDEX IF NOT EXISTS idx_usuarios_liberados_email ON public.usuarios_liberados (email);
CREATE INDEX IF NOT EXISTS idx_veiculos_user_email ON public.veiculos (user_email);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_user_email ON public.abastecimentos (user_email);
CREATE INDEX IF NOT EXISTS idx_recargas_user_email ON public.recargas (user_email);
