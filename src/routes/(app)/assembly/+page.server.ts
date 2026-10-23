import { fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { todayISO } from '#lib/format.js';
import { IdForm, futureDate, myId, parse, required } from '#lib/server/hub.js';
import { dbFail, text } from '#lib/server/tasks.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase }, url }) => {
	const today = todayISO();
	const asked = url.searchParams.get('m') ?? '';
	const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(asked) ? asked : today.slice(0, 7);

	const [assemblies, heads] = await Promise.all([
		supabase
			.from('assemblies')
			.select('id, held_on, agenda, status, summary, approvals:assembly_approvals(user_id)')
			.order('held_on')
			.limit(200),
		// The department heads: every active admin approves an assembly.
		supabase
			.from('profiles')
			.select('id, full_name, dept')
			.eq('is_active', true)
			.eq('is_admin', true)
			.order('full_name')
	]);
	return { assemblies: assemblies.data ?? [], heads: heads.data ?? [], month, today };
};

const Propose = v.object({
	held_on: futureDate('Pick a date from today on.'),
	agenda: required(300, 'Write the agenda.')
});

// Only one live (not cancelled) assembly per date; the database enforces it.
const dateTaken = (error: { code?: string; message: string }) =>
	error.code === '23505'
		? fail(400, { message: 'There is already an assembly on that date.' })
		: dbFail(error);
const SetStatus = v.object({
	id: v.pipe(v.string(), v.uuid()),
	status: v.picklist(['proposed', 'cancelled'])
});
const Summary = v.object({
	id: v.pipe(v.string(), v.uuid()),
	summary: v.optional(text(8000), '')
});

export const actions: Actions = {
	propose: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, Propose);
		if (issue) return issue;
		const { error } = await supabase.from('assemblies').insert(data);
		if (error) return dateTaken(error);
		return { message: 'Assembly proposed. The other department heads are notified.' };
	},

	approve: async ({ request, locals }) => {
		const { data, issue } = await parse(request, IdForm);
		if (issue) return issue;
		const { error } = await locals.supabase
			.from('assembly_approvals')
			.insert({ assembly_id: data.id, user_id: await myId(locals) });
		if (error) return dbFail(error);
		return { message: 'Approved' };
	},

	withdraw: async ({ request, locals }) => {
		const { data, issue } = await parse(request, IdForm);
		if (issue) return issue;
		const { data: rows, error } = await locals.supabase
			.from('assembly_approvals')
			.delete()
			.eq('assembly_id', data.id)
			.eq('user_id', await myId(locals))
			.select('assembly_id');
		if (error) return dbFail(error);
		if (!rows?.length) return fail(403, { message: 'You can only withdraw your own approval.' });
		return { message: 'Approval withdrawn' };
	},

	setStatus: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, SetStatus);
		if (issue) return issue;
		const { data: rows, error } = await supabase
			.from('assemblies')
			.update({ status: data.status })
			.eq('id', data.id)
			.select('id');
		if (error) return dateTaken(error);
		if (!rows?.length) return fail(403, { message: 'Only admins can change an assembly.' });
		return {
			message:
				data.status === 'cancelled' ? 'Assembly cancelled' : 'Proposed again: approvals start over'
		};
	},

	summary: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, Summary);
		if (issue) return issue;
		const { data: rows, error } = await supabase
			.from('assemblies')
			.update({ summary: data.summary })
			.eq('id', data.id)
			.select('id');
		if (error) return dbFail(error);
		if (!rows?.length) return fail(403, { message: 'Only admins can write the summary.' });
		return { message: 'Summary saved' };
	},

	remove: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, IdForm);
		if (issue) return issue;
		const { data: rows, error } = await supabase
			.from('assemblies')
			.delete()
			.eq('id', data.id)
			.select('id');
		if (error) return dbFail(error);
		if (!rows?.length) return fail(403, { message: 'Only admins can remove an assembly.' });
		return { message: 'Assembly removed' };
	}
};
