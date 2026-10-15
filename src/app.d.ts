import type { JwtPayload, Session, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '#lib/database.types.js';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient<Database>;
			/** `claims` are verified; `session` only carries the cookie's tokens. Authorise on `claims`. */
			safeGetSession: () => Promise<{ session: Session | null; claims: JwtPayload | null }>;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
