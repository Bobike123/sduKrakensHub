import { fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { todayISO } from '#lib/format.js';
import { IdForm, parse, required } from '#lib/server/hub.js';
import { dbFail, text } from '#lib/server/tasks.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data } = await supabase
		.from('events')
		.select('id, starts_on, title, place, description')
		.order('starts_on')
		.limit(300);
	return { events: data ?? [], today: todayISO() };
};

const Add = v.object({
	starts_on: v.pipe(v.string(), v.isoDate('Pick a date.')),
	title: required(120, 'Name the event.'),
	place: v.optional(text(120), ''),
	description: v.optional(text(1000), '')
});

export const actions: Actions = {
	add: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, Add);
		if (issue) return issue;
		const { error } = await supabase.from('events').insert(data);
		if (error) return dbFail(error);
		return { message: 'Event added' };
	},

	remove: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, IdForm);
		if (issue) return issue;
		const { data: rows, error } = await supabase
			.from('events')
			.delete()
			.eq('id', data.id)
			.select('id');
		if (error) return dbFail(error);
		if (!rows?.length) return fail(403, { message: 'Only admins can remove events.' });
		return { message: 'Event removed' };
	}
};
