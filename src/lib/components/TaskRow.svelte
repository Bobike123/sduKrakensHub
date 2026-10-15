<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Avatar from '#lib/components/Avatar.svelte';
	import DeptChip from '#lib/components/DeptChip.svelte';
	import { STATUSES, STATUS_LABEL, type Dept, type TaskStatus } from '#lib/config.js';
	import { daysUntil, firstName, fmtDate, relDays } from '#lib/format.js';

	type Person = { id: string; full_name: string; dept: string };
	type Task = {
		id: string;
		title: string;
		description: string;
		status: string;
		dept: string;
		due_date: string | null;
		blocked_reason: string | null;
		outcome: string;
		assignee_id: string | null;
		reviewer_id: string | null;
		part: { id: string; name: string } | null;
		assignee: Person | null;
		reviewer: { id: string; full_name: string } | null;
	};

	let {
		task,
		people,
		today,
		showPart = true,
		compact = false
	}: {
		task: Task;
		people: Person[];
		today: string;
		showPart?: boolean;
		compact?: boolean;
	} = $props();

	const status = $derived(task.status as TaskStatus);
	const closed = $derived(status === 'done' || status === 'failed');
	const left = $derived(task.due_date ? daysUntil(task.due_date, today) : null);
	const overdue = $derived(!closed && left !== null && left < 0);
	const dueTag = $derived(overdue ? 'bad' : left !== null && left <= 2 ? 'warn' : 'neutral');

	// "Blocked", "Done" and "Failed" ask for a note first; the other statuses save at once.
	let pending = $state<TaskStatus | null>(null);
	let statusForm = $state<HTMLFormElement>();
	let select = $state<HTMLSelectElement>();

	function pick(e: Event & { currentTarget: HTMLSelectElement }) {
		const value = e.currentTarget.value as TaskStatus;
		if (value === status) {
			pending = null;
		} else if (value === 'blocked' || value === 'done' || value === 'failed') {
			pending = value;
		} else {
			pending = null;
			statusForm?.requestSubmit();
		}
	}

	function cancel() {
		pending = null;
		if (select) select.value = task.status;
	}
</script>

<article class="task" class:overdue class:closed class:compact>
	<div class="task-top">
		<div class="grow" style="min-width:0">
			<h3>{task.title}</h3>
			<div class="meta">
				{#if showPart && task.part}
					<a href={resolve('/(app)/parts/[id]', { id: task.part.id })}>{task.part.name}</a>
				{/if}
				<DeptChip dept={task.dept as Dept} />
				{#if task.assignee}
					<span class="row" style="gap:6px"
						><Avatar profile={task.assignee} sm />{firstName(task.assignee.full_name)}</span
					>
				{:else}
					<span>Unassigned</span>
				{/if}
				{#if task.reviewer}<span>Reviewer: {firstName(task.reviewer.full_name)}</span>{/if}
				{#if task.due_date && left !== null && !closed}
					<span class="tag {dueTag}">Due {fmtDate(task.due_date)} · {relDays(left)}</span>
				{/if}
			</div>
		</div>

		<form
			class="status"
			method="POST"
			action="?/setStatus"
			bind:this={statusForm}
			use:enhance={() =>
				async ({ update }) => {
					await update();
					pending = null;
				}}
		>
			<input type="hidden" name="id" value={task.id} />
			<select
				class="inp"
				name="status"
				value={task.status}
				bind:this={select}
				onchange={pick}
				aria-label="Status of {task.title}"
			>
				{#each STATUSES as s (s)}<option value={s}>{STATUS_LABEL[s]}</option>{/each}
			</select>
			{#if pending === 'blocked'}
				<input
					class="inp sm"
					name="reason"
					placeholder="What is blocking it?"
					maxlength="300"
					required
				/>
			{:else if pending === 'done' || pending === 'failed'}
				<input class="inp sm" name="outcome" placeholder="Outcome (optional)" maxlength="1000" />
			{/if}
			{#if pending}
				<button class="btn sm" type="submit">Save</button>
				<button class="btn ghost sm" type="button" onclick={cancel}>Cancel</button>
			{/if}
		</form>
	</div>

	{#if status === 'blocked' && task.blocked_reason}
		<p class="blocked-note">Blocked: {task.blocked_reason}</p>
	{/if}
	{#if closed && task.outcome}<p class="muted">{task.outcome}</p>{/if}
	{#if !compact && task.description}<p class="muted">{task.description}</p>{/if}

	<details>
		<summary>Edit</summary>
		<form class="stack" method="POST" action="?/updateTask" use:enhance>
			<input type="hidden" name="id" value={task.id} />
			<div class="field">
				<label class="lbl" for="t-title-{task.id}">Title</label>
				<input
					class="inp"
					id="t-title-{task.id}"
					name="title"
					value={task.title}
					maxlength="160"
					required
				/>
			</div>
			<div class="edit-grid">
				<div class="field">
					<label class="lbl" for="t-asg-{task.id}">Assignee</label>
					<select
						class="inp"
						id="t-asg-{task.id}"
						name="assignee_id"
						value={task.assignee_id ?? ''}
					>
						<option value="">Unassigned</option>
						{#each people as p (p.id)}<option value={p.id}>{p.full_name}</option>{/each}
					</select>
				</div>
				<div class="field">
					<label class="lbl" for="t-rev-{task.id}">Reviewer</label>
					<select
						class="inp"
						id="t-rev-{task.id}"
						name="reviewer_id"
						value={task.reviewer_id ?? ''}
					>
						<option value="">None</option>
						{#each people as p (p.id)}<option value={p.id}>{p.full_name}</option>{/each}
					</select>
				</div>
				<div class="field">
					<label class="lbl" for="t-due-{task.id}">Due date</label>
					<input
						class="inp"
						id="t-due-{task.id}"
						type="date"
						name="due_date"
						value={task.due_date ?? ''}
					/>
				</div>
			</div>
			<div class="field">
				<label class="lbl" for="t-desc-{task.id}">Description</label>
				<textarea class="inp" id="t-desc-{task.id}" name="description" maxlength="4000"
					>{task.description}</textarea
				>
			</div>
			<div><button class="btn sm" type="submit">Save changes</button></div>
		</form>
		<form
			method="POST"
			action="?/deleteTask"
			style="margin-top:8px"
			use:enhance
			onsubmit={(e) => {
				if (!confirm(`Delete "${task.title}"?`)) e.preventDefault();
			}}
		>
			<input type="hidden" name="id" value={task.id} />
			<button class="btn ghost sm" type="submit">Delete task</button>
		</form>
	</details>
</article>
