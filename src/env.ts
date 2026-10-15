import { defineEnvVars } from '@sveltejs/kit/env';

/** A required value: the app refuses to start with a clear message instead of failing later. */
const required = (name: string) => (value: string | undefined) => {
	if (!value)
		throw new Error(`${name} is not set. Copy .env.example to .env.local and fill it in.`);
	return value;
};

// Public variables are safe in the browser (RLS protects the data). Everything else is
// server-only: import it from '$app/env/private', never from client code.
export const variables = defineEnvVars({
	PUBLIC_SUPABASE_URL: {
		public: true,
		description: 'Supabase project URL',
		schema: required('PUBLIC_SUPABASE_URL')
	},
	PUBLIC_SUPABASE_PUBLISHABLE_KEY: {
		public: true,
		description: 'Supabase publishable key (formerly the anon key)',
		schema: required('PUBLIC_SUPABASE_PUBLISHABLE_KEY')
	},
	SUPABASE_SECRET_KEY: {
		description:
			'Supabase secret key. Server only; used for member management (create, reset, deactivate).',
		// Optional so the app runs without it; admin actions then explain what is missing.
		schema: (value: string | undefined) => value || undefined
	}
});
