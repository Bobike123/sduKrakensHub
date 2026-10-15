import { describe, expect, it } from 'vitest';
import {
	AUTH_EMAIL_DOMAIN,
	USERNAME_PATTERN,
	generatePassword,
	loginIdToEmail,
	memberMetadata,
	usernameToEmail
} from './config';

describe('username to email mapping', () => {
	it('maps a username to an address on the reserved, undeliverable domain', () => {
		expect(usernameToEmail('Andrea')).toBe(`andrea@${AUTH_EMAIL_DOMAIN}`);
		expect(AUTH_EMAIL_DOMAIN.endsWith('.invalid')).toBe(true);
	});

	it('accepts a bare username or a full address at login', () => {
		expect(loginIdToEmail('  Andrea ')).toBe(`andrea@${AUTH_EMAIL_DOMAIN}`);
		expect(loginIdToEmail('Andrea@Example.com')).toBe('andrea@example.com');
	});

	it('validates usernames', () => {
		for (const ok of ['andrea', 'a.b', 'pia_w-2', 'x1'])
			expect(USERNAME_PATTERN.test(ok)).toBe(true);
		for (const bad of ['', 'a', 'Andrea', 'has space', '.dot', 'a'.repeat(33), 'ö'])
			expect(USERNAME_PATTERN.test(bad)).toBe(false);
	});
});

describe('generatePassword', () => {
	it('has the requested length and avoids look-alike characters', () => {
		for (let i = 0; i < 50; i++) {
			const pw = generatePassword(14);
			expect(pw).toHaveLength(14);
			expect(pw).not.toMatch(/[0O1lIi]/);
		}
	});

	it('does not repeat', () => {
		const seen = new Set(Array.from({ length: 200 }, () => generatePassword()));
		expect(seen.size).toBe(200);
	});
});

describe('memberMetadata', () => {
	it('builds the app_metadata the account trigger reads', () => {
		expect(
			memberMetadata({ username: 'pia', fullName: 'Pia W', dept: 'business', isAdmin: true })
		).toEqual({
			username: 'pia',
			full_name: 'Pia W',
			dept: 'business',
			role_title: '',
			is_admin: true
		});
	});
});
