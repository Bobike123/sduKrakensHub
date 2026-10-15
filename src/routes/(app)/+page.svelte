<script lang="ts">
	import { resolve } from '$app/paths';
	import TaskRow from '#lib/components/TaskRow.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { daysUntil } from '#lib/format.js';

	let { data, form } = $props();

	const overdue = $derived(
		data.mine.filter((t) => t.due_date && daysUntil(t.due_date, data.today) < 0)
	);
	const thisWeek = $derived(
		data.mine.filter(
			(t) => t.due_date && ((d) => d >= 0 && d <= 7)(daysUntil(t.due_date, data.today))
		)
	);
	const later = $derived(
		data.mine.filter((t) => !t.due_date || daysUntil(t.due_date, data.today) > 7)
	);
	const groups = $derived([
		{ title: 'Overdue', tasks: overdue },
		{ title: 'Due this week', tasks: thisWeek },
		{ title: 'Later or no date', tasks: later }
	]);
	const blocked = $derived(data.mine.filter((t) => t.status === 'blocked').length);
</script>

<Toast result={form} />

<div class="stats">
	<div class="stat">
		<span class="eyebrow">Open tasks</span><b>{data.mine.length}</b><small>assigned to you</small>
	</div>
	<div class="stat" class:hot={overdue.length > 0}>
		<span class="eyebrow">Overdue</span><b>{overdue.length}</b><small>past their due date</small>
	</div>
	<div class="stat">
		<span class="eyebrow">Due this week</span><b>{thisWeek.length}</b><small
			>in the next 7 days</small
		>
	</div>
	<div class="stat" class:hot={data.review.length > 0}>
		<span class="eyebrow">To review</span><b>{data.review.length}</b><small>waiting for you</small>
	</div>
</div>

{#if data.review.length}
	<div class="section-head"><h2>Waiting for your review</h2></div>
	<div class="stack">
		{#each data.review as task (task.id)}
			<TaskRow {task} people={data.people} today={data.today} />
		{/each}
	</div>
{/if}

{#if data.mine.length === 0}
	<div class="empty">
		Nothing is assigned to you right now. Pick something up from the
		<a href={resolve('/(app)/board')}>Board</a> or a <a href={resolve('/(app)/parts')}>part</a>.
	</div>
{:else}
	{#each groups as group (group.title)}
		{#if group.tasks.length}
			<div class="section-head">
				<h2>{group.title}</h2>
				<span class="small muted"
					>{group.tasks.length} task{group.tasks.length === 1 ? '' : 's'}</span
				>
			</div>
			<div class="stack">
				{#each group.tasks as task (task.id)}
					<TaskRow {task} people={data.people} today={data.today} />
				{/each}
			</div>
		{/if}
	{/each}
	{#if blocked}
		<p class="small muted">
			{blocked} of your tasks {blocked === 1 ? 'is' : 'are'} blocked. Say what is in the way so the part
			lead can help.
		</p>
	{/if}
{/if}
