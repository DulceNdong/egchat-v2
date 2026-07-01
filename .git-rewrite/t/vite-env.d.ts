/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string
  readonly VITE_API_URL: string
  readonly VITE_APP_VERSION: string
  readonly VITE_ENV: string
  readonly VITE_APP_URL: string
  // más variables de entorno...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
