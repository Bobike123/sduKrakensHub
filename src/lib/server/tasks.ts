import { fail, type RequestEvent } from '@sveltejs/kit';
import * as v from 'valibot';
import { DEPTS, STATUSES, STATUS_LABEL } from '#lib/config.js';

/** Everything a task list needs, including the part and the people it points at. */
export const TASK_SELECT = `
	id, title, description, status, dept, due_date, blocked_reason, outcome,
	part_id, assignee_id, reviewer_id, created_by, completed_at, updated_at,
	part:parts(id, name),
	assignee:profiles!tasks_assignee_id_fkey(id, full_name, dept),
	reviewer:profiles!tasks_reviewer_id_fkey(id, full_name, dept)
`;

export const formOf = async (request: Request) => Object.fromEntries(await request.formData());

/** Turns a Postgres/PostgREST error into a response the page can show as a toast. */
export const dbFail = (error: { code?: string; message: string }) =>
	fail(error.code === '42501' ? 403 : 400, {
		message: /row-level security|permission denied/i.test(error.message)
			? 'You do not have permission to do that.'
			: error.message
	});

const uuid = v.pipe(v.string(), v.uuid());
const blankToNull = (s: string) => (s.trim() === '' ? null : s.trim());
/** An empty form field arrives as "". That means "no value". */
export const optionalUuid = v.pipe(
	v.optional(v.string(), ''),
	v.transform(blankToNull),
	v.nullable(uuid)
);
export const optionalDate = v.pipe(
	v.optional(v.string(), ''),
	v.transform(blankToNull),
	v.nullable(v.pipe(v.string(), v.isoDate()))
);
export const text = (max: number) => v.pipe(v.string(), v.trim(), v.maxLength(max));
const title = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, 'Give the task a title.'),
	v.maxLength(160, 'That title is too long.')
);

const SetStatus = v.object({
	id: uuid,
	status: v.picklist(STATUSES),
	reason: v.optional(text(300), ''),
	outcome: v.optional(text(1000))
});

const CreateTask = v.object({
	title,
	description: v.optional(text(4000), ''),
	dept: v.picklist(DEPTS),
	part_id: optionalUuid,
	assignee_id: optionalUuid,
	reviewer_id: optionalUuid,
	due_date: optionalDate
});

const UpdateTask = v.object({
	id: uuid,
	title,
	description: v.optional(text(4000), ''),
	assignee_id: optionalUuid,
	reviewer_id: optionalUuid,
	due_date: optionalDate
});

const DeleteTask = v.object({ id: uuid });

/**
 * Form actions shared by every page that shows tasks: spread them into the
 * page's `actions`. RLS and the database triggers are the real gatekeepers;
 * these only validate input and translate errors.
 */
export const taskActions = {
	setStatus: async ({ request, locals: { supabase } }: RequestEvent) => {
		const parsed = v.safeParse(SetStatus, await formOf(request));
		if (!parsed.success) return fail(400, { message: 'That change was not valid.' });
		const { id, status, reason, outcome } = parsed.output;
		if (status === 'blocked' && !reason) {
			return fail(400, { message: 'Say what is blocking this task.' });
		}

		const { data, error } = await supabase
			.from('tasks')
			.update({
				status,
				blocked_reason: status === 'blocked' ? reason : null,
				...(outcome !== undefined ? { outcome } : {})
			})
			.eq('id', id)
			.select('id');
		if (error) return dbFail(error);
		// RLS hides rows you may not touch; an update that matched nothing means "not yours".
		if (!data?.length) return fail(403, { message: 'You cannot change this task.' });
		return { message: `Marked ${STATUS_LABEL[status].toLowerCase()}` };
	},

	createTask: async ({ request, locals: { supabase } }: RequestEvent) => {
		const parsed = v.safeParse(CreateTask, await formOf(request));
		if (!parsed.success) {
			return fail(400, { message: parsed.issues[0]?.message ?? 'Please check the form.' });
		}
		const { error } = await supabase.from('tasks').insert(parsed.output);
		if (error) return dbFail(error);
		return { message: 'Task added' };
	},

	updateTask: async ({ request, locals: { supabase } }: RequestEvent) => {
		const parsed = v.safeParse(UpdateTask, await formOf(request));
		if (!parsed.success) {
			return fail(400, { message: parsed.issues[0]?.message ?? 'Please check the form.' });
		}
		const { id, ...changes } = parsed.output;
		const { data, error } = await supabase.from('tasks').update(changes).eq('id', id).select('id');
		if (error) return dbFail(error);
		if (!data?.length) return fail(403, { message: 'You cannot change this task.' });
		return { message: 'Task saved' };
	},

	deleteTask: async ({ request, locals: { supabase } }: RequestEvent) => {
		const parsed = v.safeParse(DeleteTask, await formOf(request));
		if (!parsed.success) return fail(400, { message: 'That change was not valid.' });
		const { data, error } = await supabase
			.from('tasks')
			.delete()
			.eq('id', parsed.output.id)
			.select('id');
		if (error) return dbFail(error);
		if (!data?.length) return fail(403, { message: 'You cannot delete this task.' });
		return { message: 'Task deleted' };
	}
};
