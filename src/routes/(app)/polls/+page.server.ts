import { fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { IdForm, myId, parse, required } from '#lib/server/hub.js';
import { dbFail } from '#lib/server/tasks.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	// poll_votes links polls and options too, so name the direct relationships.
	const { data } = await supabase
		.from('polls')
		.select(
			`id, question, is_open, created_at,
			author:profiles!polls_created_by_fkey(full_name),
			options:poll_options!poll_options_poll_id_fkey(id, position, label),
			votes:poll_votes!poll_votes_poll_id_fkey(user_id, option_id)`
		)
		.order('is_open', { ascending: false })
		.order('created_at', { ascending: false })
		.limit(100);
	return { polls: data ?? [] };
};

const Create = v.object({
	question: required(200, 'Write the question.'),
	options: v.pipe(
		v.string(),
		v.transform((s) =>
			s
				.split('\n')
				.map((o) => o.trim())
				.filter(Boolean)
		),
		v.minLength(2, 'Give at least two options, one per line.'),
		v.maxLength(10, 'A poll has at most 10 options.'),
		v.check((list) => list.every((o) => o.length <= 120), 'Keep each option under 120 characters.')
	)
});

const Vote = v.object({
	poll_id: v.pipe(v.string(), v.uuid()),
	option_id: v.pipe(v.string(), v.uuid())
});

const Toggle = v.object({
	id: v.pipe(v.string(), v.uuid()),
	open: v.pipe(
		v.picklist(['true', 'false']),
		v.transform((s) => s === 'true')
	)
});

export const actions: Actions = {
	// Admin only; create_poll re-checks and writes the poll and its options together.
	create: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, Create);
		if (issue) return issue;
		const { error } = await supabase.rpc('create_poll', {
			p_question: data.question,
			p_options: data.options
		});
		if (error) return dbFail(error);
		return { message: 'Poll created' };
	},

	// One vote per poll; another option moves it, the same option takes it back.
	vote: async ({ request, locals }) => {
		const { data, issue } = await parse(request, Vote);
		if (issue) return issue;
		const me = await myId(locals);
		const { data: removed, error: removeError } = await locals.supabase
			.from('poll_votes')
			.delete()
			.eq('poll_id', data.poll_id)
			.eq('user_id', me)
			.eq('option_id', data.option_id)
			.select('poll_id');
		if (removeError) return dbFail(removeError);
		if (removed?.length) return { message: 'Vote removed' };
		const { error } = await locals.supabase
			.from('poll_votes')
			.upsert(
				{ poll_id: data.poll_id, option_id: data.option_id, user_id: me },
				{ onConflict: 'poll_id,user_id' }
			);
		if (error) return dbFail(error);
		return { message: 'Vote saved' };
	},

	toggle: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, Toggle);
		if (issue) return issue;
		const { data: rows, error } = await supabase
			.from('polls')
			.update({ is_open: data.open })
			.eq('id', data.id)
			.select('id');
		if (error) return dbFail(error);
		if (!rows?.length) return fail(403, { message: 'Only admins can open and close polls.' });
		return { message: data.open ? 'Poll reopened' : 'Poll closed' };
	},

	remove: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, IdForm);
		if (issue) return issue;
		const { data: rows, error } = await supabase
			.from('polls')
			.delete()
			.eq('id', data.id)
			.select('id');
		if (error) return dbFail(error);
		if (!rows?.length) return fail(403, { message: 'Only admins can remove polls.' });
		return { message: 'Poll removed' };
	}
};
