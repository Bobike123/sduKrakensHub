import { fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { DEPTS, USERNAME_PATTERN } from '#lib/config.js';
import { createMember, resetPassword, setBanned } from '#lib/server/admin.js';
import { dbFail, formOf, text } from '#lib/server/tasks.js';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data } = await supabase
		.from('profiles')
		.select(
			`id, username, full_name, dept, role_title, is_admin, is_active, must_change_password,
			details:member_details(studies, semester, dm_channel)`
		)
		.order('is_active', { ascending: false })
		.order('dept')
		.order('full_name');
	return { members: data ?? [] };
};

/** The admin client bypasses RLS, so every action here re-checks the caller first. */
async function isAdmin({ locals: { supabase, safeGetSession } }: RequestEvent) {
	const { claims } = await safeGetSession();
	if (!claims) return false;
	const { data } = await supabase
		.from('profiles')
		.select('is_admin')
		.eq('id', claims.sub)
		.maybeSingle();
	return data?.is_admin === true;
}

const forbidden = () => fail(403, { message: 'Only admins can manage members.' });
const Id = v.object({ id: v.pipe(v.string(), v.uuid()) });

const Create = v.object({
	username: v.pipe(
		v.string(),
		v.trim(),
		v.toLowerCase(),
		v.regex(USERNAME_PATTERN, 'Username: 2-32 characters, a-z 0-9 . _ -')
	),
	full_name: v.pipe(v.string(), v.trim(), v.minLength(1, 'Enter a name.'), v.maxLength(80)),
	dept: v.picklist(DEPTS),
	role_title: v.optional(text(80), ''),
	is_admin: v.optional(v.string(), '')
});

const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');

export const actions: Actions = {
	create: async (event) => {
		if (!(await isAdmin(event))) return forbidden();
		const parsed = v.safeParse(Create, await formOf(event.request));
		if (!parsed.success) {
			return fail(400, { message: parsed.issues[0]?.message ?? 'Please check the form.' });
		}
		const m = parsed.output;
		try {
			const result = await createMember({
				username: m.username,
				fullName: m.full_name,
				dept: m.dept,
				roleTitle: m.role_title,
				isAdmin: m.is_admin === 'on'
			});
			if (!result.ok) return fail(400, { message: result.message });
			// Shown once on screen, never stored: hand it over privately.
			return {
				message: 'Account created',
				reveal: { username: m.username, password: result.password }
			};
		} catch (e) {
			return fail(500, { message: message(e) });
		}
	},

	reset: async (event) => {
		if (!(await isAdmin(event))) return forbidden();
		const parsed = v.safeParse(Id, await formOf(event.request));
		if (!parsed.success) return fail(400, { message: 'That change was not valid.' });
		const { data: member } = await event.locals.supabase
			.from('profiles')
			.select('username')
			.eq('id', parsed.output.id)
			.maybeSingle();
		if (!member) return fail(404, { message: 'Member not found.' });
		try {
			const result = await resetPassword(parsed.output.id);
			if (!result.ok) return fail(400, { message: result.message });
			return {
				message: 'Password reset',
				reveal: { username: member.username, password: result.password }
			};
		} catch (e) {
			return fail(500, { message: message(e) });
		}
	},

	setActive: async (event) => {
		if (!(await isAdmin(event))) return forbidden();
		const raw = await formOf(event.request);
		const parsed = v.safeParse(Id, raw);
		if (!parsed.success) return fail(400, { message: 'That change was not valid.' });
		const active = raw.active === 'true';

		// The profile change goes through RLS and the "keep one admin" trigger first.
		const { data, error } = await event.locals.supabase
			.from('profiles')
			.update({ is_active: active })
			.eq('id', parsed.output.id)
			.select('id');
		if (error) return dbFail(error);
		if (!data?.length) return fail(403, { message: 'You cannot change this member.' });
		try {
			const banned = await setBanned(parsed.output.id, !active);
			if (!banned.ok) return fail(500, { message: banned.message });
		} catch (e) {
			return fail(500, { message: message(e) });
		}
		return { message: active ? 'Member reactivated' : 'Member deactivated' };
	},

	setAdmin: async (event) => {
		if (!(await isAdmin(event))) return forbidden();
		const raw = await formOf(event.request);
		const parsed = v.safeParse(Id, raw);
		if (!parsed.success) return fail(400, { message: 'That change was not valid.' });
		const { data, error } = await event.locals.supabase
			.from('profiles')
			.update({ is_admin: raw.admin === 'true' })
			.eq('id', parsed.output.id)
			.select('id');
		if (error) return dbFail(error);
		if (!data?.length) return fail(403, { message: 'You cannot change this member.' });
		return { message: raw.admin === 'true' ? 'Admin rights granted' : 'Admin rights removed' };
	}
};
