<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Toast from '#lib/components/Toast.svelte';
	import { DEPT_LABEL, type Dept } from '#lib/config.js';
	import { fmtDate, fmtWhen } from '#lib/format.js';

	let { data, form } = $props();

	type Row = (typeof data.notifications)[number];
	const who = (n: Row) => n.actor?.full_name?.split(' ')[0] ?? 'Someone';
	const text = (n: Row): string => {
		const title = n.task?.title ?? 'a task';
		switch (n.kind) {
			case 'task_assigned':
				return `${who(n)} assigned you “${title}”`;
			case 'review_requested':
				return `${who(n)} asked you to review “${title}”`;
			case 'task_blocked':
				return `“${title}” is blocked`;
			case 'part_assigned':
				return `${who(n)} added you to the part “${n.part?.name ?? 'a part'}”`;
			case 'meeting_requested':
				return `${who(n)} asked ${n.meeting ? DEPT_LABEL[n.meeting.dept as Dept] : 'your department'} for a meeting: “${n.meeting?.topic ?? 'a meeting'}”${n.meeting ? ` on ${fmtDate(n.meeting.meet_on)}` : ''}`;
			case 'assembly_proposed':
				return `${who(n)} proposed a general assembly${n.assembly ? ` on ${fmtDate(n.assembly.held_on)}` : ''}. Your approval is needed.`;
			default:
				return 'Update';
		}
	};
	const partOf = (n: Row) => n.part?.id ?? n.task?.part_id ?? null;
	const linkOf = (n: Row) => {
		if (n.kind === 'meeting_requested') return resolve('/(app)/meetings');
		if (n.kind === 'assembly_proposed') return resolve('/(app)/assembly');
		const part = partOf(n);
		return part ? resolve('/(app)/parts/[id]', { id: part }) : resolve('/(app)');
	};
	const unread = $derived(data.notifications.filter((n) => !n.read_at).length);
</script>

<Toast result={form} />

<div class="section-head">
	<h2>Latest</h2>
	{#if unread}
		<form method="POST" action="?/markAllRead" use:enhance>
			<button class="btn ghost sm" type="submit">Mark all as read</button>
		</form>
	{/if}
</div>

<div class="stack">
	{#each data.notifications as n (n.id)}
		<a
			class="card notif"
			class:unread={!n.read_at}
			href={linkOf(n)}
			style="text-decoration:none;color:inherit"
		>
			<div class="row" style="justify-content:space-between">
				<span>{text(n)}</span>
				{#if !n.read_at}<span class="tag urgent">New</span>{/if}
			</div>
			<span class="small muted">{fmtWhen(n.created_at)}</span>
		</a>
	{:else}
		<div class="empty">
			No notifications yet. You hear about new assignments, review requests, blocked tasks and
			meeting requests here.
		</div>
	{/each}
</div>
