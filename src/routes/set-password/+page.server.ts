import { fail, redirect } from '@sveltejs/kit';
import { MIN_PASSWORD_LENGTH } from '#lib/config.js';
import { clearMustChange } from '#lib/server/admin.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { claims } = await safeGetSession();
	if (!claims) redirect(303, '/login');

	const { data: me } = await supabase
		.from('profiles')
		.select('full_name, must_change_password')
		.eq('id', claims.sub)
		.maybeSingle();
	if (!me) redirect(303, '/login');
	if (!me.must_change_password) redirect(303, '/');
	return { firstName: me.full_name.split(' ')[0] };
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { claims } = await safeGetSession();
		if (!claims) redirect(303, '/login');

		const form = await request.formData();
		const p1 = String(form.get('p1') ?? '');
		const p2 = String(form.get('p2') ?? '');
		if (p1.length < MIN_PASSWORD_LENGTH)
			return fail(400, { error: `Use at least ${MIN_PASSWORD_LENGTH} characters.` });
		if (p1.length > 200) return fail(400, { error: 'That password is too long.' });
		if (p1 !== p2) return fail(400, { error: "The two passwords don't match." });

		// Supabase refuses a new password equal to the current (temporary) one.
		const { error } = await supabase.auth.updateUser({ password: p1 });
		if (error) {
			const same = /different from the old/i.test(error.message);
			return fail(400, {
				error: same ? 'Choose something other than your temporary password.' : error.message
			});
		}

		await clearMustChange(claims.sub);
		redirect(303, '/');
	}
};
