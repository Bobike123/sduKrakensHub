import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// Guards everything under (app): signed in, still an active member, and past the
// forced first-login password change.
export const load: LayoutServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { claims } = await safeGetSession();
	if (!claims) redirect(303, '/login');

	// A deactivated member cannot read their own profile (RLS), so "no row"
	// means "not an active member".
	const { data: me } = await supabase
		.from('profiles')
		.select('id, username, full_name, dept, role_title, is_admin, must_change_password')
		.eq('id', claims.sub)
		.maybeSingle();
	if (!me) {
		await supabase.auth.signOut();
		redirect(303, '/login');
	}
	if (me.must_change_password) redirect(303, '/set-password');

	const { count } = await supabase
		.from('notifications')
		.select('id', { count: 'exact', head: true })
		.is('read_at', null);

	return { me, unread: count ?? 0 };
};
