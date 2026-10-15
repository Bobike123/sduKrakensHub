import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SECRET_KEY } from '$app/env/private';
import { PUBLIC_SUPABASE_URL } from '$app/env/public';
import type { Database } from '#lib/database.types.js';
import { generatePassword, memberMetadata, usernameToEmail, type Dept } from '#lib/config.js';

/**
 * Service-role client. It bypasses RLS, so only call it after checking that the
 * signed-in user is an admin, and never send its key or results' secrets to the
 * browser.
 */
export function adminClient() {
	if (!SUPABASE_SECRET_KEY) {
		throw new Error('SUPABASE_SECRET_KEY is not set on the server, so members cannot be managed.');
	}
	return createClient<Database>(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
		auth: { autoRefreshToken: false, persistSession: false }
	});
}

type Result<T> = ({ ok: true } & T) | { ok: false; message: string };

export async function createMember(input: {
	username: string;
	fullName: string;
	dept: Dept;
	roleTitle: string;
	isAdmin: boolean;
}): Promise<Result<{ id: string; password: string }>> {
	const password = generatePassword();
	const { data, error } = await adminClient().auth.admin.createUser({
		email: usernameToEmail(input.username),
		password,
		email_confirm: true, // no confirmation email is ever sent
		// Without an explicit role GoTrue stores '' and PostgREST rejects every token.
		role: 'authenticated',
		app_metadata: memberMetadata(input)
	});
	if (error || !data.user) {
		const taken = /already|registered|exists|Database error/i.test(error?.message ?? '');
		return {
			ok: false,
			message: taken
				? 'Could not create the account. Is that username already taken?'
				: (error?.message ?? 'Could not create the account.')
		};
	}
	return { ok: true, id: data.user.id, password };
}

/** Sets a new temporary password; the member must change it at next login. */
export async function resetPassword(userId: string): Promise<Result<{ password: string }>> {
	const admin = adminClient();
	const password = generatePassword();
	const { error } = await admin.auth.admin.updateUserById(userId, { password });
	if (error) return { ok: false, message: error.message };
	const { error: flagError } = await admin
		.from('profiles')
		.update({ must_change_password: true })
		.eq('id', userId);
	if (flagError) return { ok: false, message: flagError.message };
	return { ok: true, password };
}

/** Deactivated members cannot sign in; their history stays attributed to them. */
export async function setBanned(userId: string, banned: boolean): Promise<Result<object>> {
	const { error } = await adminClient().auth.admin.updateUserById(userId, {
		ban_duration: banned ? '876000h' : 'none'
	});
	return error ? { ok: false, message: error.message } : { ok: true };
}

/** The new password was accepted, so the "must change" flag can come off. */
export async function clearMustChange(userId: string): Promise<void> {
	const { error } = await adminClient()
		.from('profiles')
		.update({ must_change_password: false })
		.eq('id', userId);
	if (error) throw new Error(error.message);
}
