<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '#lib/components/Icon.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { MONTHS, daysUntil, relDays } from '#lib/format.js';

	let { data, form } = $props();

	const upcoming = $derived(data.events.filter((e) => daysUntil(e.starts_on, data.today) >= 0));
	const past = $derived(
		data.events.filter((e) => daysUntil(e.starts_on, data.today) < 0).reverse()
	);
	const parts = (iso: string) => iso.split('-').map(Number);
</script>

<Toast result={form} />

<div class="legend">
	<span><i style="background:var(--date-up)"></i>Up next</span>
	<span><i style="background:var(--date-fut);border:1px solid var(--date-fut-bd)"></i>Later</span>
	<span><i style="background:var(--date-past)"></i>Done</span>
</div>

{#if data.me.is_admin}
	<form class="card stack" method="POST" action="?/add" use:enhance>
		<div class="row" style="align-items:flex-end">
			<div class="field" style="width:170px">
				<label class="lbl" for="ev-d">Date</label>
				<input class="inp" type="date" id="ev-d" name="starts_on" required />
			</div>
			<div class="field grow">
				<label class="lbl" for="ev-t">Event</label>
				<input class="inp" id="ev-t" name="title" maxlength="120" required />
			</div>
			<div class="field grow">
				<label class="lbl" for="ev-p">Place</label>
				<input class="inp" id="ev-p" name="place" maxlength="120" />
			</div>
		</div>
		<div class="field">
			<label class="lbl" for="ev-x">Description (optional)</label>
			<input class="inp" id="ev-x" name="description" maxlength="1000" />
		</div>
		<div><button class="btn" type="submit"><Icon name="plus" />Add event</button></div>
	</form>
{/if}

{#snippet card(e: (typeof data.events)[number], first: boolean)}
	{@const [y, m, d] = parts(e.starts_on)}
	{@const n = daysUntil(e.starts_on, data.today)}
	{@const cls = n < 0 ? 'past' : first || n <= 60 ? 'up' : 'fut'}
	<article class="event" class:past={n < 0}>
		<div class="datebox {cls}">
			<div class="m">{MONTHS[m - 1]}</div>
			<div class="d">{d}</div>
			<div class="y">{y}</div>
		</div>
		<div style="min-width:0">
			<h3>{e.title}</h3>
			{#if e.place}<div class="small muted">{e.place}</div>{/if}
			{#if e.description}<p style="margin-top:4px">{e.description}</p>{/if}
		</div>
		<div class="ev-side row">
			{#if n < 0}<span class="tag neutral">Done</span>
			{:else}<span class="tag {cls === 'up' ? 'urgent' : 'info'}">{relDays(n)}</span>{/if}
			{#if data.me.is_admin}
				<form
					method="POST"
					action="?/remove"
					use:enhance
					onsubmit={(ev) => {
						if (!confirm(`Remove “${e.title}”?`)) ev.preventDefault();
					}}
				>
					<input type="hidden" name="id" value={e.id} />
					<button class="btn ghost sm" type="submit">Remove</button>
				</form>
			{/if}
		</div>
	</article>
{/snippet}

<div class="section-head"><h2>Upcoming</h2></div>
<div class="stack">
	{#each upcoming as e, i (e.id)}
		{@render card(e, i === 0)}
	{:else}
		<div class="empty">No upcoming events.</div>
	{/each}
</div>

{#if past.length}
	<div class="section-head"><h2>Past</h2></div>
	<div class="stack">
		{#each past as e (e.id)}{@render card(e, false)}{/each}
	</div>
{/if}
