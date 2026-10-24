import { PHOTO, photo } from './media';
import { rel } from './time';
import type { ParkingLot, ParkingEligibility, Reservation } from '@/lib/types';

export const ELIGIBILITY_LABELS: Record<ParkingEligibility, string> = {
  student: 'Students',
  faculty: 'Faculty',
  staff: 'Staff',
  visitor: 'Authorised visitors',
};

interface LotSeed {
  id: string;
  name: string;
  code: string;
  zone: ParkingLot['zone'];
  capacity: number;
  accessibleSpaces: number;
  evSpaces: number;
  hours: string;
  eligibility: ParkingEligibility[];
  requiresReservation: boolean;
  feeNote: string;
  gridX: number;
  gridY: number;
  image: string;
  walkMinutes: Record<string, number>;
  rules: string[];
  zones: ParkingLot['zones'];
  occupancy: { available: number; occupied: number; minutesAgo: number } | null;
}

const SEEDS: LotSeed[] = [
  {
    id: 'lot-north-deck',
    name: 'North Deck Multi-level',
    code: 'ND-1',
    zone: 'student',
    capacity: 240,
    accessibleSpaces: 8,
    evSpaces: 6,
    hours: 'Open 24 hours, staffed 07:00–22:00',
    eligibility: ['student', 'staff', 'faculty'],
    requiresReservation: true,
    feeNote: 'No charge for students with a valid permit. Replacement permit ₹150.',
    gridX: 26,
    gridY: 22,
    image: PHOTO.carLot,
    walkMinutes: { 'Main academic block': 6, 'Central Library': 4, 'North Gate': 2 },
    rules: [
      'Permit sticker must be visible through the windscreen',
      'Level 4 is reserved for two-wheelers after 18:00',
      'Vehicles left for more than 72 hours are towed',
    ],
    zones: [
      { label: 'Levels 1–2 general', kind: 'standard', spaces: 150 },
      { label: 'Level 3 shaded', kind: 'standard', spaces: 60 },
      { label: 'Accessible bays, level 1', kind: 'accessible', spaces: 8 },
      { label: 'EV charging, level 1', kind: 'ev', spaces: 6 },
      { label: 'Two-wheeler, level 4', kind: 'standard', spaces: 16 },
    ],
    occupancy: { available: 63, occupied: 177, minutesAgo: 4 },
  },
  {
    id: 'lot-library',
    name: 'Central Library Courtyard',
    code: 'LB-0',
    zone: 'mixed',
    capacity: 60,
    accessibleSpaces: 4,
    evSpaces: 0,
    hours: '07:00–23:00 daily',
    eligibility: ['student', 'faculty', 'staff'],
    requiresReservation: false,
    feeNote: 'No charge. Two-hour limit enforced between 09:00 and 17:00.',
    gridX: 47,
    gridY: 40,
    image: PHOTO.carStreet,
    walkMinutes: { 'Central Library': 1, 'Main academic block': 5, Canteen: 3 },
    rules: [
      'Two-hour maximum stay during teaching hours',
      'No overnight parking',
      'Do not block the service lane',
    ],
    zones: [
      { label: 'Courtyard bays', kind: 'standard', spaces: 52 },
      { label: 'Accessible bays', kind: 'accessible', spaces: 4 },
      { label: 'Short-stay drop-off', kind: 'standard', spaces: 4 },
    ],
    occupancy: { available: 7, occupied: 53, minutesAgo: 2 },
  },
  {
    id: 'lot-faculty-court',
    name: 'Faculty Court',
    code: 'FC-2',
    zone: 'faculty',
    capacity: 84,
    accessibleSpaces: 6,
    evSpaces: 8,
    hours: 'Open 24 hours with permit',
    eligibility: ['faculty', 'staff'],
    requiresReservation: false,
    feeNote: 'Allocated to permit holders at no charge.',
    gridX: 66,
    gridY: 26,
    image: PHOTO.carDetail,
    walkMinutes: { 'Faculty offices': 2, 'Main Auditorium': 4, 'Central Library': 7 },
    rules: [
      'Faculty and staff permits only — student permits are not valid here',
      'Bay allocations are assigned and not interchangeable',
      'EV bays are shared; charge sessions capped at four hours',
    ],
    zones: [
      { label: 'Allocated bays', kind: 'faculty', spaces: 62 },
      { label: 'Shared pool', kind: 'standard', spaces: 8 },
      { label: 'Accessible bays', kind: 'accessible', spaces: 6 },
      { label: 'EV charging', kind: 'ev', spaces: 8 },
    ],
    occupancy: { available: 29, occupied: 55, minutesAgo: 7 },
  },
  {
    id: 'lot-sports',
    name: 'Sports Complex Grounds',
    code: 'SP-3',
    zone: 'student',
    capacity: 160,
    accessibleSpaces: 4,
    evSpaces: 0,
    hours: '05:30–22:30 daily',
    eligibility: ['student', 'staff', 'faculty', 'visitor'],
    requiresReservation: false,
    feeNote: 'No charge. Closed to vehicles during inter-collegiate fixtures.',
    gridX: 34,
    gridY: 74,
    image: PHOTO.carParked,
    walkMinutes: { 'Sports Complex': 2, 'East Hostel': 6, 'Main academic block': 12 },
    rules: [
      'Closed during fixtures — check the sports calendar',
      'Follow marshal directions on event days',
      'Surface is unsealed; not suitable for lowered vehicles',
    ],
    zones: [
      { label: 'North gravel area', kind: 'standard', spaces: 96 },
      { label: 'South gravel area', kind: 'standard', spaces: 60 },
      { label: 'Accessible bays', kind: 'accessible', spaces: 4 },
    ],
    occupancy: null,
  },
  {
    id: 'lot-west-annex',
    name: 'West Campus Annex',
    code: 'WA-4',
    zone: 'visitor',
    capacity: 120,
    accessibleSpaces: 6,
    evSpaces: 2,
    hours: '06:00–21:00 daily',
    eligibility: ['visitor', 'student', 'staff', 'faculty'],
    requiresReservation: true,
    feeNote: 'Visitor rate notified at the gate: ₹40 for the first two hours. Students with a permit park free.',
    gridX: 74,
    gridY: 62,
    image: PHOTO.carNight,
    walkMinutes: { 'West Campus entrance': 1, 'Management block': 7, 'Design Studio': 9 },
    rules: [
      'Visitors must register at the gate and display the printed slip',
      'Reservation required for visitors on weekdays before 10:00',
      'Overnight parking is not permitted',
    ],
    zones: [
      { label: 'Visitor bays', kind: 'standard', spaces: 74 },
      { label: 'Permit holders', kind: 'standard', spaces: 38 },
      { label: 'Accessible bays', kind: 'accessible', spaces: 6 },
      { label: 'EV charging', kind: 'ev', spaces: 2 },
    ],
    occupancy: { available: 44, occupied: 76, minutesAgo: 11 },
  },
  {
    id: 'lot-east-bike',
    name: 'East Hostel Two-wheeler Bay',
    code: 'EB-5',
    zone: 'student',
    capacity: 320,
    accessibleSpaces: 2,
    evSpaces: 12,
    hours: 'Open 24 hours with hostel permit',
    eligibility: ['student'],
    requiresReservation: false,
    feeNote: 'No charge for hostel residents. Day permits ₹10.',
    gridX: 58,
    gridY: 80,
    image: PHOTO.carRoad,
    walkMinutes: { 'East Hostel': 1, Canteen: 3, 'Sports Complex': 5 },
    rules: [
      'Two-wheelers only — cars are turned away',
      'Helmets must be stored on the vehicle, not on the ground',
      'Charging points are for registered EV two-wheelers only',
    ],
    zones: [
      { label: 'Covered racks', kind: 'standard', spaces: 180 },
      { label: 'Open racks', kind: 'standard', spaces: 126 },
      { label: 'EV charging racks', kind: 'ev', spaces: 12 },
      { label: 'Accessible bays', kind: 'accessible', spaces: 2 },
    ],
    occupancy: { available: 118, occupied: 202, minutesAgo: 6 },
  },
  {
    id: 'lot-admin-visitor',
    name: 'Administration Visitor Lot',
    code: 'AV-6',
    zone: 'visitor',
    capacity: 45,
    accessibleSpaces: 6,
    evSpaces: 4,
    hours: '08:00–18:00 weekdays',
    eligibility: ['visitor', 'faculty'],
    requiresReservation: true,
    feeNote: 'Reservation required. Rate card is displayed at the barrier; CampusOS does not process payments.',
    gridX: 82,
    gridY: 18,
    image: PHOTO.carParked,
    walkMinutes: { 'Administration Building': 1, 'Main Auditorium': 3, 'Faculty offices': 8 },
    rules: [
      'Reservation required at all times, including faculty',
      'Barrier access controlled by the security desk',
      'Maximum stay four hours',
    ],
    zones: [
      { label: 'Reserved bays', kind: 'standard', spaces: 27 },
      { label: 'Accessible bays', kind: 'accessible', spaces: 6 },
      { label: 'EV charging', kind: 'ev', spaces: 4 },
      { label: 'Faculty overflow', kind: 'faculty', spaces: 8 },
    ],
    occupancy: { available: 12, occupied: 33, minutesAgo: 9 },
  },
];

export const PARKING_LOTS: ParkingLot[] = SEEDS.map((seed) => ({
  id: seed.id,
  name: seed.name,
  code: seed.code,
  zone: seed.zone,
  capacity: seed.capacity,
  accessibleSpaces: seed.accessibleSpaces,
  evSpaces: seed.evSpaces,
  hours: seed.hours,
  eligibility: seed.eligibility,
  requiresReservation: seed.requiresReservation,
  feeNote: seed.feeNote,
  walkMinutes: seed.walkMinutes,
  occupancy: seed.occupancy
    ? {
        available: seed.occupancy.available,
        occupied: seed.occupancy.occupied,
        updatedAt: rel.minutes(-seed.occupancy.minutesAgo),
        source: 'Simulated sensor feed — demonstration data',
      }
    : null,
  rules: seed.rules,
  gridX: seed.gridX,
  gridY: seed.gridY,
  image: photo(seed.image, { w: 1000, h: 620 }),
  zones: seed.zones,
}));

export function parkingLotById(id: string): ParkingLot | undefined {
  return PARKING_LOTS.find((lot) => lot.id === id);
}

/** Seeded history so the reservations view is never empty on first launch. */
export const SEEDED_RESERVATIONS: Reservation[] = [
  {
    id: 'res-demo-1',
    lotId: 'lot-north-deck',
    lotName: 'North Deck Multi-level',
    lotCode: 'ND-1',
    zoneLabel: 'Levels 1–2 general',
    date: rel.date(1),
    start: '08:30',
    end: '13:30',
    status: 'confirmed',
    plate: 'DL 8C AB 4412',
    reference: 'CAMP-ND1-88421',
    createdAt: rel.days(-1),
    cancelledAt: null,
    cancelReason: null,
    origin: 'demo',
  },
  {
    id: 'res-demo-2',
    lotId: 'lot-library',
    lotName: 'Central Library Courtyard',
    lotCode: 'LB-0',
    zoneLabel: 'Courtyard bays',
    date: rel.date(-3),
    start: '15:00',
    end: '18:00',
    status: 'completed',
    plate: 'DL 8C AB 4412',
    reference: 'CAMP-LB0-77190',
    createdAt: rel.days(-4),
    cancelledAt: null,
    cancelReason: null,
    origin: 'demo',
  },
  {
    id: 'res-demo-3',
    lotId: 'lot-west-annex',
    lotName: 'West Campus Annex',
    lotCode: 'WA-4',
    zoneLabel: 'Visitor bays',
    date: rel.date(-8),
    start: '10:00',
    end: '12:00',
    status: 'cancelled',
    plate: 'DL 8C AB 4412',
    reference: 'CAMP-WA4-64003',
    createdAt: rel.days(-9),
    cancelledAt: rel.days(-8),
    cancelReason: 'Studio session moved online',
    origin: 'demo',
  },
];

export const PEAK_HOURS_NOTE =
  'Availability figures on this page are simulated for demonstration. Live occupancy requires an installed bay-sensor or barrier integration, which is not configured.';

export const PARKING_RULES_SUMMARY = [
  'A valid institute vehicle permit is required in all lots.',
  'Reservations open 14 days ahead and close two hours before the slot starts.',
  'Cancel at least one hour before the slot to release the bay without penalty.',
  'Accessible bays require a valid accessibility permit; misuse is reported to security.',
  'EV bays are for charging, not for parking once charging completes.',
];
