-- LitroWatt IAZ: opção "tem carregamento" no cadastro do veículo.
-- false = carro só a combustão (o app esconde energia, recargas e academia).
alter table public.ge_veiculos add column if not exists tem_carregamento boolean not null default true;

-- Carros que já existem: só têm carregamento os que já têm recarga registrada.
update public.ge_veiculos v
   set tem_carregamento = exists (select 1 from public.ge_recargas r where r.placa = v.placa);

notify pgrst, 'reload schema';
