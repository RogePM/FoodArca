import nextConfig from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  ...nextConfig,
  {
    // lib/database.types.ts is Supabase-generated and not meant to be linted/edited.
    ignores: ['.claude/**', 'lib/database.types.ts'],
  },
  {
    rules: {
      // These target React Compiler readiness. This codebase doesn't use the
      // compiler yet and has a large pre-existing backlog of these patterns,
      // so they're warnings (visible, not blocking) rather than hard errors.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
];

export default eslintConfig;
