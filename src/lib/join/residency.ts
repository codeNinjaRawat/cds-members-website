/**
 * Address → zone + Islamic Center.
 * REAL (BE module B6): standardize address → geocode → PostGIS zone polygon → center; 5-mile border check.
 * MOCK (until BE): ZIP-based guess so the flow can be built and tested. Clearly labeled as an estimate.
 */
import { z } from 'zod';

export const LookupRequestSchema = z.object({
  street: z.string().trim().min(3).max(120),
  city: z.string().trim().min(2).max(60),
  state: z.string().length(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/),
});

export const LookupResultSchema = z.object({
  inServiceArea: z.boolean(),
  zone: z.object({ id: z.string(), name: z.string() }).nullable(),
  center: z.object({ id: z.string(), name: z.string() }).nullable(),
  nearBorder: z.boolean(),
  alternatives: z.array(z.object({ id: z.string(), name: z.string(), zoneName: z.string(), miles: z.number() })),
  estimate: z.boolean(), // true = mock/ZIP-level guess
});
export type LookupResult = z.infer<typeof LookupResultSchema>;

const ZONES: Record<string, { name: string; zips: string[] }> = {
  n: { name: 'North', zips: ['77014', '77032', '77037', '77038', '77039', '77060', '77066', '77067', '77068', '77069', '77073', '77090', '77338', '77373', '77379', '77386', '77388', '77389'] },
  nw: { name: 'Northwest', zips: ['77040', '77041', '77043', '77064', '77065', '77070', '77084', '77086', '77088', '77092', '77095', '77429', '77433', '77449', '77450', '77494'] },
  sw: { name: 'Southwest', zips: ['77031', '77035', '77036', '77042', '77057', '77063', '77071', '77072', '77074', '77077', '77081', '77082', '77083', '77096', '77099', '77406', '77407', '77469', '77477', '77478', '77479', '77489', '77498'] },
  s: { name: 'South', zips: ['77033', '77045', '77047', '77048', '77051', '77053', '77054', '77061', '77075', '77085', '77087', '77089', '77545', '77578', '77581', '77584'] },
  se: { name: 'Southeast', zips: ['77012', '77013', '77015', '77017', '77029', '77034', '77049', '77058', '77059', '77062', '77502', '77503', '77504', '77505', '77506', '77507', '77520', '77521', '77536', '77546', '77573'] },
};
const ORDER = ['n', 'nw', 'sw', 's', 'se'];

export function mockLookup(req: z.infer<typeof LookupRequestSchema>): LookupResult {
  const zip5 = req.zip.slice(0, 5);
  const houstonArea = req.state === 'TX' && /^77[0-5]\d\d$/.test(zip5);
  if (!houstonArea) return { inServiceArea: false, zone: null, center: null, nearBorder: false, alternatives: [], estimate: true };
  let zoneId = Object.keys(ZONES).find((k) => ZONES[k].zips.includes(zip5));
  if (!zoneId) zoneId = ORDER[Number(zip5.slice(3)) % ORDER.length]; // central ZIPs: deterministic guess
  const n = (Number(zip5.slice(2)) % 4) + 1;
  const center = { id: `${zoneId}-${n}`, name: `${ZONES[zoneId].name} Islamic Center ${n}` };
  const nearBorder = Number(zip5[4]) % 3 === 0; // mock: some ZIPs are "near a border"
  const next = ORDER[(ORDER.indexOf(zoneId) + 1) % ORDER.length];
  const alternatives = nearBorder ? [{ id: `${next}-1`, name: `${ZONES[next].name} Islamic Center 1`, zoneName: ZONES[next].name, miles: 3.2 }] : [];
  return { inServiceArea: true, zone: { id: zoneId, name: ZONES[zoneId].name }, center, nearBorder, alternatives, estimate: true };
}
