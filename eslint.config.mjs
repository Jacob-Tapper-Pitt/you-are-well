import vitals from "eslint-config-next/core-web-vitals"
import typescript from "eslint-config-next/typescript"
import { defineConfig, globalIgnores } from "eslint/config"

const config = defineConfig([
  ...vitals,
  ...typescript,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
])

export default config
