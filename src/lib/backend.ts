/**
 * Integration status.
 *
 * CampusOS ships as a fully interactive demonstration. Nothing here pretends an
 * integration exists: each capability below reports honestly whether it is
 * configured, and the UI disables the corresponding operation otherwise.
 */

export interface Integration {
  id: string;
  name: string;
  purpose: string;
  category: 'backend' | 'payments' | 'academics' | 'parking' | 'opportunities';
  /** Environment variables a deployment must provide. */
  envVars: string[];
  /** What CampusOS does while unconfigured. */
  fallback: string;
  /** Features that become available once configured. */
  unlocks: string[];
}

const env = import.meta.env;

const INTEGRATION_DEFS: Integration[] = [
  {
    id: 'supabase',
    name: 'Postgres backend & authentication',
    purpose: 'Accounts, row-level security, persisted records and document storage.',
    category: 'backend',
    envVars: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
    fallback: 'Data is stored in this browser only and labelled as demonstration data.',
    unlocks: [
      'Real sign-in with email verification',
      'Cross-device persistence and sync',
      'Server-enforced role authorisation',
      'Uploaded document and listing storage',
    ],
  },
  {
    id: 'payments',
    name: 'Payments provider',
    purpose: 'Charging for book transactions and parking fees.',
    category: 'payments',
    envVars: ['VITE_PAYMENTS_PUBLISHER_KEY'],
    fallback: 'No payment is collected anywhere. Listings settle in person, as stated on each listing.',
    unlocks: ['Card and UPI checkout', 'Refunds for cancelled reservations', 'Payout records for sellers'],
  },
  {
    id: 'erp',
    name: 'Institutional ERP / student information system',
    purpose: 'Official attendance, grades, registration and examination records.',
    category: 'academics',
    envVars: ['VITE_ERP_API_URL'],
    fallback:
      'The Academic Hub runs in demonstration mode. Attendance and internal marks shown are sample figures, not official records.',
    unlocks: [
      'Verified attendance and grade records',
      'Live examination hall allocations',
      'Registration and fee status straight from the registrar',
    ],
  },
  {
    id: 'parking',
    name: 'Parking occupancy & barrier system',
    purpose: 'Live bay availability, vehicle registration and gate access.',
    category: 'parking',
    envVars: ['VITE_PARKING_FEED_URL'],
    fallback:
      'Availability numbers are simulated and each figure carries a source note. Barrier release is handled by the security desk.',
    unlocks: ['Live occupancy per bay type', 'Barrier release on arrival', 'Verified reservation enforcement'],
  },
  {
    id: 'opportunities',
    name: 'Verified opportunity feed',
    purpose: 'Ingesting opportunity listings from partner sources with provenance.',
    category: 'opportunities',
    envVars: ['VITE_OPPORTUNITIES_FEED_URL'],
    fallback:
      'Listings are demonstration content. Employer verification badges are only shown when a source supplies verification.',
    unlocks: ['Continuously updated listings', 'Verifiable employer provenance', 'Deadline change alerts'],
  },
];

export interface IntegrationStatus extends Integration {
  configured: boolean;
  missing: string[];
}

export const INTEGRATIONS: IntegrationStatus[] = INTEGRATION_DEFS.map((integration) => {
  const missing = integration.envVars.filter((key) => !env[key as keyof ImportMetaEnv]);
  return { ...integration, configured: missing.length === 0, missing };
});

export function integrationById(id: string): IntegrationStatus | undefined {
  return INTEGRATIONS.find((integration) => integration.id === id);
}

export function hasIntegration(id: string): boolean {
  return integrationById(id)?.configured ?? false;
}

/** True whenever any part of the product still runs on local demonstration data. */
export const DEMO_MODE = !INTEGRATIONS.some((integration) => integration.configured);

export const CONFIGURED_INTEGRATIONS = INTEGRATIONS.filter((integration) => integration.configured);

export const DEMO_DATA_NOTICE =
  'Demonstration data. Records created here live in this browser and are not synced anywhere.';
