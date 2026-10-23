import { fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { COMPONENT_STATUSES } from '#lib/hub.js';
import { IdForm, parse, required } from '#lib/server/hub.js';
import { dbFail, text } from '#lib/server/tasks.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data } = await supabase
		.from('boat_components')
		.select('id, name, detail, status, position')
		.order('position')
		.order('created_at');
	return { components: data ?? [] };
};

const Add = v.object({
	name: required(80, 'Name the component.'),
	detail: v.optional(text(160), ''),
	status: v.picklist(COMPONENT_STATUSES)
});
const SetStatus = v.object({
	id: v.pipe(v.string(), v.uuid()),
	status: v.picklist(COMPONENT_STATUSES)
});

export const actions: Actions = {
	add: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, Add);
		if (issue) return issue;
		const { error } = await supabase.from('boat_components').insert(data);
		if (error) return dbFail(error);
		return { message: 'Component added' };
	},

	setStatus: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, SetStatus);
		if (issue) return issue;
		const { data: rows, error } = await supabase
			.from('boat_components')
			.update({ status: data.status })
			.eq('id', data.id)
			.select('id');
		if (error) return dbFail(error);
		if (!rows?.length) return fail(403, { message: 'Only admins can edit the boat tracker.' });
		return { message: 'Component updated' };
	},

	remove: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, IdForm);
		if (issue) return issue;
		const { data: rows, error } = await supabase
			.from('boat_components')
			.delete()
			.eq('id', data.id)
			.select('id');
		if (error) return dbFail(error);
		if (!rows?.length) return fail(403, { message: 'Only admins can edit the boat tracker.' });
		return { message: 'Component removed' };
	}
};
