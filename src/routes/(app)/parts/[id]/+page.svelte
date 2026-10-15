<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Avatar from '#lib/components/Avatar.svelte';
	import DeptChip from '#lib/components/DeptChip.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import TaskRow from '#lib/components/TaskRow.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { PHASES, PHASE_LABEL, type Dept } from '#lib/config.js';
	import { daysUntil, firstName, fmtDate, relDays } from '#lib/format.js';

	let { data, form } = $props();

	const order = (t: (typeof data.tasks)[number]) => t.step?.position ?? 1000;
	const byStep = (a: (typeof data.tasks)[number], b: (typeof data.tasks)[number]) =>
		order(a) - order(b) || a.created_at.localeCompare(b.created_at);

	const sections = $derived([
		...PHASES.map((p) => ({
			title: PHASE_LABEL[p],
			tasks: data.tasks.filter((t) => t.phase === p).sort(byStep)
		})),
		{ title: 'Other tasks', tasks: data.tasks.filter((t) => !t.phase).sort(byStep) }
	]);
	const total = $derived(data.tasks.length);
	const done = $derived(data.tasks.filter((t) => t.status === 'done').length);
	const pct = $derived(total ? Math.round((done / total) * 100) : 0);
	const left = $derived(data.part.deadline ? daysUntil(data.part.deadline, data.today) : null);
	const teamIds = $derived(new Set(data.part.members.map((m) => m.user_id)));
</script>

<Toast result={form} />

<p class="small"><a href={resolve('/(app)/parts')}>← All parts</a></p>

<section class="card stack d-{data.part.dept}">
	<div class="row" style="justify-content:space-between;align-items:flex-start">
		<div class="stack" style="gap:6px;min-width:0">
			<div class="row">
				<DeptChip dept={data.part.dept as Dept} />
				{#if total > 0 && done === total}
					<span class="tag ok">Complete</span>
				{:else if data.part.deadline && left !== null}
					<span class="tag {left < 0 ? 'bad' : left <= 7 ? 'warn' : 'neutral'}">
						Due {fmtDate(data.part.deadline)} · {relDays(left)}
					</span>
				{/if}
			</div>
			<h2 style="font-size:28px">{data.part.name}</h2>
			{#if data.part.context}<p class="muted">{data.part.context}</p>{/if}
		</div>
		<div class="stack" style="gap:6px;align-items:flex-end">
			{#if data.part.lead}
				<div class="row" style="gap:6px">
					<span class="small muted">Lead</span><Avatar profile={data.part.lead} sm />
					<span>{firstName(data.part.lead.full_name)}</span>
				</div>
			{/if}
			<div class="row" style="gap:6px">
				<span class="small muted">Team</span>
				{#each data.part.members as m (m.user_id)}<Avatar profile={m.profile} sm />{/each}
				{#if data.part.members.length === 0}<span class="small muted">no one yet</span>{:else}
					<span
						>{data.part.members
							.map((m) => (m.profile ? firstName(m.profile.full_name) : ''))
							.join(' & ')}</span
					>
				{/if}
			</div>
		</div>
	</div>
	<div>
		<div class="row" style="justify-content:space-between">
			<span class="eyebrow">Progress</span><span class="mono small">{done}/{total}</span>
		</div>
		<div class="progress" style="margin-top:6px"><i style="width:{pct}%"></i></div>
	</div>
</section>

{#each sections as section (section.title)}
	{#if section.tasks.length}
		<div class="section-head">
			<h2>{section.title}</h2>
			<span class="small muted mono">
				{section.tasks.filter((t) => t.status === 'done').length}/{section.tasks.length}
			</span>
		</div>
		<div class="stack">
			{#each section.tasks as task (task.id)}
				<TaskRow {task} people={data.people} today={data.today} showPart={false} />
			{/each}
		</div>
	{/if}
{/each}

<details class="card">
	<summary><b>Add a task to this part</b></summary>
	<form class="stack" method="POST" action="?/createTask" use:enhance style="margin-top:12px">
		<input type="hidden" name="part_id" value={data.part.id} />
		<input type="hidden" name="dept" value={data.part.dept} />
		<div class="row">
			<div class="field grow">
				<label class="lbl" for="pt-title">Title</label>
				<input class="inp" id="pt-title" name="title" maxlength="160" required />
			</div>
			<div class="field" style="width:200px">
				<label class="lbl" for="pt-asg">Assignee</label>
				<select class="inp" id="pt-asg" name="assignee_id">
					<option value="">Unassigned</option>
					{#each data.people as p (p.id)}<option value={p.id}>{p.full_name}</option>{/each}
				</select>
			</div>
			<div class="field" style="width:170px">
				<label class="lbl" for="pt-due">Due date</label>
				<input class="inp" id="pt-due" type="date" name="due_date" />
			</div>
		</div>
		<div><button class="btn" type="submit"><Icon name="plus" />Add task</button></div>
	</form>
</details>

{#if data.canManage}
	<details class="card">
		<summary><b>Part settings and team</b></summary>
		<div class="stack" style="margin-top:12px">
			<form
				class="stack"
				method="POST"
				action="?/updatePart"
				use:enhance={() =>
					async ({ update }) =>
						update({ reset: false })}
			>
				<div class="row">
					<div class="field grow">
						<label class="lbl" for="ps-name">Name</label>
						<input
							class="inp"
							id="ps-name"
							name="name"
							value={data.part.name}
							maxlength="120"
							required
						/>
					</div>
					<div class="field" style="width:220px">
						<label class="lbl" for="ps-lead">Lead</label>
						<select class="inp" id="ps-lead" name="lead_id" value={data.part.lead_id}>
							{#each data.people as p (p.id)}<option value={p.id}>{p.full_name}</option>{/each}
						</select>
					</div>
					<div class="field" style="width:170px">
						<label class="lbl" for="ps-dl">Deadline</label>
						<input
							class="inp"
							id="ps-dl"
							type="date"
							name="deadline"
							value={data.part.deadline ?? ''}
						/>
					</div>
				</div>
				<div class="field">
					<label class="lbl" for="ps-ctx">Context</label>
					<input
						class="inp"
						id="ps-ctx"
						name="context"
						value={data.part.context}
						maxlength="2000"
					/>
				</div>
				<div><button class="btn sm" type="submit">Save part</button></div>
			</form>

			<div class="stack">
				<span class="eyebrow">Team (at most 2)</span>
				{#each data.part.members as m (m.user_id)}
					<form class="inline-form" method="POST" action="?/removeMember" use:enhance>
						<input type="hidden" name="user_id" value={m.user_id} />
						<span class="row" style="gap:6px"
							><Avatar profile={m.profile} sm />{m.profile?.full_name}</span
						>
						<button class="btn ghost sm" type="submit">Remove</button>
					</form>
				{/each}
				{#if data.part.members.length < 2}
					<form class="inline-form" method="POST" action="?/addMember" use:enhance>
						<div class="field" style="width:240px">
							<label class="lbl" for="ps-add">Add a member</label>
							<select class="inp" id="ps-add" name="user_id" required>
								<option value="">Choose…</option>
								{#each data.people.filter((p) => !teamIds.has(p.id)) as p (p.id)}
									<option value={p.id}>{p.full_name}</option>
								{/each}
							</select>
						</div>
						<button class="btn sm" type="submit">Add</button>
					</form>
				{/if}
			</div>

			{#if data.me.is_admin}
				<form
					method="POST"
					action="?/deletePart"
					onsubmit={(e) => {
						if (!confirm(`Delete "${data.part.name}" and all its tasks?`)) e.preventDefault();
					}}
				>
					<button class="btn ghost sm" type="submit">Delete this part</button>
				</form>
			{/if}
		</div>
	</details>
{/if}
