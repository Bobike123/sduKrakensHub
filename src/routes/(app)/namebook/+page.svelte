<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '#lib/components/Avatar.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { firstName } from '#lib/format.js';

	let { data, form } = $props();
	let search = $state('');

	const norm = (s: string) =>
		s
			.normalize('NFD')
			.replace(/\p{Diacritic}/gu, '')
			.toLowerCase();
	const shown = $derived.by(() => {
		const q = norm(search.trim());
		if (!q) return data.entries;
		return data.entries.filter((e) =>
			norm(`${e.person} ${e.context} ${e.contact} ${e.knower?.full_name ?? ''}`).includes(q)
		);
	});
	const canRemove = (e: (typeof data.entries)[number]) =>
		data.me.is_admin || e.known_by === data.me.id || e.created_by === data.me.id;
</script>

<Toast result={form} />

<p class="page-intro">
	Who we have talked to and how they are connected to us, so the next dept head and board do not
	start from zero.
</p>

<form class="card row" method="POST" action="?/add" use:enhance style="align-items:flex-end">
	<div class="field grow">
		<label class="lbl" for="nb-p">Person</label>
		<input class="inp" id="nb-p" name="person" maxlength="120" required />
	</div>
	<div class="field grow">
		<label class="lbl" for="nb-c">Context</label>
		<input
			class="inp"
			id="nb-c"
			name="context"
			maxlength="300"
			placeholder="e.g. Gave us the motor"
			required
		/>
	</div>
	<div class="field grow">
		<label class="lbl" for="nb-x">Contact</label>
		<input
			class="inp"
			id="nb-x"
			name="contact"
			maxlength="200"
			placeholder="Email, phone, or 'ask Juraj'"
		/>
	</div>
	<div class="field" style="width:190px">
		<label class="lbl" for="nb-k">Who knows them</label>
		<select class="inp" id="nb-k" name="known_by" value={data.me.id}>
			{#each data.people as p (p.id)}<option value={p.id}>{p.full_name}</option>{/each}
		</select>
	</div>
	<button class="btn" type="submit"><Icon name="plus" />Add</button>
</form>

<div class="row">
	<input
		class="inp"
		bind:value={search}
		placeholder="Search people, context or contact…"
		aria-label="Search namebook"
		style="max-width:380px"
	/>
</div>

<div class="tbl-wrap">
	<table>
		<thead>
			<tr><th>Person</th><th>Context</th><th>Contact</th><th>Who knows them</th><th></th></tr>
		</thead>
		<tbody>
			{#each shown as e (e.id)}
				<tr>
					<td><b>{e.person}</b></td>
					<td>{e.context}</td>
					<td class="mono small">{e.contact || '—'}</td>
					<td>
						<div class="row" style="flex-wrap:nowrap">
							<Avatar profile={e.knower} sm />{e.knower ? firstName(e.knower.full_name) : '—'}
						</div>
					</td>
					<td>
						{#if canRemove(e)}
							<form
								method="POST"
								action="?/remove"
								use:enhance
								onsubmit={(ev) => {
									if (!confirm(`Remove ${e.person}?`)) ev.preventDefault();
								}}
							>
								<input type="hidden" name="id" value={e.id} />
								<button class="btn ghost sm" type="submit">Remove</button>
							</form>
						{/if}
					</td>
				</tr>
			{:else}
				<tr
					><td colspan="5" class="muted"
						>{search ? 'Nobody matches that search.' : 'Nobody in the namebook yet.'}</td
					></tr
				>
			{/each}
		</tbody>
	</table>
</div>
