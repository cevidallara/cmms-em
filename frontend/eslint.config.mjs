import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Patrón válido: hidratar state de localStorage al mount es una sincronización
      // legítima entre cliente y storage externo. La regla es demasiado estricta acá.
      "react-hooks/set-state-in-effect": "off",
      // Las comillas en texto JSX renderizan bien — escape no aporta valor.
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;
