import { fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { ONBOARD_KEYS, OPENING_STATUSES } from '#lib/hub.js';
import { IdForm, myId, parse, required } from '#lib/server/hub.js';
import { dbFail, text } from '#lib/server/tasks.js';
import type { Actions, PageServerLoad } from './$types';

const TABS = ['roles', 'hiring', 'onboarding', 'workshop', 'comms'] as const;
type Tab = (typeof TABS)[number];

export const load: PageServerLoad = async ({ locals, url }) => {
	const asked = url.searchParams.get('tab') ?? '';
	const tab: Tab = (TABS as readonly string[]).includes(asked) ? (asked as Tab) : 'roles';
	const me = await myId(locals);
	const { supabase } = locals;

	const [openings, onboarding, directory] = await Promise.all([
		supabase
			.from('openings')
			.select('id, title, looking_for, description, status')
			.order('created_at', { ascending: false }),
		supabase.from('onboarding_progress').select('item').eq('user_id', me),
		supabase
			.from('profiles')
			.select('id, full_name, dept, details:member_details(dm_channel, semester)')
			.eq('is_active', true)
			.order('dept')
			.order('full_name')
	]);
	const people = directory.data ?? [];
	return {
		tab,
		openings: openings.data ?? [],
		done: (onboarding.data ?? []).map((r) => r.item),
		people,
		mySemester: people.find((p) => p.id === me)?.details?.semester ?? null
	};
};

const Onboarding = v.object({
	item: v.picklist(ONBOARD_KEYS),
	done: v.picklist(['true', 'false'])
});
const Opening = v.object({
	title: required(120, 'Name the role.'),
	looking_for: required(160, 'Say who you are looking for.'),
	description: v.optional(text(2000), '')
});
const OpeningStatus = v.object({
	id: v.pipe(v.string(), v.uuid()),
	status: v.picklist(OPENING_STATUSES)
});

export const actions: Actions = {
	onboarding: async ({ request, locals }) => {
		const { data, issue } = await parse(request, Onboarding);
		if (issue) return issue;
		const me = await myId(locals);
		const { error } =
			data.done === 'true'
				? await locals.supabase
						.from('onboarding_progress')
						.upsert({ user_id: me, item: data.item }, { ignoreDuplicates: true })
				: await locals.supabase
						.from('onboarding_progress')
						.delete()
						.eq('user_id', me)
						.eq('item', data.item);
		if (error) return dbFail(error);
		return {};
	},

	addOpening: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, Opening);
		if (issue) return issue;
		const { error } = await supabase.from('openings').insert(data);
		if (error) return dbFail(error);
		return { message: 'Opening saved as a draft' };
	},

	setOpening: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, OpeningStatus);
		if (issue) return issue;
		const { data: rows, error } = await supabase
			.from('openings')
			.update({ status: data.status })
			.eq('id', data.id)
			.select('id');
		if (error) return dbFail(error);
		if (!rows?.length) return fail(403, { message: 'Only admins can change openings.' });
		return { message: 'Opening updated' };
	},

	removeOpening: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, IdForm);
		if (issue) return issue;
		const { data: rows, error } = await supabase
			.from('openings')
			.delete()
			.eq('id', data.id)
			.select('id');
		if (error) return dbFail(error);
		if (!rows?.length) return fail(403, { message: 'Only admins can remove openings.' });
		return { message: 'Opening removed' };
	}
};
