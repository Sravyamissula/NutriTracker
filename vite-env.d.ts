/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  // You can add more VITE_ vars here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
