import { fail } from '@sveltejs/kit';
import { MIN_PASSWORD_LENGTH } from '#lib/config.js';
import type { Actions } from './$types';

export const actions: Actions = {
	changePassword: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { claims } = await safeGetSession();
		if (!claims?.email) return fail(401, { message: 'Please log in again.' });

		const form = await request.formData();
		const current = String(form.get('current') ?? '');
		const p1 = String(form.get('p1') ?? '');
		const p2 = String(form.get('p2') ?? '');
		if (p1.length < MIN_PASSWORD_LENGTH) {
			return fail(400, { message: `Use at least ${MIN_PASSWORD_LENGTH} characters.` });
		}
		if (p1.length > 200) return fail(400, { message: 'That password is too long.' });
		if (p1 !== p2) return fail(400, { message: "The two passwords don't match." });

		// Prove it is really them (a borrowed, unlocked laptop) before changing anything.
		const { error: verify } = await supabase.auth.signInWithPassword({
			email: claims.email,
			password: current
		});
		if (verify) return fail(400, { message: 'Your current password is wrong.' });

		const { error } = await supabase.auth.updateUser({ password: p1 });
		if (error) {
			return fail(400, {
				message: /different from the old/i.test(error.message)
					? 'That is already your password.'
					: error.message
			});
		}
		return { message: 'Password updated' };
	}
};
