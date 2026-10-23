import { fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { todayISO } from '#lib/format.js';
import { ANNOUNCEMENT_TAGS, COMPETITION } from '#lib/hub.js';
import { IdForm, parse, required } from '#lib/server/hub.js';
import { dbFail } from '#lib/server/tasks.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const today = todayISO();
	const [announcements, members, next] = await Promise.all([
		supabase
			.from('announcements')
			.select(
				'id, tag, title, body, created_at, author:profiles!announcements_created_by_fkey(id, full_name, dept)'
			)
			.order('created_at', { ascending: false })
			.limit(100),
		supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
		supabase
			.from('events')
			.select('title, starts_on')
			.gte('starts_on', today)
			.order('starts_on')
			.limit(1)
			.maybeSingle()
	]);
	return {
		announcements: announcements.data ?? [],
		memberCount: members.count ?? 0,
		nextEvent: next.data,
		competition: COMPETITION,
		today
	};
};

const Post = v.object({
	tag: v.picklist(ANNOUNCEMENT_TAGS),
	title: required(120, 'Give it a title.'),
	body: required(4000, 'Write the message.')
});

export const actions: Actions = {
	post: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, Post);
		if (issue) return issue;
		const { error } = await supabase.from('announcements').insert(data);
		if (error) return dbFail(error);
		return { message: 'Announcement posted' };
	},

	remove: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, IdForm);
		if (issue) return issue;
		const { data: rows, error } = await supabase
			.from('announcements')
			.delete()
			.eq('id', data.id)
			.select('id');
		if (error) return dbFail(error);
		if (!rows?.length) return fail(403, { message: 'You cannot remove this announcement.' });
		return { message: 'Announcement removed' };
	}
};
