/** O6 white-box: khutbah schedule helpers. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { khutbahFor, nextFriday, parseKhutbahSheet, PrayerSettingsSchema, mockPrayerSettings } from '@/lib/community/prayer';

test('nextFriday: a Friday stays, other days move forward', () => {
  assert.equal(nextFriday('2026-10-23'), '2026-10-23'); // Friday
  assert.equal(nextFriday('2026-10-21'), '2026-10-23'); // Wednesday
  assert.equal(nextFriday('2026-10-24'), '2026-10-30'); // Saturday
});

test('older prayer documents without a khutbah section still parse (defaults)', () => {
  const { khutbah: _k, ...old } = mockPrayerSettings; // eslint-disable-line @typescript-eslint/no-unused-vars
  const p = PrayerSettingsSchema.safeParse(old);
  assert.ok(p.success && p.data.khutbah.enabled === false && p.data.khutbah.rows.length === 0);
});

test('khutbahFor filters by date / center / window and sorts', () => {
  const k = { enabled: true, feedbackUrl: '', note: '', rows: [
    { date: '2026-10-30', center: 'B', khateeb: '', topic: '', language: '', time: '', note: '' },
    { date: '2026-10-23', center: 'B', khateeb: '', topic: '', language: '', time: '14:15', note: '' },
    { date: '2026-10-23', center: 'A', khateeb: '', topic: '', language: '', time: '', note: '' },
    { date: '2027-01-08', center: 'A', khateeb: '', topic: '', language: '', time: '', note: '' },
  ] };
  assert.deepEqual(khutbahFor(k, { date: '2026-10-23' }).map((r) => r.center), ['A', 'B']);
  assert.deepEqual(khutbahFor(k, { center: 'A', from: '2026-10-21', weeks: 4 }).map((r) => r.date), ['2026-10-23']);
  assert.equal(khutbahFor(k, { center: 'B' }).length, 2);
});

test('parseKhutbahSheet: TSV and CSV, any column order, US dates, center name matching, warnings', () => {
  const centers = ['Masjid Al-Salam', 'Bear Creek Islamic Center'];
  const tsv = 'Center\tDate\tKhateeb\tTopic\tTime\nmasjid al-salam\t10/24/2026\tImam Yusuf\tGratitude\t1:15\nNowhere\t2026-10-24\tX\tY\t';
  const r = parseKhutbahSheet(tsv, centers);
  assert.equal(r.rows.length, 2);
  assert.deepEqual([r.rows[0].date, r.rows[0].center, r.rows[0].time], ['2026-10-24', 'Masjid Al-Salam', '01:15']);
  assert.ok(r.errors.some((e) => e.includes('Nowhere')), 'unknown center is a warning, row kept');
  const csv = 'date,center,khateeb,topic\n2026-10-31,"Bear Creek Islamic Center","Dr. Hasan","Tawakkul, trust"\nbad-date,Masjid Al-Salam,,';
  const c = parseKhutbahSheet(csv, centers);
  assert.equal(c.rows.length, 1);
  assert.equal(c.rows[0].topic, 'Tawakkul, trust');
  assert.ok(c.errors.some((e) => e.startsWith('Row 3')));
  assert.ok(parseKhutbahSheet('only one line', centers).errors.length === 1);
  assert.ok(parseKhutbahSheet('a\tb\nx\ty', centers).errors[0].includes('header'));
});
