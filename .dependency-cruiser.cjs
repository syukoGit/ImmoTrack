/**
 * Règles de frontières architecturales (Domain <- Application <- Infrastructure / Presentation).
 * Exécuté par `pnpm lint:architecture` et en CI. Les fichiers de test sont exclus des règles de
 * couche (ils peuvent utiliser Vitest et @immotrack/test-utils).
 */
const TESTS = '(\\.(test|int\\.test|spec)\\.tsx?$)|(/test/)|(/e2e/)';

/** Chemin résolu (pnpm, liens symboliques suivis) d'une dépendance npm donnée. */
const npm = (name) => `node_modules/(\\.pnpm/${name.replace('/', '\\+')}@|${name}/)`;

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-is-pure',
      comment:
        'Le domaine ne dépend que de lui-même : ni framework, ni SDK, ni Node.js, ni autre package.',
      severity: 'error',
      from: { path: '^packages/domain/src', pathNot: TESTS },
      to: { pathNot: '^packages/domain/src' },
    },
    {
      name: 'property-catalog-independent-of-evaluation',
      comment: 'Le catalogue de biens (listing) ne dépend pas du contexte Evaluation.',
      severity: 'error',
      from: { path: '^packages/domain/src/listing' },
      to: { path: '^packages/domain/src/evaluation' },
    },
    {
      name: 'application-depends-on-domain-only',
      comment: "L'application ne connaît que le domaine : pas de SQL, SDK Supabase ni Next.js.",
      severity: 'error',
      from: { path: '^packages/application/src', pathNot: TESTS },
      to: { pathNot: '^packages/(application|domain)/src' },
    },
    {
      name: 'contracts-depend-on-validation-only',
      comment: 'Les contrats ne dépendent que de la bibliothèque de validation.',
      severity: 'error',
      from: { path: '^packages/contracts/(src|scripts)', pathNot: TESTS },
      to: {
        pathNot: ['^packages/contracts/', npm('zod')],
        dependencyTypesNot: ['core'],
      },
    },
    {
      name: 'infrastructure-not-to-presentation',
      comment:
        "L'infrastructure n'importe ni l'application web, ni React, ni Next.js, ni les contrats HTTP.",
      severity: 'error',
      from: { path: '^packages/infrastructure/src' },
      to: {
        path: ['^apps/', '^packages/contracts/', npm('react'), npm('react-dom'), npm('next')],
      },
    },
    {
      name: 'web-does-not-reach-into-domain',
      comment:
        "L'app web passe par l'application (use cases, DTO) et non directement par le domaine.",
      severity: 'error',
      from: { path: '^apps/web/src' },
      to: { path: '^packages/domain/' },
    },
    {
      name: 'infrastructure-only-from-server',
      comment:
        'Seuls src/server (composition root, adaptateurs HTTP) et les tests importent les adaptateurs.',
      severity: 'error',
      from: { path: '^apps/web/src', pathNot: ['^apps/web/src/server/', TESTS] },
      to: {
        path: ['^packages/infrastructure/', npm('pg'), npm('pino')],
      },
    },
    {
      name: 'test-utils-only-in-tests',
      comment: '@immotrack/test-utils est réservé aux tests.',
      severity: 'error',
      from: { pathNot: ['^packages/test-utils/', TESTS] },
      to: { path: '^packages/test-utils/' },
    },
    {
      name: 'application-testing-only-in-tests',
      comment: 'Les doublures de @immotrack/application/testing sont réservées aux tests.',
      severity: 'error',
      from: {
        pathNot: ['^packages/application/src/testing/', '^packages/test-utils/', TESTS],
      },
      to: { path: '^packages/application/src/testing/' },
    },
    {
      name: 'packages-never-depend-on-apps',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^apps/' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: ['\\.next/', 'coverage/', '\\.d\\.ts$'] },
    tsPreCompilationDeps: true,
    combinedDependencies: false,
    preserveSymlinks: false,
    tsConfig: { fileName: 'tsconfig.depcruise.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
