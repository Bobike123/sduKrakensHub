import { fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { MIN_PASSWORD_LENGTH } from '#lib/config.js';
import { DM_CHANNELS } from '#lib/hub.js';
import { myId, parse } from '#lib/server/hub.js';
import { dbFail, text } from '#lib/server/tasks.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const me = await myId(locals);
	const [details, onboarding] = await Promise.all([
		locals.supabase
			.from('member_details')
			.select('studies, semester, dm_channel')
			.eq('user_id', me)
			.maybeSingle(),
		locals.supabase
			.from('onboarding_progress')
			.select('item', { count: 'exact', head: true })
			.eq('user_id', me)
	]);
	return { details: details.data, onboardingDone: onboarding.count ?? 0 };
};

const blankToNull = (s: string) => (s === '' ? null : s);
const Details = v.object({
	studies: v.optional(text(80), ''),
	semester: v.pipe(
		v.optional(v.string(), ''),
		v.transform(blankToNull),
		v.nullable(
			v.pipe(
				v.string(),
				v.transform(Number),
				v.integer(),
				v.minValue(1),
				v.maxValue(12, 'Pick a semester from 1 to 12.')
			)
		)
	),
	dm_channel: v.pipe(
		v.optional(v.string(), ''),
		v.transform(blankToNull),
		v.nullable(v.picklist(DM_CHANNELS))
	)
});

export const actions: Actions = {
	// `details: true` tells the page which form the message belongs to.
	saveDetails: async ({ request, locals }) => {
		const { data, issue } = await parse(request, Details);
		if (issue) return fail(400, { message: 'Please check your details.', details: true });
		const { error } = await locals.supabase
			.from('member_details')
			.upsert({ user_id: await myId(locals), ...data }, { onConflict: 'user_id' });
		if (error) return dbFail(error);
		return { message: 'Details saved', details: true };
	},

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
