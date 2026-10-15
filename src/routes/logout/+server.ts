import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// POST only: a GET logout could be triggered by any <img src="/logout"> on another site.
export const POST: RequestHandler = async ({ locals: { supabase } }) => {
	await supabase.auth.signOut();
	redirect(303, '/login');
};
