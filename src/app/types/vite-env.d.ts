/** biome-ignore-all lint/correctness/noUnusedVariables: these are injected by Vite */

/// <reference types="vite-plugin-svgr/client" />

declare module '*.svg' {
  const content: React.FC<React.SVGProps<SVGElement> & { title?: string }>
  export default content
}

interface ImportMetaEnv {
  readonly MODE: 'production' | 'development' | 'test'
  readonly TEST: boolean
  readonly VITE_DB_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
