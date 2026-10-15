import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data } = await supabase
		.from('notifications')
		.select(
			`id, kind, created_at, read_at,
			task:tasks(id, title, part_id),
			part:parts(id, name),
			actor:profiles!notifications_actor_id_fkey(full_name)`
		)
		.order('created_at', { ascending: false })
		.limit(50);
	return { notifications: data ?? [] };
};

export const actions: Actions = {
	markAllRead: async ({ locals: { supabase } }) => {
		const { error } = await supabase
			.from('notifications')
			.update({ read_at: new Date().toISOString() })
			.is('read_at', null);
		if (error) return { message: 'Could not mark them read.' };
		return { message: 'All marked as read' };
	}
};
