/**
 * Members sign in with a username. Supabase Auth needs an email address, so the
 * username is mapped to a placeholder on a reserved, undeliverable domain
 * (RFC 2606 `.invalid`). Nothing is ever sent there, and a password-recovery
 * request for such an address goes nowhere. To move to real emails later,
 * change AUTH_EMAIL_DOMAIN and usernameToEmail in this one place.
 *
 * Keep this file free of imports and of runtime-only TypeScript syntax: the
 * member script (scripts/create-member.mjs) loads it directly with Node.
 */
export const AUTH_EMAIL_DOMAIN = 'krakens.invalid';

export const MIN_PASSWORD_LENGTH = 8;
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{1,31}$/;

export const usernameToEmail = (username: string): string =>
	`${username.trim().toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;

/** Accepts a bare username ("andrea") or a full address ("andrea@…"). */
export const loginIdToEmail = (input: string): string => {
	const id = input.trim().toLowerCase();
	return id.includes('@') ? id : usernameToEmail(id);
};

export const DEPTS = ['business', 'mechanical', 'electrical'] as const;
export type Dept = (typeof DEPTS)[number];
export const DEPT_LABEL: Record<Dept, string> = {
	business: 'Business',
	mechanical: 'Mechanical',
	electrical: 'Electrical'
};

export const STATUSES = ['todo', 'doing', 'blocked', 'review', 'done', 'failed'] as const;
export type TaskStatus = (typeof STATUSES)[number];
export const STATUS_LABEL: Record<TaskStatus, string> = {
	todo: 'To do',
	doing: 'In progress',
	blocked: 'Blocked',
	review: 'In review',
	done: 'Done',
	failed: 'Failed'
};
/** Tag colour class from the stylesheet. */
export const STATUS_TAG: Record<TaskStatus, string> = {
	todo: 'neutral',
	doing: 'info',
	blocked: 'warn',
	review: 'urgent',
	done: 'ok',
	failed: 'bad'
};

export const PHASES = ['planning', 'work', 'feedback'] as const;
export type Phase = (typeof PHASES)[number];
export const PHASE_LABEL: Record<Phase, string> = {
	planning: 'Planning',
	work: 'Work',
	feedback: 'Feedback'
};

/** What an admin supplies for a new account; stored as app_metadata (users cannot edit it). */
export const memberMetadata = (m: {
	username: string;
	fullName: string;
	dept: Dept;
	roleTitle?: string;
	isAdmin?: boolean;
}) => ({
	username: m.username,
	full_name: m.fullName,
	dept: m.dept,
	role_title: m.roleTitle ?? '',
	is_admin: m.isAdmin ?? false
});

/** Random temporary password, no look-alike characters, no modulo bias. */
export const generatePassword = (length = 14): string => {
	const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	const limit = 256 - (256 % alphabet.length);
	let out = '';
	while (out.length < length) {
		const [byte] = crypto.getRandomValues(new Uint8Array(1));
		if (byte < limit) out += alphabet[byte % alphabet.length];
	}
	return out;
};
