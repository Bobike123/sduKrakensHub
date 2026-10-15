import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { loginIdToEmail } from '#lib/config.js';
import type { Actions, PageServerLoad } from './$types';

const LoginSchema = v.object({
	username: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120)),
	password: v.pipe(v.string(), v.minLength(1), v.maxLength(200))
});

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
	const { claims } = await safeGetSession();
	if (claims) redirect(303, '/');
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const form = await request.formData();
		const parsed = v.safeParse(LoginSchema, {
			username: form.get('username'),
			password: form.get('password')
		});
		const username = String(form.get('username') ?? '').slice(0, 120);
		if (!parsed.success) return fail(400, { error: 'Enter your username and password.', username });

		const { error } = await supabase.auth.signInWithPassword({
			email: loginIdToEmail(parsed.output.username),
			password: parsed.output.password
		});
		// One message for "no such user", "wrong password" and "deactivated", so
		// the form cannot be used to find out who is a member.
		if (error) return fail(400, { error: 'That username and password do not match.', username });

		redirect(303, '/');
	}
};
