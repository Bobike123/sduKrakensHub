import { fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { IdForm, parse, required } from '#lib/server/hub.js';
import { dbFail, text } from '#lib/server/tasks.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const [entries, people] = await Promise.all([
		supabase
			.from('namebook')
			.select(
				`id, person, context, contact, known_by, created_by,
				knower:profiles!namebook_known_by_fkey(id, full_name, dept)`
			)
			.order('person'),
		supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name')
	]);
	return { entries: entries.data ?? [], people: people.data ?? [] };
};

const Add = v.object({
	person: required(120, 'Who is it?'),
	context: required(300, 'Say how they are connected to us.'),
	contact: v.optional(text(200), ''),
	known_by: v.pipe(v.string(), v.uuid('Pick who knows them.'))
});

export const actions: Actions = {
	add: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, Add);
		if (issue) return issue;
		const { error } = await supabase.from('namebook').insert(data);
		if (error) return dbFail(error);
		return { message: 'Contact added' };
	},

	remove: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, IdForm);
		if (issue) return issue;
		const { data: rows, error } = await supabase
			.from('namebook')
			.delete()
			.eq('id', data.id)
			.select('id');
		if (error) return dbFail(error);
		if (!rows?.length) return fail(403, { message: 'You cannot remove this contact.' });
		return { message: 'Contact removed' };
	}
};
