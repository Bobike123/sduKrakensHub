<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import DeptChip from '#lib/components/DeptChip.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import type { Dept } from '#lib/config.js';
	import {
		DM_LABEL,
		LIFECYCLE,
		ONBOARD_ITEMS,
		OPENING_LABEL,
		OPENING_TAG,
		type DmChannel
	} from '#lib/hub.js';

	let { data, form } = $props();

	const tabs = [
		['roles', 'Roles & lifecycle'],
		['hiring', 'Hiring'],
		['onboarding', 'Onboarding'],
		['workshop', 'Workshop rules'],
		['comms', 'Communications']
	] as const;
	const sem = $derived(data.mySemester ?? 0);
	const doneCount = $derived(ONBOARD_ITEMS.filter((i) => data.done.includes(i.id)).length);
	const channelsSet = $derived(data.people.filter((p) => p.details?.dm_channel).length);
	const myChannel = $derived(data.people.find((p) => p.id === data.me.id)?.details?.dm_channel);
	const comms = [
		['GA update report', 'Poll about an upcoming event'],
		['Versioning, approval and submitting', 'DMs to people'],
		['Finance report', 'Quick updates'],
		['GA scheduled', 'GA schedule'],
		['Ordering a part and its status', 'Who picks up the part']
	];
</script>

<Toast result={form} />

<p class="page-intro">
	How the team is organised: roles, how we hire and onboard, workshop rules and which channel to use
	for what. Based on the organisation proposal from Juraj and Fynn (7 Oct 2026).
</p>

<form method="GET" class="tabs" aria-label="Handbook sections">
	{#each tabs as [key, label] (key)}
		<button
			class="tab"
			class:active={data.tab === key}
			aria-current={data.tab === key ? 'page' : undefined}
			name="tab"
			value={key}>{label}</button
		>
	{/each}
</form>

{#if data.tab === 'roles'}
	<div class="grid g3">
		<div class="card stack">
			<span class="eyebrow">3rd semester +</span>
			<h3>Head of department</h3>
			<p>
				Calls meetings, talks to the other departments, makes decisions for the final boat and runs
				the hiring process.
			</p>
		</div>
		<div class="card stack">
			<span class="eyebrow">1st semester</span>
			<h3>Club member</h3>
			<p>Works on a small project (RC boat) and learns from the internal material.</p>
		</div>
		<div class="card stack">
			<span class="eyebrow">3rd semester</span>
			<h3>Club member</h3>
			<p>Works on the large boat, supervises 1st semester work and prepares internal documents.</p>
		</div>
	</div>
	<div class="section-head">
		<h2>Lifecycle</h2>
		{#if sem >= 1 && sem <= 6}
			<span class="small muted">Your semester ({sem}) is highlighted</span>
		{:else}
			<span class="small muted"
				>Set your semester in <a href={resolve('/(app)/profile')}>My profile</a> to highlight your column</span
			>
		{/if}
	</div>
	<div class="tbl-wrap">
		<table class="lifecycle">
			<thead>
				<tr>
					<th>Role</th>
					{#each [1, 2, 3, 4, 5, 6] as n (n)}<th class:cur={n === sem}>Semester {n}</th>{/each}
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Club member</td>
					{#each LIFECYCLE.member as cell, i (i)}<td class:cur={i + 1 === sem}>{cell}</td>{/each}
				</tr>
				<tr>
					<td>Dept head</td>
					{#each LIFECYCLE.head as cell, i (i)}<td class:cur={i + 1 === sem}>{cell || '–'}</td
						>{/each}
				</tr>
			</tbody>
		</table>
	</div>
{:else if data.tab === 'hiring'}
	<div class="section-head">
		<h2>Every semester</h2>
		<span class="small muted">Three months from posting to a fully onboarded hire</span>
	</div>
	<div class="steps">
		<div class="step">
			<span class="n">1</span>
			<h3>Post · 1 month</h3>
			<p>The opening is advertised for one month.</p>
		</div>
		<div class="step">
			<span class="n">2</span>
			<h3>Interview · 1 month</h3>
			<p>One month of interviews.</p>
		</div>
		<div class="step">
			<span class="n">3</span>
			<h3>Supervise · 1 month</h3>
			<p>One month of one-on-one supervision with the dept head, on top of normal work.</p>
		</div>
	</div>
	<div class="grid g2">
		<div class="card stack">
			<h3>Define the hire</h3>
			<p>
				Number of hires and their roles. Write a description with the competencies and what it adds
				to a CV.
			</p>
		</div>
		<div class="card stack">
			<h3>Criteria</h3>
			<p>Use a worker profile as a guide only. Every candidate gets an individual evaluation.</p>
		</div>
		<div class="card stack">
			<h3>Who hires</h3>
			<p>
				Keep everyone in the loop. The current and the junior dept head make the final decision.
			</p>
		</div>
		<div class="card stack">
			<h3>First tasks</h3>
			<p>
				Have a first-semester task ready before the new member starts, for example the RC boat
				project.
			</p>
		</div>
	</div>

	<div class="section-head"><h2>Open positions</h2></div>
	{#if data.me.is_admin}
		<form class="card stack" method="POST" action="?/addOpening" use:enhance>
			<div class="row">
				<div class="field grow">
					<label class="lbl" for="op-t">Role</label>
					<input
						class="inp"
						id="op-t"
						name="title"
						maxlength="120"
						placeholder="e.g. Electrical: battery systems"
						required
					/>
				</div>
				<div class="field grow">
					<label class="lbl" for="op-w">Looking for</label>
					<input
						class="inp"
						id="op-w"
						name="looking_for"
						maxlength="160"
						placeholder="e.g. 1st semester electrical students"
						required
					/>
				</div>
			</div>
			<div class="field">
				<label class="lbl" for="op-d">Description and CV gains</label>
				<textarea class="inp" id="op-d" name="description" maxlength="2000"></textarea>
			</div>
			<div>
				<button class="btn" type="submit">Add opening</button>
				<span class="small muted">New openings start as drafts that only admins see.</span>
			</div>
		</form>
	{/if}
	<div class="stack">
		{#each data.openings as o (o.id)}
			<article class="card stack">
				<div class="row" style="justify-content:space-between">
					<h3>{o.title}</h3>
					<span class="row">
						<span class="tag {OPENING_TAG[o.status]}">{OPENING_LABEL[o.status]}</span>
						{#if data.me.is_admin}
							<form method="POST" action="?/setOpening" use:enhance>
								<input type="hidden" name="id" value={o.id} />
								<input
									type="hidden"
									name="status"
									value={o.status === 'open' ? 'closed' : 'open'}
								/>
								<button class="btn ghost sm" type="submit"
									>{o.status === 'open' ? 'Close' : 'Publish'}</button
								>
							</form>
							<form
								method="POST"
								action="?/removeOpening"
								use:enhance
								onsubmit={(e) => {
									if (!confirm(`Remove “${o.title}”?`)) e.preventDefault();
								}}
							>
								<input type="hidden" name="id" value={o.id} />
								<button class="btn ghost sm" type="submit">Remove</button>
							</form>
						{/if}
					</span>
				</div>
				<div class="small muted">Looking for: {o.looking_for}</div>
				{#if o.description}<p style="white-space:pre-line">{o.description}</p>{/if}
			</article>
		{:else}
			<div class="empty">No open positions.</div>
		{/each}
	</div>
{:else if data.tab === 'onboarding'}
	<div class="card stack">
		<div class="section-head">
			<h3>Your onboarding</h3>
			<span class="mono small">{doneCount}/{ONBOARD_ITEMS.length} done</span>
		</div>
		<div class="progress"><i style="width:{(doneCount / ONBOARD_ITEMS.length) * 100}%"></i></div>
		<div class="stack" style="gap:8px">
			{#each ONBOARD_ITEMS as item (item.id)}
				{@const on = data.done.includes(item.id)}
				<form method="POST" action="?/onboarding" use:enhance>
					<input type="hidden" name="item" value={item.id} />
					<input type="hidden" name="done" value={on ? 'false' : 'true'} />
					<label class="check" class:done={on}>
						<input
							type="checkbox"
							checked={on}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
						/>
						<span>{item.text}</span>
					</label>
				</form>
			{/each}
		</div>
	</div>
	<div class="section-head"><h2>Material</h2></div>
	<div class="grid g3">
		<div class="card stack">
			<span class="tag neutral" style="align-self:flex-start">Planned</span>
			<h3>Internal file system</h3>
			<p>Process descriptions for everything we do, in one place.</p>
		</div>
		<div class="card stack">
			<span class="tag neutral" style="align-self:flex-start">Planned</span>
			<h3>Course material</h3>
			<p>
				Material from professors, e.g. all of Embedded 1 and 2, so a curious 1st semester mechanical
				student can read it too.
			</p>
		</div>
		<div class="card stack">
			<span class="tag neutral" style="align-self:flex-start">Planned</span>
			<h3>Training book</h3>
			<p>A training book built on the role descriptions.</p>
		</div>
	</div>
{:else if data.tab === 'workshop'}
	<div class="grid g3">
		<div class="stat hot">
			<span class="eyebrow">Open hours</span><b>06–18</b><small
				>Outside these hours, ask your dept head</small
			>
		</div>
		<div class="stat">
			<span class="eyebrow">1st semester</span><b style="font-size:30px">Supervised</b><small
				>Always work with a supervisor</small
			>
		</div>
		<div class="stat">
			<span class="eyebrow">Tool box</span><b>Box 1</b><small
				>For personal tools with a name tag</small
			>
		</div>
	</div>
	<ol class="rules">
		<li>
			<b class="n">1</b><span
				>Use the workshop from 06:00 to 18:00. Outside those hours, ask your dept head first.</span
			>
		</li>
		<li><b class="n">2</b><span>1st semester members need supervision in the workshop.</span></li>
		<li>
			<b class="n">3</b><span
				>Personal tools need a name tag. Put them in box 1 and register them in the <a
					href={resolve('/(app)/tools')}>Tool list</a
				>.</span
			>
		</li>
		<li><b class="n">4</b><span>From ARC, borrow only the soldering iron, and return it.</span></li>
		<li>
			<b class="n">5</b><span
				>Follow the rules of the workshop itself. They will be added here once we have them.</span
			>
		</li>
	</ol>
{:else}
	<p class="page-intro">
		Which platform for what. Everyone should also set a preferred channel for DMs in their profile.
	</p>
	<div class="tbl-wrap">
		<table>
			<thead><tr><th>Teams</th><th>WhatsApp</th></tr></thead>
			<tbody>
				{#each comms as [teams, whatsapp] (teams)}<tr><td>{teams}</td><td>{whatsapp}</td></tr
					>{/each}
			</tbody>
		</table>
	</div>
	<div class="section-head">
		<h2>Preferred DM channel</h2>
		<span class="small muted mono">{channelsSet}/{data.people.length} set</span>
	</div>
	{#if !myChannel}
		<div class="note">
			<Icon name="info" /><span
				>You have not set yours yet. <a href={resolve('/(app)/profile')}>Set it in My profile</a
				>.</span
			>
		</div>
	{/if}
	<div class="tbl-wrap">
		<table>
			<thead><tr><th>Member</th><th>Department</th><th>Prefers</th></tr></thead>
			<tbody>
				{#each data.people as p (p.id)}
					<tr>
						<td>{p.full_name}</td>
						<td><DeptChip dept={p.dept as Dept} /></td>
						<td>
							{#if p.details?.dm_channel}{DM_LABEL[p.details.dm_channel as DmChannel]}
							{:else}<span class="muted">Not set</span>{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
