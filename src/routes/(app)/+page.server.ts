import { taskActions, TASK_SELECT } from '#lib/server/tasks.js';
import { todayISO } from '#lib/format.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase }, parent }) => {
	const { me } = await parent();

	const [mine, review, people] = await Promise.all([
		supabase
			.from('tasks')
			.select(TASK_SELECT)
			.eq('assignee_id', me.id)
			.not('status', 'in', '(done,failed)')
			.order('due_date', { ascending: true, nullsFirst: false })
			.order('created_at', { ascending: true }),
		supabase
			.from('tasks')
			.select(TASK_SELECT)
			.eq('reviewer_id', me.id)
			.eq('status', 'review')
			.order('updated_at', { ascending: true }),
		supabase.from('profiles').select('id, full_name, dept').eq('is_active', true).order('full_name')
	]);

	return {
		mine: mine.data ?? [],
		review: review.data ?? [],
		people: people.data ?? [],
		today: todayISO()
	};
};

export const actions: Actions = { ...taskActions };
