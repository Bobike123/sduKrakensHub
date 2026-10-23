import { fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { DEPTS } from '#lib/config.js';
import { todayISO } from '#lib/format.js';
import { IdForm, futureDate, parse, required } from '#lib/server/hub.js';
import { dbFail, text } from '#lib/server/tasks.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	// RLS limits this to your department's requests (all of them for admins).
	const [requests, people] = await Promise.all([
		supabase
			.from('meeting_requests')
			.select(
				`id, dept, topic, meet_on, meet_at, note, created_at, created_by,
				author:profiles!meeting_requests_created_by_fkey(full_name)`
			)
			.order('created_at', { ascending: false })
			.limit(100),
		supabase.from('profiles').select('id, dept').eq('is_active', true)
	]);
	return { requests: requests.data ?? [], people: people.data ?? [], today: todayISO() };
};

const Request = v.object({
	topic: required(120, 'Name the topic.'),
	meet_on: futureDate('Pick a date from today on.'),
	meet_at: v.pipe(v.string(), v.regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Pick a time.')),
	dept: v.picklist(DEPTS),
	note: v.optional(text(200), '')
});

export const actions: Actions = {
	// The department is notified by a database trigger; the page then offers
	// ready-made texts to paste into WhatsApp or an email.
	request: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, Request);
		if (issue) return issue;
		const { error } = await supabase.from('meeting_requests').insert(data);
		if (error) return dbFail(error);
		return { message: 'Request sent', sent: data };
	},

	remove: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, IdForm);
		if (issue) return issue;
		const { data: rows, error } = await supabase
			.from('meeting_requests')
			.delete()
			.eq('id', data.id)
			.select('id');
		if (error) return dbFail(error);
		if (!rows?.length) return fail(403, { message: 'You can only remove your own requests.' });
		return { message: 'Request removed' };
	}
};
