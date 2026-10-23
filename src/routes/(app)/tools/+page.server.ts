import { fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { TOOL_STATUSES } from '#lib/hub.js';
import { IdForm, myId, parse, required } from '#lib/server/hub.js';
import { dbFail, optionalUuid } from '#lib/server/tasks.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const [tools, people] = await Promise.all([
		supabase
			.from('tools')
			.select('id, item, status, owner_id, owner:profiles!tools_owner_id_fkey(id, full_name, dept)')
			.order('item'),
		supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name')
	]);
	return { tools: tools.data ?? [], people: people.data ?? [] };
};

const Add = v.object({
	item: required(120, 'Name the tool.'),
	status: v.picklist(TOOL_STATUSES),
	// Only admins get the owner picker; everyone else lists their own tools.
	owner_id: optionalUuid
});
const SetStatus = v.object({
	id: v.pipe(v.string(), v.uuid()),
	status: v.picklist(TOOL_STATUSES)
});

export const actions: Actions = {
	add: async ({ request, locals }) => {
		const { data, issue } = await parse(request, Add);
		if (issue) return issue;
		const { error } = await locals.supabase.from('tools').insert({
			item: data.item,
			status: data.status,
			owner_id: data.owner_id ?? (await myId(locals))
		});
		if (error) return dbFail(error);
		return { message: 'Tool added' };
	},

	setStatus: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, SetStatus);
		if (issue) return issue;
		const { data: rows, error } = await supabase
			.from('tools')
			.update({ status: data.status })
			.eq('id', data.id)
			.select('id');
		if (error) return dbFail(error);
		if (!rows?.length) return fail(403, { message: 'Only the owner can update this tool.' });
		return { message: 'Tool updated' };
	},

	remove: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, IdForm);
		if (issue) return issue;
		const { data: rows, error } = await supabase
			.from('tools')
			.delete()
			.eq('id', data.id)
			.select('id');
		if (error) return dbFail(error);
		if (!rows?.length) return fail(403, { message: 'Only the owner can remove this tool.' });
		return { message: 'Tool removed' };
	}
};
