/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_PAYMENTS_PUBLISHER_KEY?: string;
  readonly VITE_PARKING_FEED_URL?: string;
  readonly VITE_ERP_API_URL?: string;
  readonly VITE_OPPORTUNITIES_FEED_URL?: string;
  readonly VITE_CONTACT_EMAIL_DOMAIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
