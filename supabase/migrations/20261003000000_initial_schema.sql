-- ImmoTrack V1 — schéma initial.
--
-- Conventions :
--   * identifiants techniques UUID (générés par l'application, défaut gen_random_uuid()) ;
--   * horodatages timestamptz ;
--   * statuts en texte contraint par CHECK (plus simple à faire évoluer qu'un type ENUM) ;
--   * données brutes en JSONB, champs filtrés/calculés normalisés en colonnes ;
--   * aucune logique métier en trigger : les invariants vivent dans le domaine, les
--     contraintes ci-dessous n'en sont que la défense en profondeur.
--
-- La migration n'utilise que du PostgreSQL standard (>= 15) afin de s'appliquer aussi bien sur
-- Supabase que sur un PostgreSQL vierge (CI, tests d'intégration).

-- ---------------------------------------------------------------------------
-- Référentiels
-- ---------------------------------------------------------------------------

create table sources (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  kind text not null,
  base_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint sources_code_key unique (code),
  constraint sources_code_format check (code ~ '^[a-z0-9][a-z0-9_-]{1,49}$'),
  constraint sources_kind_check check (kind in ('PORTAL', 'AGENCY', 'NETWORK', 'AUCTION', 'OTHER')),
  constraint sources_base_url_check check (base_url is null or base_url ~ '^https?://')
);

create table search_criteria_versions (
  id uuid primary key default gen_random_uuid(),
  version integer not null,
  config jsonb not null,
  active_from timestamptz not null,
  created_at timestamptz not null default now(),
  constraint search_criteria_versions_version_key unique (version),
  constraint search_criteria_versions_version_check check (version > 0),
  constraint search_criteria_versions_config_check check (jsonb_typeof(config) = 'object')
);

create index search_criteria_versions_active_from_idx on search_criteria_versions (active_from desc);

-- ---------------------------------------------------------------------------
-- Search operations : runs, sources par run, événements
-- ---------------------------------------------------------------------------

create table search_runs (
  id uuid primary key,
  criteria_version_id uuid references search_criteria_versions (id),
  started_at timestamptz not null,
  completed_at timestamptz,
  status text not null default 'RUNNING',
  totals jsonb not null default '{}'::jsonb,
  correlation_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint search_runs_status_check
    check (status in ('RUNNING', 'SUCCESS', 'PARTIAL_SUCCESS', 'FAILED')),
  constraint search_runs_completion_check
    check (completed_at is null or completed_at >= started_at),
  constraint search_runs_totals_check check (jsonb_typeof(totals) = 'object')
);

create index search_runs_started_at_idx on search_runs (started_at desc);
create index search_runs_status_idx on search_runs (status, started_at desc);
create index search_runs_criteria_version_id_idx on search_runs (criteria_version_id);

create table search_source_runs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references search_runs (id),
  source_id uuid not null references sources (id),
  status text not null default 'RUNNING',
  started_at timestamptz not null,
  completed_at timestamptz,
  metrics jsonb not null default '{}'::jsonb,
  error_code text,
  constraint search_source_runs_run_source_key unique (run_id, source_id),
  constraint search_source_runs_status_check
    check (status in ('RUNNING', 'SUCCESS', 'PARTIAL_SUCCESS', 'FAILED')),
  constraint search_source_runs_completion_check
    check (completed_at is null or completed_at >= started_at),
  constraint search_source_runs_metrics_check check (jsonb_typeof(metrics) = 'object')
);

create index search_source_runs_source_id_idx on search_source_runs (source_id, started_at desc);

-- ---------------------------------------------------------------------------
-- Ingestion : idempotence des lots envoyés par les agents
-- ---------------------------------------------------------------------------

create table ingestion_requests (
  id uuid primary key,
  idempotency_key text not null,
  payload_hash text not null,
  status text not null,
  run_id uuid not null references search_runs (id),
  source_code text not null,
  agent_id text not null,
  correlation_id text not null,
  response_summary jsonb not null,
  created_at timestamptz not null default now(),
  constraint ingestion_requests_idempotency_key_key unique (idempotency_key),
  constraint ingestion_requests_idempotency_key_check
    check (char_length(idempotency_key) between 8 and 200),
  constraint ingestion_requests_payload_hash_check check (payload_hash ~ '^[a-f0-9]{64}$'),
  constraint ingestion_requests_status_check check (status in ('ACCEPTED', 'REJECTED')),
  constraint ingestion_requests_summary_check check (jsonb_typeof(response_summary) = 'object')
);

create index ingestion_requests_run_id_idx on ingestion_requests (run_id, created_at);
create index ingestion_requests_created_at_idx on ingestion_requests (created_at desc);

create table agent_events (
  id uuid primary key,
  run_id uuid not null references search_runs (id),
  source_run_id uuid references search_source_runs (id),
  ingestion_request_id uuid references ingestion_requests (id),
  level text not null,
  event_type text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  correlation_id text,
  created_at timestamptz not null default now(),
  constraint agent_events_level_check check (level in ('debug', 'info', 'warn', 'error')),
  constraint agent_events_event_type_check check (event_type ~ '^[A-Z][A-Z0-9_]{2,63}$'),
  constraint agent_events_metadata_check check (jsonb_typeof(metadata) = 'object')
);

create index agent_events_run_id_idx on agent_events (run_id, created_at);
create index agent_events_source_run_id_idx on agent_events (source_run_id);
create index agent_events_ingestion_request_id_idx on agent_events (ingestion_request_id);
create index agent_events_correlation_id_idx on agent_events (correlation_id);
create index agent_events_level_idx on agent_events (level, created_at desc)
  where level in ('warn', 'error');

-- ---------------------------------------------------------------------------
-- Property catalog : biens, annonces sources, snapshots append-only
-- ---------------------------------------------------------------------------

create table listings (
  id uuid primary key default gen_random_uuid(),
  canonical_hash text not null,
  title text,
  city text not null,
  postal_code text,
  property_type text,
  rooms smallint,
  surface_m2 numeric(10, 2),
  price_cents bigint,
  status text not null default 'NEW',
  first_seen_at timestamptz not null,
  last_seen_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listings_status_check
    check (status in ('NEW', 'TO_ANALYZE', 'SHORTLISTED', 'REJECTED', 'CONTACTED', 'ARCHIVED')),
  constraint listings_property_type_check
    check (property_type is null
      or property_type in ('APARTMENT', 'HOUSE', 'BUILDING', 'LAND', 'PARKING', 'COMMERCIAL', 'OTHER')),
  constraint listings_postal_code_check check (postal_code is null or postal_code ~ '^[0-9]{5}$'),
  constraint listings_rooms_check check (rooms is null or rooms >= 0),
  constraint listings_surface_check check (surface_m2 is null or surface_m2 > 0),
  constraint listings_price_check check (price_cents is null or price_cents > 0),
  constraint listings_seen_check check (last_seen_at >= first_seen_at)
);

create index listings_canonical_hash_idx on listings (canonical_hash);
create index listings_city_postal_code_idx on listings (city, postal_code);
create index listings_status_idx on listings (status, last_seen_at desc);
create index listings_last_seen_at_idx on listings (last_seen_at desc);

create table listing_sources (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id),
  source_id uuid not null references sources (id),
  source_reference text not null,
  url text not null,
  active boolean not null default true,
  first_seen_at timestamptz not null,
  last_seen_at timestamptz not null,
  constraint listing_sources_source_reference_key unique (source_id, source_reference),
  constraint listing_sources_reference_check check (char_length(source_reference) between 1 and 200),
  constraint listing_sources_url_check check (url ~ '^https://'),
  constraint listing_sources_seen_check check (last_seen_at >= first_seen_at)
);

create index listing_sources_listing_id_idx on listing_sources (listing_id);
create index listing_sources_url_idx on listing_sources (url);

create table listing_snapshots (
  id uuid primary key default gen_random_uuid(),
  listing_source_id uuid not null references listing_sources (id),
  observed_at timestamptz not null,
  normalized_payload jsonb not null,
  payload_hash text not null,
  created_at timestamptz not null default now(),
  constraint listing_snapshots_payload_hash_check check (payload_hash ~ '^[a-f0-9]{64}$'),
  constraint listing_snapshots_payload_check check (jsonb_typeof(normalized_payload) = 'object'),
  constraint listing_snapshots_observation_key unique (listing_source_id, observed_at, payload_hash)
);

create index listing_snapshots_listing_source_observed_idx
  on listing_snapshots (listing_source_id, observed_at desc);
create index listing_snapshots_observed_at_idx on listing_snapshots (observed_at desc);

-- ---------------------------------------------------------------------------
-- Evaluation : hypothèses versionnées et évaluations reproductibles
-- ---------------------------------------------------------------------------

create table evaluation_inputs (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id),
  version integer not null,
  source_kind text not null,
  assumptions jsonb not null,
  created_at timestamptz not null default now(),
  constraint evaluation_inputs_listing_version_key unique (listing_id, version),
  constraint evaluation_inputs_version_check check (version > 0),
  constraint evaluation_inputs_source_kind_check
    check (source_kind in ('OBSERVED', 'ESTIMATED', 'MANUAL')),
  constraint evaluation_inputs_assumptions_check check (jsonb_typeof(assumptions) = 'object')
);

create table evaluations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id),
  input_id uuid not null references evaluation_inputs (id),
  calculator_version text not null,
  metrics jsonb not null,
  score numeric(5, 2),
  score_breakdown jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint evaluations_input_calculator_key unique (input_id, calculator_version),
  constraint evaluations_score_check check (score is null or score between 0 and 100),
  constraint evaluations_metrics_check check (jsonb_typeof(metrics) = 'object'),
  constraint evaluations_breakdown_check check (jsonb_typeof(score_breakdown) = 'array')
);

create index evaluations_listing_id_idx on evaluations (listing_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Audit des actions administrateur
-- ---------------------------------------------------------------------------

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id text not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_events_metadata_check check (jsonb_typeof(metadata) = 'object')
);

create index audit_events_entity_idx on audit_events (entity_type, entity_id, created_at desc);
create index audit_events_created_at_idx on audit_events (created_at desc);

-- ---------------------------------------------------------------------------
-- Sécurité : défense en profondeur
-- ---------------------------------------------------------------------------
-- L'application accède à la base uniquement côté serveur, via une connexion PostgreSQL directe
-- (rôle propriétaire). Aucune table n'est destinée à l'API Data de Supabase : la RLS est activée
-- sans aucune politique, ce qui interdit tout accès via les rôles `anon` et `authenticated`.

alter table sources enable row level security;
alter table search_criteria_versions enable row level security;
alter table search_runs enable row level security;
alter table search_source_runs enable row level security;
alter table ingestion_requests enable row level security;
alter table agent_events enable row level security;
alter table listings enable row level security;
alter table listing_sources enable row level security;
alter table listing_snapshots enable row level security;
alter table evaluation_inputs enable row level security;
alter table evaluations enable row level security;
alter table audit_events enable row level security;

-- Les rôles Supabase n'existent pas sur un PostgreSQL vierge : révocation conditionnelle.
do $$
declare
  api_role text;
begin
  foreach api_role in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = api_role) then
      execute format('revoke all on all tables in schema public from %I', api_role);
      execute format('revoke all on all sequences in schema public from %I', api_role);
      execute format(
        'alter default privileges in schema public revoke all on tables from %I', api_role);
    end if;
  end loop;
end
$$;
