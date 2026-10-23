import { fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { DEPTS } from '#lib/config.js';
import { IdForm, myId, parse, required } from '#lib/server/hub.js';
import { dbFail } from '#lib/server/tasks.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data } = await supabase
		.from('ideas')
		.select(
			`id, body, dept, created_at, created_by,
			author:profiles!ideas_created_by_fkey(id, full_name, dept),
			idea_votes(user_id)`
		)
		.order('created_at', { ascending: false })
		.limit(300);
	return { ideas: data ?? [] };
};

const Add = v.object({
	body: required(280, 'Write your idea.'),
	// "all" is the whole team, stored as no department
	dept: v.pipe(
		v.picklist([...DEPTS, 'all'], 'Pick a department.'),
		v.transform((d) => (d === 'all' ? null : d))
	)
});

export const actions: Actions = {
	add: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, Add);
		if (issue) return issue;
		const { error } = await supabase.from('ideas').insert(data);
		if (error) return dbFail(error);
		return { message: 'Idea added' };
	},

	// Toggles your vote: removes it if you had one, adds it otherwise.
	vote: async ({ request, locals }) => {
		const { data, issue } = await parse(request, IdForm);
		if (issue) return issue;
		const me = await myId(locals);
		const { data: removed, error } = await locals.supabase
			.from('idea_votes')
			.delete()
			.eq('idea_id', data.id)
			.eq('user_id', me)
			.select('idea_id');
		if (error) return dbFail(error);
		if (removed?.length) return { message: 'Vote removed' };
		const { error: insertError } = await locals.supabase
			.from('idea_votes')
			.insert({ idea_id: data.id, user_id: me });
		if (insertError) return dbFail(insertError);
		return { message: 'Voted' };
	},

	remove: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, IdForm);
		if (issue) return issue;
		const { data: rows, error } = await supabase
			.from('ideas')
			.delete()
			.eq('id', data.id)
			.select('id');
		if (error) return dbFail(error);
		if (!rows?.length) return fail(403, { message: 'You can only remove your own ideas.' });
		return { message: 'Idea removed' };
	}
};
