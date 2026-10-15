import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { DEPTS } from '#lib/config.js';
import { todayISO } from '#lib/format.js';
import { dbFail, formOf, optionalDate, optionalUuid, text } from '#lib/server/tasks.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const [parts, people] = await Promise.all([
		supabase
			.from('parts')
			.select(
				`id, name, dept, deadline, context,
				lead:profiles!parts_lead_id_fkey(id, full_name, dept),
				tasks(status)`
			)
			.order('deadline', { ascending: true, nullsFirst: false }),
		supabase.from('profiles').select('id, full_name, dept').eq('is_active', true).order('full_name')
	]);
	return { parts: parts.data ?? [], people: people.data ?? [], today: todayISO() };
};

const CreatePart = v.object({
	name: v.pipe(v.string(), v.trim(), v.minLength(1, 'Name the part.'), v.maxLength(120)),
	dept: v.picklist(DEPTS),
	lead_id: v.pipe(v.string(), v.uuid('Pick a lead.')),
	team1: optionalUuid,
	team2: optionalUuid,
	deadline: optionalDate,
	context: v.optional(text(2000), '')
});

export const actions: Actions = {
	// Admin only; the create_part function re-checks that and makes the part, its
	// team and the 12 workflow tasks in one transaction.
	createPart: async ({ request, locals: { supabase } }) => {
		const parsed = v.safeParse(CreatePart, await formOf(request));
		if (!parsed.success) {
			return fail(400, { message: parsed.issues[0]?.message ?? 'Please check the form.' });
		}
		const p = parsed.output;
		const { data, error } = await supabase.rpc('create_part', {
			p_name: p.name,
			p_dept: p.dept,
			p_lead_id: p.lead_id,
			p_context: p.context,
			p_deadline: p.deadline ?? undefined,
			p_team: [p.team1, p.team2].filter((id): id is string => !!id)
		});
		if (error) return dbFail(error);
		redirect(303, `/parts/${data}`);
	}
};
