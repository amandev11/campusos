/**
 * Every remote photograph used by CampusOS.
 *
 * All Unsplash asset ids below were checked and return HTTP 200 with a
 * documented licence. `SmartImage` still degrades gracefully if a request
 * fails, so no surface depends on the network being available.
 */

const UNSPLASH = 'https://images.unsplash.com/photo-';

export interface PhotoOptions {
  w?: number;
  h?: number;
  q?: number;
  crop?: boolean;
}

export function photo(id: string, options: PhotoOptions = {}): string {
  const { w = 1200, h, q = 74, crop = true } = options;
  const params = [`auto=format`, `q=${q}`, `w=${w}`];
  if (h) params.push(`h=${h}`, `fit=${crop ? 'crop' : 'max'}`);
  else if (crop) params.push('fit=crop');
  return `${UNSPLASH}${id}?${params.join('&')}`;
}

export const PHOTO = {
  campus: '1541339907198-e08756dedf3f',
  campusQuad: '1517245386807-bb43f82c33c4',
  library: '1521587760476-6c12a4b040da',
  libraryShelves: '1481627834876-b7833e8f5570',
  libraryReading: '1562774053-701939374585',
  books: '1512820790803-83ca734da794',
  bookOpen: '1497633762265-9d179a990aa6',
  classroom: '1524178232363-1fb2b075b655',
  lecture: '1509062522246-3755977927d7',
  students: '1522202176988-66273c2fd55f',
  studyGroup: '1517486808906-6ca8b3f04846',
  labWork: '1532094349884-543bc11b234d',
  code: '1498050108023-c5249f4df085',
  codeScreen: '1542831371-29b0f74f9713',
  terminal: '1461749280684-dccba630e2f6',
  deskSetup: '1517180102446-f3ece451e9d8',
  coding: '1531482615713-2afd69097998',
  analytics: '1454165804606-c3d57bc86b40',
  charts: '1516321318423-f06f85e504b3',
  meeting: '1521737604893-d14cc237f11d',
  workspace: '1524758631624-e2822e304c36',
  office: '1497366754035-f200968a6e72',
  coworking: '1523240795612-9a054b0db644',
  handshake: '1521791136064-7986c2920216',
  network: '1451187580459-43490279c0fa',
  womanWorking: '1573164713988-8665fc963095',
  homeLaptop: '1581091226825-a6a2a5aee158',
  techTeam: '1519389950473-47ba0277781c',
  consulting: '1517048676732-d65bc937f952',
  plan: '1517649763962-0c623066013b',
  retro: '1550745165-9bc0b252726f',
  classroomProject: '1543269865-cbf427effbad',
  teaching: '1588072432836-e10032774350',
  education: '1503676260728-1c00da094a0b',
  workshop: '1571260899304-425eee4c7efc',
  mountains: '1506905925346-21bda4d32df4',
  mountainLake: '1469474968028-56623f02e42e',
  roadTrip: '1476514525535-07fb3b4ae5f1',
  mapPlan: '1503220317375-aaad61436b1b',
  airport: '1526772662000-3f88f10405ff',
  travelMap: '1488646953014-85cb44e25828',
  surf: '1502680390469-be75c86b636f',
  hiking: '1551632811-561732d1e306',
  snow: '1533240332313-0db49b459ad6',
  countryside: '1590674899484-d5640e854abe',
  outdoors: '1593941707882-a5bba14938c7',
  carRoad: '1506521781263-d8422e82f27a',
  carStreet: '1449965408869-eaa3f722e40d',
  carDetail: '1470224114660-3f6686c562eb',
  carLot: '1502877338535-766e1452684a',
  carParked: '1553440569-bcc63803a83d',
  carNight: '1541899481282-d53bffe3c35d',
  campusWalk: '1498243691581-b145c3f54a5a',
  lounge: '1587560699334-cc4ff634909a',
  studio: '1560518883-ce09059eeffa',
  team: '1529156069898-49953e39b3ac',
} as const;

/** Deterministic gradient used wherever an image is absent or still loading. */
export const GRADIENTS = [
  'linear-gradient(135deg, #1b2a3d, #0e1620)',
  'linear-gradient(135deg, #2a2438, #12111c)',
  'linear-gradient(135deg, #17332f, #0c1a19)',
  'linear-gradient(135deg, #33291c, #1a140c)',
  'linear-gradient(135deg, #232b3a, #101620)',
] as const;

export function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  return GRADIENTS[hash % GRADIENTS.length]!;
}
