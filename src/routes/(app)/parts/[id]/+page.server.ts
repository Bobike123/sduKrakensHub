import { error, fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { todayISO } from '#lib/format.js';
import { dbFail, formOf, optionalDate, taskActions, text } from '#lib/server/tasks.js';
import type { Actions, PageServerLoad } from './$types';

// Same columns as TASK_SELECT plus the workflow step, so tasks can be shown in step order.
const PART_TASK_SELECT = `
	id, title, description, status, dept, due_date, blocked_reason, outcome,
	part_id, assignee_id, reviewer_id, phase, created_at,
	part:parts(id, name),
	assignee:profiles!tasks_assignee_id_fkey(id, full_name, dept),
	reviewer:profiles!tasks_reviewer_id_fkey(id, full_name, dept),
	step:step_templates(position)
`;

export const load: PageServerLoad = async ({ params, locals: { supabase }, parent }) => {
	const { me } = await parent();

	const { data: part } = await supabase
		.from('parts')
		.select(
			`id, name, dept, context, deadline, lead_id,
			lead:profiles!parts_lead_id_fkey(id, full_name, dept),
			members:part_members(user_id, profile:profiles(id, full_name, dept))`
		)
		.eq('id', params.id)
		.maybeSingle();
	if (!part) error(404, 'Part not found');

	const [tasks, people] = await Promise.all([
		supabase.from('tasks').select(PART_TASK_SELECT).eq('part_id', part.id),
		supabase.from('profiles').select('id, full_name, dept').eq('is_active', true).order('full_name')
	]);

	return {
		part,
		tasks: tasks.data ?? [],
		people: people.data ?? [],
		canManage: me.is_admin || part.lead_id === me.id,
		today: todayISO()
	};
};

const UpdatePart = v.object({
	name: v.pipe(v.string(), v.trim(), v.minLength(1, 'Name the part.'), v.maxLength(120)),
	lead_id: v.pipe(v.string(), v.uuid('Pick a lead.')),
	deadline: optionalDate,
	context: v.optional(text(2000), '')
});
const Member = v.object({ user_id: v.pipe(v.string(), v.uuid()) });

export const actions: Actions = {
	...taskActions,

	updatePart: async ({ request, params, locals: { supabase } }) => {
		const parsed = v.safeParse(UpdatePart, await formOf(request));
		if (!parsed.success) {
			return fail(400, { message: parsed.issues[0]?.message ?? 'Please check the form.' });
		}
		const { data, error: err } = await supabase
			.from('parts')
			.update(parsed.output)
			.eq('id', params.id)
			.select('id');
		if (err) return dbFail(err);
		if (!data?.length) return fail(403, { message: 'You cannot change this part.' });
		return { message: 'Part saved' };
	},

	addMember: async ({ request, params, locals: { supabase } }) => {
		const parsed = v.safeParse(Member, await formOf(request));
		if (!parsed.success) return fail(400, { message: 'Pick a member to add.' });
		const { error: err } = await supabase
			.from('part_members')
			.insert({ part_id: params.id, user_id: parsed.output.user_id });
		if (err) {
			return err.code === '23505'
				? fail(400, { message: 'That member is already on the team.' })
				: dbFail(err);
		}
		return { message: 'Team member added' };
	},

	removeMember: async ({ request, params, locals: { supabase } }) => {
		const parsed = v.safeParse(Member, await formOf(request));
		if (!parsed.success) return fail(400, { message: 'That change was not valid.' });
		const { data, error: err } = await supabase
			.from('part_members')
			.delete()
			.eq('part_id', params.id)
			.eq('user_id', parsed.output.user_id)
			.select('user_id');
		if (err) return dbFail(err);
		if (!data?.length) return fail(403, { message: 'You cannot change this team.' });
		return { message: 'Team member removed' };
	},

	deletePart: async ({ params, locals: { supabase } }) => {
		const { data, error: err } = await supabase
			.from('parts')
			.delete()
			.eq('id', params.id)
			.select('id');
		if (err) return dbFail(err);
		if (!data?.length) return fail(403, { message: 'Only admins can delete a part.' });
		redirect(303, '/parts');
	}
};
