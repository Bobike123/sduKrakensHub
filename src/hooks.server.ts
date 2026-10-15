import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit/hooks';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$app/env/public';
import type { Database } from '#lib/database.types.js';

export const handle: Handle = async ({ event, resolve }) => {
	// One client per request, so a session can never leak between users.
	event.locals.supabase = createServerClient<Database>(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_PUBLISHABLE_KEY,
		{
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookies) => {
					for (const { name, value, options } of cookies) {
						// HttpOnly: the browser never needs the tokens, only the server does.
						event.cookies.set(name, value, {
							...options,
							path: '/',
							httpOnly: true,
							secure: event.url.protocol === 'https:'
						});
					}
				}
			}
		}
	);

	// getSession() only reads the cookie, which anyone can forge. getClaims()
	// verifies the token, so authorise on `claims`, never on `session.user`.
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) return { session: null, claims: null };

		const { data, error } = await event.locals.supabase.auth.getClaims();
		if (error || !data) return { session: null, claims: null };
		return { session, claims: data.claims };
	};

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};
