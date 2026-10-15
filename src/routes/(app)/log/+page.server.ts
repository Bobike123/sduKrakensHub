import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase }, url }) => {
	const user = url.searchParams.get('user') ?? 'all';

	// A view has no foreign keys to embed, so people and parts come separately.
	let query = supabase
		.from('contribution_log')
		.select('id, user_id, task, status, outcome, part_id, at')
		.order('at', { ascending: false })
		.limit(500);
	if (user !== 'all') query = query.eq('user_id', user);

	const [log, people, parts] = await Promise.all([
		query,
		supabase.from('profiles').select('id, full_name, dept').order('full_name'),
		supabase.from('parts').select('id, name')
	]);

	return {
		log: log.data ?? [],
		people: people.data ?? [],
		partNames: Object.fromEntries((parts.data ?? []).map((p) => [p.id, p.name])),
		user
	};
};
