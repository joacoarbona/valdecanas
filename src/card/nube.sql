-- ============================================================
-- Nube del grupo de la tarjeta de golf (joaco.org/<mundo>/tarjeta/)
-- Proyecto Supabase «joaco-org». Fuente: joacoarbona/valdecanas, src/card/nube.sql
-- Se puede volver a ejecutar sin perder datos (SQL Editor → Run).
--
-- Un grupo de golf tiene un código secreto de 16 letras (lo genera la tarjeta).
-- Quien tiene el código lee y escribe las partidas del grupo; nadie más.
-- La base de datos solo guarda la huella (sha256) del código, nunca el código.
--
-- Las tablas no se pueden leer ni escribir desde fuera (RLS sin políticas y
-- sin permisos para anon): solo con las cinco funciones de abajo, que piden
-- el código. Cada móvil (o app) guarda su propia copia de cada partida
-- (fila grupo + id + dev); quien lee junta las copias, así que dos móviles
-- nunca se pisan. Una partida borrada queda marcada (borrada = true, sin datos)
-- para que los demás la borren también.
--
-- Servirá también para la liga del grupo (G3).
-- ============================================================

create table if not exists public.golf_grupos (
  id      uuid        primary key default gen_random_uuid(),
  clave   text        not null unique,
  nombre  text        not null,
  creado  timestamptz not null default now(),
  visto   timestamptz not null default now(),
  constraint golf_grupos_clave  check (clave ~ '^[0-9a-f]{64}$'),
  constraint golf_grupos_nombre check (char_length(nombre) between 1 and 60)
);

create table if not exists public.golf_rondas (
  grupo   uuid        not null references public.golf_grupos (id) on delete cascade,
  id      text        not null,
  dev     text        not null,
  k       text        not null,
  data    jsonb,
  borrada boolean     not null default false,
  upd     timestamptz not null default clock_timestamp(),
  primary key (grupo, id, dev),
  constraint golf_rondas_id   check (id ~ '^[A-Za-z0-9_.:-]{1,80}$'),
  constraint golf_rondas_dev  check (dev ~ '^[a-z0-9]{4,32}$'),
  constraint golf_rondas_k    check (k ~ '^[a-z0-9]{1,12}$'),
  constraint golf_rondas_data check (data is null or (jsonb_typeof(data) = 'object' and pg_column_size(data) < 200000))
);
create index if not exists golf_rondas_upd on public.golf_rondas (grupo, upd);

alter table public.golf_grupos enable row level security;
alter table public.golf_rondas enable row level security;
revoke all on public.golf_grupos, public.golf_rondas from public, anon, authenticated;

-- ---- ayuda interna: el código → el grupo (no se puede llamar desde fuera) ----
create or replace function public.golf_huella(p_code text) returns text
language sql immutable set search_path = '' as $$
  select encode(sha256(convert_to('golf-nube/v1/' || upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')), 'UTF8')), 'hex')
$$;

create or replace function public.golf_grupo(p_code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare c text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')); g uuid; v timestamptz;
begin
  if length(c) < 16 or length(c) > 40 then raise exception 'codigo-no-valido' using errcode = '22023'; end if;
  select id, visto into g, v from public.golf_grupos where clave = public.golf_huella(c);
  if g is null then raise exception 'grupo-no-existe' using errcode = 'P0002'; end if;
  if v < now() - interval '1 hour' then update public.golf_grupos set visto = now() where id = g; end if;
  return g;
end $$;

-- ---- crear un grupo nuevo con su código (lo inventa la tarjeta) ----
create or replace function public.golf_crear(p_code text, p_nombre text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
        n text := left(btrim(regexp_replace(coalesce(p_nombre, ''), '\s+', ' ', 'g')), 60);
begin
  if length(c) < 16 or length(c) > 40 then raise exception 'codigo-no-valido' using errcode = '22023'; end if;
  if n = '' then n := 'Mi grupo de golf'; end if;
  if (select count(*) from public.golf_grupos where creado > now() - interval '1 hour') >= 30 then
    raise exception 'demasiados-grupos' using errcode = '54000'; end if;
  insert into public.golf_grupos (clave, nombre) values (public.golf_huella(c), n) on conflict (clave) do nothing;
  if not found then raise exception 'grupo-ya-existe' using errcode = '23505'; end if;
  return jsonb_build_object('nombre', n, 'rondas', 0, 'moviles', 0);
end $$;

-- ---- datos del grupo: nombre, partidas y móviles ----
create or replace function public.golf_ver(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare g uuid := public.golf_grupo(p_code);
begin
  return (select jsonb_build_object('nombre', gr.nombre, 'creado', gr.creado,
     'rondas', (select count(distinct r.id) from public.golf_rondas r where r.grupo = g and not r.borrada),
     'moviles', (select count(distinct r.dev) from public.golf_rondas r where r.grupo = g and not r.borrada))
   from public.golf_grupos gr where gr.id = g);
end $$;

-- ---- subir la copia de este móvil de unas partidas: [{id, k, data, r}] (r = revivir una borrada) ----
create or replace function public.golf_subir(p_code text, p_dev text, p_rondas jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare g uuid := public.golf_grupo(p_code); e jsonb; i text; n int := 0; b text[] := '{}';
begin
  if coalesce(p_dev, '') !~ '^[a-z0-9]{4,32}$' then raise exception 'movil-no-valido' using errcode = '22023'; end if;
  if jsonb_typeof(p_rondas) is distinct from 'array' or jsonb_array_length(p_rondas) > 40 then raise exception 'lote-no-valido' using errcode = '22023'; end if;
  for e in select x from jsonb_array_elements(p_rondas) x loop
    i := e->>'id';
    if jsonb_typeof(e) <> 'object' or jsonb_typeof(e->'data') is distinct from 'object'
       or coalesce(i, '') !~ '^[A-Za-z0-9_.:-]{1,80}$' or coalesce(e->>'k', '') !~ '^[a-z0-9]{1,12}$'
       or pg_column_size(e->'data') >= 200000 then continue; end if;
    if exists (select 1 from public.golf_rondas where grupo = g and id = i and borrada) then
      if coalesce(e->>'r', '') in ('1', 'true') then delete from public.golf_rondas where grupo = g and id = i;
      else b := b || i; continue; end if;
    end if;
    if not exists (select 1 from public.golf_rondas where grupo = g and id = i and dev = p_dev)
       and (select count(*) from public.golf_rondas where grupo = g) >= 6000 then
      raise exception 'grupo-lleno' using errcode = '54000'; end if;
    insert into public.golf_rondas (grupo, id, dev, k, data, borrada, upd) values (g, i, p_dev, e->>'k', e->'data', false, clock_timestamp())
      on conflict (grupo, id, dev) do update set k = excluded.k, data = excluded.data, borrada = false, upd = clock_timestamp();
    n := n + 1;
  end loop;
  return jsonb_build_object('n', n, 'borradas', to_jsonb(b));
end $$;

-- ---- bajar lo que ha cambiado desde la última vez (las copias de los otros móviles y las borradas) ----
-- p_desde: el «ahora» de la bajada anterior (se repasan además los 30 s de antes, por las escrituras a medias).
-- p_seguir: seguir una bajada cortada (mas = true), desde «ultimo» y sin repasar.
create or replace function public.golf_bajar(p_code text, p_dev text, p_desde timestamptz default null, p_seguir boolean default false) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare g uuid := public.golf_grupo(p_code); L jsonb; c int; m timestamptz;
        d timestamptz := case when p_desde is null then null when p_seguir then p_desde else p_desde - interval '30 seconds' end;
begin
  select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id', s.id, 'dev', s.dev, 'k', s.k, 'b', s.borrada, 'data', s.data)) order by s.upd, s.id, s.dev), '[]'::jsonb), count(*), max(s.upd)
    into L, c, m
    from (select * from public.golf_rondas r where r.grupo = g and (r.dev <> coalesce(p_dev, '') or r.borrada) and (d is null or r.upd >= d)
          order by r.upd, r.id, r.dev limit 600) s;
  return jsonb_build_object('ahora', now(), 'nombre', (select nombre from public.golf_grupos where id = g), 'mas', c >= 600, 'ultimo', m, 'rondas', L);
end $$;

-- ---- borrar partidas para todo el grupo: [{id, k}] ----
create or replace function public.golf_borrar(p_code text, p_dev text, p_rondas jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare g uuid := public.golf_grupo(p_code); e jsonb; i text; n int := 0;
begin
  if coalesce(p_dev, '') !~ '^[a-z0-9]{4,32}$' then raise exception 'movil-no-valido' using errcode = '22023'; end if;
  if jsonb_typeof(p_rondas) is distinct from 'array' or jsonb_array_length(p_rondas) > 100 then raise exception 'lote-no-valido' using errcode = '22023'; end if;
  for e in select x from jsonb_array_elements(p_rondas) x loop
    i := e->>'id';
    if coalesce(i, '') !~ '^[A-Za-z0-9_.:-]{1,80}$' or coalesce(e->>'k', '') !~ '^[a-z0-9]{1,12}$' then continue; end if;
    update public.golf_rondas set borrada = true, data = null, upd = clock_timestamp() where grupo = g and id = i;
    if not found then
      insert into public.golf_rondas (grupo, id, dev, k, data, borrada) values (g, i, p_dev, e->>'k', null, true)
        on conflict (grupo, id, dev) do update set borrada = true, data = null, upd = clock_timestamp();
    end if;
    n := n + 1;
  end loop;
  return jsonb_build_object('n', n);
end $$;

-- Solo las cinco funciones se pueden llamar desde la tarjeta (con la clave publishable)
revoke all on function public.golf_huella(text) from public, anon, authenticated;
revoke all on function public.golf_grupo(text) from public, anon, authenticated;
revoke all on function public.golf_crear(text, text) from public;
revoke all on function public.golf_ver(text) from public;
revoke all on function public.golf_subir(text, text, jsonb) from public;
revoke all on function public.golf_bajar(text, text, timestamptz, boolean) from public;
revoke all on function public.golf_borrar(text, text, jsonb) from public;
grant execute on function public.golf_crear(text, text) to anon, authenticated;
grant execute on function public.golf_ver(text) to anon, authenticated;
grant execute on function public.golf_subir(text, text, jsonb) to anon, authenticated;
grant execute on function public.golf_bajar(text, text, timestamptz, boolean) to anon, authenticated;
grant execute on function public.golf_borrar(text, text, jsonb) to anon, authenticated;
