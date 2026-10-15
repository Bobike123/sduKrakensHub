<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Avatar from '#lib/components/Avatar.svelte';
	import DeptChip from '#lib/components/DeptChip.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { DEPTS, DEPT_LABEL, type Dept } from '#lib/config.js';
	import { daysUntil, firstName, fmtDate, relDays } from '#lib/format.js';

	let { data, form } = $props();

	const stats = (p: (typeof data.parts)[number]) => {
		const total = p.tasks.length;
		const done = p.tasks.filter((t) => t.status === 'done').length;
		return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
	};
</script>

<Toast result={form} />

<p class="page-intro">
	Every part goes through planning, work and feedback. Creating a part adds the 12 standard steps as
	tasks you can assign and date.
</p>

{#if data.me.is_admin}
	<details class="card">
		<summary><b>New part</b></summary>
		<form class="stack" method="POST" action="?/createPart" use:enhance style="margin-top:12px">
			<div class="row">
				<div class="field grow">
					<label class="lbl" for="np-name">Part</label>
					<input class="inp" id="np-name" name="name" maxlength="120" required />
				</div>
				<div class="field" style="width:180px">
					<label class="lbl" for="np-dept">Department</label>
					<select class="inp" id="np-dept" name="dept" value={data.me.dept}>
						{#each DEPTS as d (d)}<option value={d}>{DEPT_LABEL[d]}</option>{/each}
					</select>
				</div>
				<div class="field" style="width:170px">
					<label class="lbl" for="np-dl">Deadline</label>
					<input class="inp" id="np-dl" type="date" name="deadline" />
				</div>
			</div>
			<div class="row">
				<div class="field grow">
					<label class="lbl" for="np-lead">Lead</label>
					<select class="inp" id="np-lead" name="lead_id" required>
						<option value="">Choose…</option>
						{#each data.people as p (p.id)}<option value={p.id}>{p.full_name}</option>{/each}
					</select>
				</div>
				<div class="field grow">
					<label class="lbl" for="np-t1">Team member 1</label>
					<select class="inp" id="np-t1" name="team1">
						<option value="">None</option>
						{#each data.people as p (p.id)}<option value={p.id}>{p.full_name}</option>{/each}
					</select>
				</div>
				<div class="field grow">
					<label class="lbl" for="np-t2">Team member 2</label>
					<select class="inp" id="np-t2" name="team2">
						<option value="">None</option>
						{#each data.people as p (p.id)}<option value={p.id}>{p.full_name}</option>{/each}
					</select>
				</div>
			</div>
			<div class="field">
				<label class="lbl" for="np-ctx"
					>Context: why this part, how it relates to the big boat</label
				>
				<input class="inp" id="np-ctx" name="context" maxlength="2000" />
			</div>
			<div><button class="btn" type="submit"><Icon name="plus" />Create part</button></div>
		</form>
	</details>
{/if}

<div class="stack">
	{#each data.parts as part (part.id)}
		{@const s = stats(part)}
		{@const left = part.deadline ? daysUntil(part.deadline, data.today) : null}
		<article class="card part-card d-{part.dept}">
			<div class="row" style="justify-content:space-between;align-items:flex-start">
				<div class="stack" style="gap:4px;min-width:0">
					<div class="row">
						<DeptChip dept={part.dept as Dept} />
						{#if s.total > 0 && s.done === s.total}
							<span class="tag ok">Complete</span>
						{:else if part.deadline && left !== null}
							<span class="tag {left < 0 ? 'bad' : left <= 7 ? 'warn' : 'neutral'}">
								Due {fmtDate(part.deadline)} · {relDays(left)}
							</span>
						{/if}
					</div>
					<h3><a href={resolve('/(app)/parts/[id]', { id: part.id })}>{part.name}</a></h3>
					{#if part.context}<p class="muted">{part.context}</p>{/if}
				</div>
				{#if part.lead}
					<div class="row" style="gap:6px">
						<span class="small muted">Lead</span><Avatar profile={part.lead} sm />
						<span>{firstName(part.lead.full_name)}</span>
					</div>
				{/if}
			</div>
			<div>
				<div class="row" style="justify-content:space-between">
					<span class="eyebrow">Progress</span><span class="mono small">{s.done}/{s.total}</span>
				</div>
				<div class="progress" style="margin-top:6px"><i style="width:{s.pct}%"></i></div>
			</div>
		</article>
	{:else}
		<div class="empty">No parts yet.{data.me.is_admin ? ' Create the first one above.' : ''}</div>
	{/each}
</div>
