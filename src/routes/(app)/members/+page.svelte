<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '#lib/components/Avatar.svelte';
	import DeptChip from '#lib/components/DeptChip.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { DEPTS, DEPT_LABEL, type Dept } from '#lib/config.js';
	import { DM_LABEL, type DmChannel } from '#lib/hub.js';

	let { data, form } = $props();
	let filter = $state<'all' | Dept>('all');

	const shown = $derived(data.members.filter((m) => filter === 'all' || m.dept === filter));
	const count = (d: 'all' | Dept) =>
		data.members.filter((m) => m.is_active && (d === 'all' || m.dept === d)).length;
</script>

<Toast result={form} />

{#if form?.reveal}
	<div class="reveal" role="status">
		<b>Temporary password for {form.reveal.username}</b>
		<code>{form.reveal.password}</code>
		<span class="small muted">
			Shown once and not stored. Hand it over privately; they must change it at first login.
		</span>
	</div>
{/if}

{#if data.me.is_admin}
	<details class="card">
		<summary><b>Add a member</b></summary>
		<form class="stack" method="POST" action="?/create" use:enhance style="margin-top:12px">
			<div class="row">
				<div class="field" style="width:200px">
					<label class="lbl" for="am-u">Username</label>
					<input
						class="inp"
						id="am-u"
						name="username"
						placeholder="e.g. andrea"
						autocomplete="off"
						required
					/>
				</div>
				<div class="field grow">
					<label class="lbl" for="am-n">Full name</label>
					<input class="inp" id="am-n" name="full_name" maxlength="80" required />
				</div>
				<div class="field" style="width:180px">
					<label class="lbl" for="am-d">Department</label>
					<select class="inp" id="am-d" name="dept" value={data.me.dept}>
						{#each DEPTS as d (d)}<option value={d}>{DEPT_LABEL[d]}</option>{/each}
					</select>
				</div>
				<div class="field grow">
					<label class="lbl" for="am-r">Role</label>
					<input
						class="inp"
						id="am-r"
						name="role_title"
						placeholder="e.g. Sensors"
						maxlength="80"
					/>
				</div>
			</div>
			<label class="check"
				><input type="checkbox" name="is_admin" /><span>Admin (department head)</span></label
			>
			<div><button class="btn" type="submit"><Icon name="plus" />Create account</button></div>
			<p class="small muted">
				No email is sent. You get a temporary password to hand over; the member sets their own at
				first login.
			</p>
		</form>
	</details>
{/if}

<div class="pills" role="group" aria-label="Filter by department">
	<button
		class="pill"
		class:active={filter === 'all'}
		type="button"
		onclick={() => (filter = 'all')}
	>
		All <span class="mono small">{count('all')}</span>
	</button>
	{#each DEPTS as d (d)}
		<button class="pill" class:active={filter === d} type="button" onclick={() => (filter = d)}>
			{DEPT_LABEL[d]} <span class="mono small">{count(d)}</span>
		</button>
	{/each}
</div>

<div class="grid g3">
	{#each shown as m (m.id)}
		<article class="member" style={m.is_active ? '' : 'opacity:.6'}>
			<div class="top">
				<Avatar profile={m} />
				<div>
					<h3>
						{m.full_name}{m.id === data.me.id ? ' ' : ''}{#if m.id === data.me.id}<span
								class="small muted">(you)</span
							>{/if}
					</h3>
					<div class="small muted">
						{m.role_title || '—'} · <span class="mono">{m.username}</span>
					</div>
				</div>
			</div>
			<div style="display:flex;gap:6px;flex-wrap:wrap">
				<DeptChip dept={m.dept as Dept} />
				{#if m.is_admin}<span class="chip">Admin</span>{/if}
				{#if !m.is_active}<span class="tag neutral">Deactivated</span>
				{:else if m.must_change_password}<span class="tag warn">Temporary password</span>{/if}
			</div>
			{#if m.details && (m.details.semester || m.details.studies || m.details.dm_channel)}
				<div class="facts">
					{#if m.details.semester}<span
							>{m.details.semester > 6 ? '7+' : m.details.semester} semester{m.details.semester ===
							1
								? ''
								: 's'} in the team</span
						>{/if}
					{#if m.details.studies}<span>{m.details.studies}</span>{/if}
					{#if m.details.dm_channel}<span
							>Prefers {DM_LABEL[m.details.dm_channel as DmChannel]}</span
						>{/if}
				</div>
			{/if}

			{#if data.me.is_admin}
				<details>
					<summary class="small">Manage</summary>
					<div class="stack" style="margin-top:8px">
						{#if m.is_active}
							<form
								method="POST"
								action="?/reset"
								use:enhance
								onsubmit={(e) => {
									if (!confirm(`Reset the password for ${m.full_name}?`)) e.preventDefault();
								}}
							>
								<input type="hidden" name="id" value={m.id} />
								<button class="btn ghost sm" type="submit"><Icon name="key" />Reset password</button
								>
							</form>
						{/if}
						<form method="POST" action="?/setAdmin" use:enhance>
							<input type="hidden" name="id" value={m.id} />
							<input type="hidden" name="admin" value={m.is_admin ? 'false' : 'true'} />
							<button class="btn ghost sm" type="submit"
								>{m.is_admin ? 'Remove admin' : 'Make admin'}</button
							>
						</form>
						<form
							method="POST"
							action="?/setActive"
							use:enhance
							onsubmit={(e) => {
								if (
									m.is_active &&
									!confirm(`Deactivate ${m.full_name}? They can no longer log in.`)
								)
									e.preventDefault();
							}}
						>
							<input type="hidden" name="id" value={m.id} />
							<input type="hidden" name="active" value={m.is_active ? 'false' : 'true'} />
							<button class="btn ghost sm" type="submit"
								>{m.is_active ? 'Deactivate' : 'Reactivate'}</button
							>
						</form>
					</div>
				</details>
			{/if}
		</article>
	{/each}
</div>
