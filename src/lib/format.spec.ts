import { describe, expect, it } from 'vitest';
import { daysUntil, firstName, fmtDate, initials, relDays } from './format';

describe('date maths', () => {
	it('counts whole days between ISO dates, regardless of timezone', () => {
		expect(daysUntil('2026-11-04', '2026-11-01')).toBe(3);
		expect(daysUntil('2026-11-01', '2026-11-04')).toBe(-3);
		expect(daysUntil('2026-11-01', '2026-11-01')).toBe(0);
	});

	it('crosses daylight-saving changes without drifting', () => {
		// Denmark moves the clocks on 2026-10-25 and 2027-03-28.
		expect(daysUntil('2026-10-26', '2026-10-24')).toBe(2);
		expect(daysUntil('2027-03-29', '2027-03-27')).toBe(2);
	});

	it('describes days in words', () => {
		expect(relDays(0)).toBe('today');
		expect(relDays(1)).toBe('tomorrow');
		expect(relDays(-1)).toBe('yesterday');
		expect(relDays(5)).toBe('in 5 days');
		expect(relDays(-5)).toBe('5 days ago');
	});

	it('formats dates', () => {
		expect(fmtDate('2026-11-04')).toBe('4 Nov 2026');
		expect(fmtDate('2027-07-08T10:00:00Z')).toBe('8 Jul 2027');
	});
});

describe('names', () => {
	it('derives initials and first names', () => {
		expect(initials('Andrea Lovrinović')).toBe('AL');
		expect(initials('  pia ')).toBe('P');
		expect(firstName('Nikita Kudriavtsev')).toBe('Nikita');
	});
});
