<script lang="ts">
	import { enhance } from '$app/forms';
	import DeptChip from '#lib/components/DeptChip.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { DEPTS, DEPT_LABEL, type Dept } from '#lib/config.js';
	import { firstName, fmtDate } from '#lib/format.js';

	let { data, form } = $props();
	let sort = $state<'top' | 'new'>('top');
	let dept = $state('');

	const shown = $derived(
		[...data.ideas].sort((a, b) =>
			sort === 'top'
				? b.idea_votes.length - a.idea_votes.length || b.created_at.localeCompare(a.created_at)
				: b.created_at.localeCompare(a.created_at)
		)
	);
	const voted = (idea: (typeof data.ideas)[number]) =>
		idea.idea_votes.some((v) => v.user_id === data.me.id);
</script>

<Toast result={form} />

<p class="page-intro">
	Drop any idea for the boat, the team or outreach. Thumbs-up the ones you want to see happen.
</p>

<form
	class="idea-form"
	method="POST"
	action="?/add"
	use:enhance={() =>
		async ({ update }) => {
			await update();
			dept = '';
		}}
>
	<input
		class="inp"
		name="body"
		placeholder="Your idea…"
		maxlength="280"
		required
		aria-label="Idea"
	/>
	<select
		class="inp dept-sel"
		name="dept"
		bind:value={dept}
		data-dept={dept === 'all' ? '' : dept}
		required
		aria-label="Department"
	>
		<option value="" disabled>Department…</option>
		{#each DEPTS as d (d)}<option value={d}>{DEPT_LABEL[d]}</option>{/each}
		<option value="all">All team</option>
	</select>
	<button class="btn" type="submit"><Icon name="plus" />Add</button>
</form>

<div class="section-head">
	<div class="pills" role="group" aria-label="Sort ideas">
		<button class="pill" class:active={sort === 'top'} type="button" onclick={() => (sort = 'top')}
			>Most votes</button
		>
		<button class="pill" class:active={sort === 'new'} type="button" onclick={() => (sort = 'new')}
			>Newest</button
		>
	</div>
	<span class="small muted">{data.ideas.length} ideas</span>
</div>

<div class="grid g3">
	{#each shown as idea (idea.id)}
		{@const on = voted(idea)}
		<article class="idea d-{idea.dept ?? 'all'}">
			<div><DeptChip dept={idea.dept as Dept | null} /></div>
			<p>{idea.body}</p>
			<footer>
				<span>
					{idea.author ? firstName(idea.author.full_name) : 'Someone'} · {fmtDate(idea.created_at)}
				</span>
				<span class="row" style="flex-wrap:nowrap;gap:6px">
					{#if idea.created_by === data.me.id || data.me.is_admin}
						<form
							method="POST"
							action="?/remove"
							use:enhance
							onsubmit={(e) => {
								if (!confirm('Remove this idea?')) e.preventDefault();
							}}
						>
							<input type="hidden" name="id" value={idea.id} />
							<button class="btn ghost sm" type="submit">Remove</button>
						</form>
					{/if}
					<form method="POST" action="?/vote" use:enhance>
						<input type="hidden" name="id" value={idea.id} />
						<button
							class="vote"
							class:on
							type="submit"
							aria-pressed={on}
							aria-label="Upvote, {idea.idea_votes.length} votes"
						>
							<Icon name="thumb" /><span class="mono">{idea.idea_votes.length}</span>
						</button>
					</form>
				</span>
			</footer>
		</article>
	{:else}
		<div class="empty">No ideas yet. Be the first.</div>
	{/each}
</div>
