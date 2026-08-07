/** biome-ignore-all lint/correctness/noUnusedVariables: these are injected by Vite */

interface ImportMetaEnv {
  readonly MODE: 'production' | 'development' | 'test'
  readonly TEST: boolean
  readonly VITE_DB_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
