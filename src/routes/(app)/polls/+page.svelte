<script lang="ts">
	import { enhance } from '$app/forms';
	import Toast from '#lib/components/Toast.svelte';
	import { firstName } from '#lib/format.js';

	let { data, form } = $props();
</script>

<Toast result={form} />

{#if data.me.is_admin}
	<form class="card stack" method="POST" action="?/create" use:enhance>
		<div class="section-head"><h2>New poll</h2></div>
		<div class="field">
			<label class="lbl" for="pl-q">Question</label>
			<input class="inp" id="pl-q" name="question" maxlength="200" required />
		</div>
		<div class="field">
			<label class="lbl" for="pl-o">Options, one per line</label>
			<textarea class="inp" id="pl-o" name="options" required placeholder="Option A&#10;Option B"
			></textarea>
		</div>
		<div><button class="btn" type="submit">Create poll</button></div>
	</form>
{/if}

<div class="grid g2">
	{#each data.polls as p (p.id)}
		{@const options = [...p.options].sort((a, b) => a.position - b.position)}
		{@const total = p.votes.length}
		{@const count = (id: string) => p.votes.filter((x) => x.option_id === id).length}
		{@const max = Math.max(0, ...options.map((o) => count(o.id)))}
		{@const mine = p.votes.find((x) => x.user_id === data.me.id)?.option_id}
		<article class="card poll">
			<div class="row" style="justify-content:space-between">
				<span class="tag {p.is_open ? 'ok' : 'neutral'}">{p.is_open ? 'Active' : 'Closed'}</span>
				<span class="small muted mono">{total} vote{total === 1 ? '' : 's'}</span>
			</div>
			<h3>{p.question}</h3>
			<div class="stack" style="gap:8px">
				{#each options as o (o.id)}
					{@const n = count(o.id)}
					{@const pct = total ? Math.round((n / total) * 100) : 0}
					<form method="POST" action="?/vote" use:enhance>
						<input type="hidden" name="poll_id" value={p.id} />
						<input type="hidden" name="option_id" value={o.id} />
						<button
							class="poll-opt"
							class:mine={o.id === mine}
							class:lead={n === max && max > 0}
							type="submit"
							disabled={!p.is_open}
							aria-label="{o.label}: {pct}%, {n} votes"
							style="width:100%"
						>
							<span class="fill" style="width:{pct}%"></span>
							<span class="in">
								<span>{o.label}{o.id === mine ? ' · your vote' : ''}</span>
								<span>{pct}% · {n}</span>
							</span>
						</button>
					</form>
				{/each}
			</div>
			<div class="row small muted" style="justify-content:space-between">
				<span>
					By {p.author ? firstName(p.author.full_name) : 'an admin'}{p.is_open
						? mine
							? ' · tap another option to change, yours again to remove it'
							: ' · tap an option to vote'
						: ''}
				</span>
				{#if data.me.is_admin}
					<span class="row" style="gap:6px">
						<form method="POST" action="?/toggle" use:enhance>
							<input type="hidden" name="id" value={p.id} />
							<input type="hidden" name="open" value={p.is_open ? 'false' : 'true'} />
							<button class="btn ghost sm" type="submit"
								>{p.is_open ? 'Close poll' : 'Reopen'}</button
							>
						</form>
						<form
							method="POST"
							action="?/remove"
							use:enhance
							onsubmit={(e) => {
								if (!confirm('Remove this poll and its votes?')) e.preventDefault();
							}}
						>
							<input type="hidden" name="id" value={p.id} />
							<button class="btn ghost sm" type="submit">Remove</button>
						</form>
					</span>
				{/if}
			</div>
		</article>
	{:else}
		<div class="empty">No polls yet.</div>
	{/each}
</div>
