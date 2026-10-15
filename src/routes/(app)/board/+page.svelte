<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import TaskRow from '#lib/components/TaskRow.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { DEPTS, DEPT_LABEL, STATUS_LABEL, type Dept } from '#lib/config.js';

	let { data, form } = $props();

	const columns = $derived([
		{ title: STATUS_LABEL.todo, tasks: data.tasks.filter((t) => t.status === 'todo') },
		{ title: STATUS_LABEL.doing, tasks: data.tasks.filter((t) => t.status === 'doing') },
		{ title: STATUS_LABEL.blocked, tasks: data.tasks.filter((t) => t.status === 'blocked') },
		{ title: STATUS_LABEL.review, tasks: data.tasks.filter((t) => t.status === 'review') },
		{
			title: `Closed (last ${data.recentDays} days)`,
			tasks: data.tasks.filter((t) => t.status === 'done' || t.status === 'failed')
		}
	]);
	const newDept = $derived((data.dept === 'all' ? data.me.dept : data.dept) as Dept);
</script>

<Toast result={form} />

<div class="section-head">
	<div class="pills" role="group" aria-label="Department">
		{#each ['all', ...DEPTS] as d (d)}
			<a
				class="pill"
				class:active={data.dept === d}
				href={resolve(`/(app)/board?dept=${d}${data.onlyMine ? '&mine=1' : ''}`)}
			>
				{d === 'all' ? 'All departments' : DEPT_LABEL[d as Dept]}
			</a>
		{/each}
	</div>
	<div class="pills" role="group" aria-label="Filter">
		<a class="pill" class:active={!data.onlyMine} href={resolve(`/(app)/board?dept=${data.dept}`)}
			>Everyone</a
		>
		<a
			class="pill"
			class:active={data.onlyMine}
			href={resolve(`/(app)/board?dept=${data.dept}&mine=1`)}>Only mine</a
		>
	</div>
</div>

<details class="card">
	<summary><b>Add a task</b></summary>
	<form class="stack" method="POST" action="?/createTask" use:enhance style="margin-top:12px">
		<div class="row">
			<div class="field grow">
				<label class="lbl" for="nt-title">Title</label>
				<input class="inp" id="nt-title" name="title" maxlength="160" required />
			</div>
			<div class="field" style="width:180px">
				<label class="lbl" for="nt-dept">Department</label>
				<select class="inp" id="nt-dept" name="dept" value={newDept}>
					{#each DEPTS as d (d)}<option value={d}>{DEPT_LABEL[d]}</option>{/each}
				</select>
			</div>
			<div class="field" style="width:200px">
				<label class="lbl" for="nt-asg">Assignee</label>
				<select class="inp" id="nt-asg" name="assignee_id">
					<option value="">Unassigned</option>
					{#each data.people as p (p.id)}<option value={p.id}>{p.full_name}</option>{/each}
				</select>
			</div>
			<div class="field" style="width:170px">
				<label class="lbl" for="nt-due">Due date</label>
				<input class="inp" id="nt-due" type="date" name="due_date" />
			</div>
		</div>
		<div><button class="btn" type="submit"><Icon name="plus" />Add task</button></div>
	</form>
</details>

<div class="board">
	{#each columns as col (col.title)}
		<section class="board-col" aria-label={col.title}>
			<header>
				<h3>{col.title}</h3>
				<span class="count">{col.tasks.length}</span>
			</header>
			{#each col.tasks as task (task.id)}
				<TaskRow {task} people={data.people} today={data.today} compact />
			{:else}
				<div class="empty">Nothing here.</div>
			{/each}
		</section>
	{/each}
</div>
