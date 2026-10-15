import { DEPTS, type Dept } from '#lib/config.js';
import { todayISO } from '#lib/format.js';
import { taskActions, TASK_SELECT } from '#lib/server/tasks.js';
import type { Actions, PageServerLoad } from './$types';

const RECENT_DAYS = 14;

export const load: PageServerLoad = async ({ locals: { supabase }, parent, url }) => {
	const { me } = await parent();

	const requested = url.searchParams.get('dept');
	const dept: Dept | 'all' =
		requested === 'all' ? 'all' : DEPTS.includes(requested as Dept) ? (requested as Dept) : me.dept;
	const onlyMine = url.searchParams.get('mine') === '1';

	// Everything still open, plus whatever was finished recently.
	const since = new Date(Date.now() - RECENT_DAYS * 864e5).toISOString();
	let query = supabase
		.from('tasks')
		.select(TASK_SELECT)
		.or(`status.not.in.(done,failed),completed_at.gte.${since}`)
		.order('due_date', { ascending: true, nullsFirst: false })
		.order('created_at', { ascending: true })
		.limit(400);
	if (dept !== 'all') query = query.eq('dept', dept);
	if (onlyMine) query = query.eq('assignee_id', me.id);

	const [tasks, people] = await Promise.all([
		query,
		supabase.from('profiles').select('id, full_name, dept').eq('is_active', true).order('full_name')
	]);

	return {
		tasks: tasks.data ?? [],
		people: people.data ?? [],
		dept,
		onlyMine,
		today: todayISO(),
		recentDays: RECENT_DAYS
	};
};

export const actions: Actions = { ...taskActions };
