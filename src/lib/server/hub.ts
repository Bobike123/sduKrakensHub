import { error, fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { todayISO } from '#lib/format.js';
import { formOf } from './tasks.js';

/** A required, trimmed text field. */
export const required = (max: number, message: string) =>
	v.pipe(v.string(), v.trim(), v.minLength(1, message), v.maxLength(max, 'That is too long.'));

/** An ISO date that is today or later (team timezone). */
export const futureDate = (message: string) =>
	v.pipe(
		v.string(),
		v.isoDate('Pick a date.'),
		v.check((d) => d >= todayISO(), message)
	);

export const IdForm = v.object({ id: v.pipe(v.string(), v.uuid()) });

/**
 * Validates a submitted form. On failure `issue` is the 400 response to return,
 * carrying the first message for the page's toast.
 */
export async function parse<const S extends v.GenericSchema>(request: Request, schema: S) {
	const result = v.safeParse(schema, await formOf(request));
	if (result.success) return { data: result.output as v.InferOutput<S>, issue: null };
	return {
		data: null,
		issue: fail(400, { message: result.issues[0]?.message ?? 'Please check the form.' })
	};
}

/** The signed-in member's id. The (app) layout has already checked there is one. */
export async function myId(locals: App.Locals): Promise<string> {
	const { claims } = await locals.safeGetSession();
	if (!claims) error(401, 'You are not signed in.');
	return claims.sub;
}
