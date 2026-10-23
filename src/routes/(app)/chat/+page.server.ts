import * as v from 'valibot';
import { DEPTS, type Dept } from '#lib/config.js';
import { parse, required } from '#lib/server/hub.js';
import { dbFail } from '#lib/server/tasks.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase }, url, parent, depends }) => {
	depends('app:chat');
	const { me } = await parent();
	// Members always see their own department; admins can switch with ?d=.
	const asked = url.searchParams.get('d') ?? '';
	const dept: Dept =
		me.is_admin && (DEPTS as readonly string[]).includes(asked)
			? (asked as Dept)
			: (me.dept as Dept);

	const [messages, members] = await Promise.all([
		supabase
			.from('chat_messages')
			.select(
				'id, body, created_at, user_id, author:profiles!chat_messages_user_id_fkey(id, full_name, dept)'
			)
			.eq('dept', dept)
			.order('created_at', { ascending: false })
			.limit(200),
		supabase
			.from('profiles')
			.select('id', { count: 'exact', head: true })
			.eq('dept', dept)
			.eq('is_active', true)
	]);
	return { dept, messages: (messages.data ?? []).reverse(), memberCount: members.count ?? 0 };
};

const Send = v.object({
	dept: v.picklist(DEPTS),
	body: required(2000, 'Write a message.')
});

export const actions: Actions = {
	send: async ({ request, locals: { supabase } }) => {
		const { data, issue } = await parse(request, Send);
		if (issue) return issue;
		const { error } = await supabase.from('chat_messages').insert(data);
		if (error) return dbFail(error);
		return {};
	}
};
