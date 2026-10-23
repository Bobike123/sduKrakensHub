<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '#lib/components/Avatar.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { firstName } from '#lib/format.js';
	import { TOOL_LABEL, TOOL_STATUSES, TOOL_TAG, type ToolStatus } from '#lib/hub.js';

	let { data, form } = $props();
	let filter = $state<'all' | ToolStatus>('all');

	const shown = $derived(data.tools.filter((t) => filter === 'all' || t.status === filter));
	const count = (s: 'all' | ToolStatus) =>
		data.tools.filter((t) => s === 'all' || t.status === s).length;
	const canEdit = (t: (typeof data.tools)[number]) => data.me.is_admin || t.owner_id === data.me.id;
</script>

<Toast result={form} />

<p class="page-intro">
	What everyone has and can share. Personal tools in the workshop need a name tag and go in box 1.
</p>

<form class="card row" method="POST" action="?/add" use:enhance style="align-items:flex-end">
	<div class="field grow">
		<label class="lbl" for="tl-i">Item</label>
		<input
			class="inp"
			id="tl-i"
			name="item"
			maxlength="120"
			placeholder="e.g. Multimeter"
			required
		/>
	</div>
	{#if data.me.is_admin}
		<div class="field" style="width:200px">
			<label class="lbl" for="tl-o">Owner</label>
			<select class="inp" id="tl-o" name="owner_id" value={data.me.id}>
				{#each data.people as p (p.id)}<option value={p.id}>{p.full_name}</option>{/each}
			</select>
		</div>
	{/if}
	<div class="field" style="width:170px">
		<label class="lbl" for="tl-s">Status</label>
		<select class="inp" id="tl-s" name="status">
			{#each TOOL_STATUSES as s (s)}<option value={s}>{TOOL_LABEL[s]}</option>{/each}
		</select>
	</div>
	<button class="btn" type="submit"><Icon name="plus" />Add tool</button>
</form>

<div class="pills" role="group" aria-label="Filter by status">
	<button
		class="pill"
		class:active={filter === 'all'}
		type="button"
		onclick={() => (filter = 'all')}
	>
		All <span class="mono small">{count('all')}</span>
	</button>
	{#each TOOL_STATUSES as s (s)}
		<button class="pill" class:active={filter === s} type="button" onclick={() => (filter = s)}>
			{TOOL_LABEL[s]} <span class="mono small">{count(s)}</span>
		</button>
	{/each}
</div>

<div class="tbl-wrap">
	<table>
		<thead><tr><th>Item</th><th>Owner</th><th>Status</th><th></th></tr></thead>
		<tbody>
			{#each shown as t (t.id)}
				<tr>
					<td><b>{t.item}</b></td>
					<td>
						<div class="row" style="flex-wrap:nowrap">
							<Avatar profile={t.owner} sm />{t.owner ? firstName(t.owner.full_name) : '—'}
						</div>
					</td>
					<td>
						{#if canEdit(t)}
							<form method="POST" action="?/setStatus" use:enhance>
								<input type="hidden" name="id" value={t.id} />
								<select
									class="inp"
									name="status"
									value={t.status}
									style="min-height:34px;padding:4px 8px;width:auto"
									aria-label="Status of {t.item}"
									onchange={(e) => e.currentTarget.form?.requestSubmit()}
								>
									{#each TOOL_STATUSES as s (s)}<option value={s}>{TOOL_LABEL[s]}</option>{/each}
								</select>
							</form>
						{:else}
							<span class="tag {TOOL_TAG[t.status]}">{TOOL_LABEL[t.status]}</span>
						{/if}
					</td>
					<td>
						{#if canEdit(t)}
							<form
								method="POST"
								action="?/remove"
								use:enhance
								onsubmit={(e) => {
									if (!confirm(`Remove ${t.item}?`)) e.preventDefault();
								}}
							>
								<input type="hidden" name="id" value={t.id} />
								<button class="btn ghost sm" type="submit">Remove</button>
							</form>
						{/if}
					</td>
				</tr>
			{:else}
				<tr><td colspan="4" class="muted">No tools here yet.</td></tr>
			{/each}
		</tbody>
	</table>
</div>
