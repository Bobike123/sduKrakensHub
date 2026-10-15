<script lang="ts">
	import { resolve } from '$app/paths';
	import Avatar from '#lib/components/Avatar.svelte';
	import { firstName, fmtDate } from '#lib/format.js';

	let { data } = $props();

	const person = (id: string | null) => data.people.find((p) => p.id === id);
	const label = (status: string | null) =>
		status === 'done'
			? ['ok', 'Done']
			: status === 'failed'
				? ['bad', 'Failed']
				: ['info', 'In progress'];

	const done = $derived(data.log.filter((l) => l.status === 'done').length);
	const failed = $derived(data.log.filter((l) => l.status === 'failed').length);
	const active = $derived(data.log.length - done - failed);
</script>

<p class="page-intro">
	Who did what, built from the tasks people pick up. Nothing is typed twice: finishing a task with
	an outcome note writes its entry. It is a concrete record for your CV after Krakens and tells the
	next team who to ask about a part.
</p>

<div class="stats">
	<div class="stat">
		<span class="eyebrow">Done</span><b>{done}</b><small>finished tasks</small>
	</div>
	<div class="stat">
		<span class="eyebrow">In progress</span><b>{active}</b><small>being worked on</small>
	</div>
	<div class="stat">
		<span class="eyebrow">Failed</span><b>{failed}</b><small>did not work out</small>
	</div>
</div>

<form method="GET" class="row">
	<label class="lbl" for="lg-f" style="margin:0">Show</label>
	<select
		class="inp"
		id="lg-f"
		name="user"
		value={data.user}
		style="width:auto;min-width:220px"
		onchange={(e) => e.currentTarget.form?.requestSubmit()}
	>
		<option value="all">Everyone</option>
		{#each data.people as p (p.id)}<option value={p.id}>{p.full_name}</option>{/each}
	</select>
	<noscript><button class="btn sm" type="submit">Apply</button></noscript>
</form>

<div class="tbl-wrap">
	<table>
		<thead>
			<tr><th>Person</th><th>Task</th><th>Status</th><th>Outcome</th><th>Date</th></tr>
		</thead>
		<tbody>
			{#each data.log as entry (entry.id)}
				{@const who = person(entry.user_id)}
				{@const [cls, text] = label(entry.status)}
				<tr>
					<td>
						<div class="row" style="flex-wrap:nowrap">
							<Avatar profile={who} sm />{who ? firstName(who.full_name) : '—'}
						</div>
					</td>
					<td>
						{entry.task}
						{#if entry.part_id && data.partNames[entry.part_id]}
							<div class="small muted">
								<a href={resolve('/(app)/parts/[id]', { id: entry.part_id })}
									>{data.partNames[entry.part_id]}</a
								>
							</div>
						{/if}
					</td>
					<td><span class="tag {cls}">{text}</span></td>
					<td>{entry.outcome || '—'}</td>
					<td class="mono small">{entry.at ? fmtDate(entry.at) : '—'}</td>
				</tr>
			{:else}
				<tr><td colspan="5" class="muted">Nothing here yet. Start a task and it shows up.</td></tr>
			{/each}
		</tbody>
	</table>
</div>
