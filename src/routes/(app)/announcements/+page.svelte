<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '#lib/components/Avatar.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { daysUntil, fmtDate, fmtWhen } from '#lib/format.js';
	import { ANNOUNCEMENT_LABEL, ANNOUNCEMENT_TAGS } from '#lib/hub.js';

	let { data, form } = $props();
	const toRace = $derived(daysUntil(data.competition.date, data.today));
</script>

<Toast result={form} />

<div class="stats">
	<div class="stat">
		<span class="eyebrow">Members</span><b>{data.memberCount}</b><small>active in the hub</small>
	</div>
	<div class="stat hot">
		<span class="eyebrow">Next event</span>
		{#if data.nextEvent}
			<b>{daysUntil(data.nextEvent.starts_on, data.today)}</b>
			<small>days · {data.nextEvent.title}</small>
		{:else}
			<b>—</b><small>Nothing planned yet</small>
		{/if}
	</div>
	<div class="stat">
		<span class="eyebrow">Monaco 2027</span><b>{Math.max(0, toRace)}</b>
		<small>days to the race · {fmtDate(data.competition.date)}</small>
	</div>
</div>

{#if data.me.is_admin}
	<form class="card stack" method="POST" action="?/post" use:enhance>
		<div class="section-head">
			<h2>Post an announcement</h2>
			<span class="small muted">Visible to all {data.memberCount} members</span>
		</div>
		<div class="row">
			<div class="field grow">
				<label class="lbl" for="an-t">Title</label>
				<input class="inp" id="an-t" name="title" maxlength="120" required />
			</div>
			<div class="field" style="width:160px">
				<label class="lbl" for="an-g">Tag</label>
				<select class="inp" id="an-g" name="tag">
					{#each ANNOUNCEMENT_TAGS as t (t)}<option value={t}>{ANNOUNCEMENT_LABEL[t]}</option
						>{/each}
				</select>
			</div>
		</div>
		<div class="field">
			<label class="lbl" for="an-b">Message</label>
			<textarea class="inp" id="an-b" name="body" maxlength="4000" required></textarea>
		</div>
		<div><button class="btn" type="submit"><Icon name="megaphone" />Post</button></div>
	</form>
{/if}

<div class="section-head">
	<h2>Latest</h2>
	<span class="small muted">{data.announcements.length} announcements</span>
</div>
<div class="stack">
	{#each data.announcements as a (a.id)}
		<article class="ann" class:urgent={a.tag === 'urgent'}>
			<Avatar profile={a.author} />
			<div style="min-width:0">
				<div class="meta">
					<span class="tag {a.tag}">{ANNOUNCEMENT_LABEL[a.tag]}</span>
					<span>{a.author?.full_name ?? 'Someone'}</span><span>·</span>
					<span>{fmtWhen(a.created_at)}</span>
					{#if data.me.is_admin}
						<form
							method="POST"
							action="?/remove"
							use:enhance
							style="margin-left:auto"
							onsubmit={(e) => {
								if (!confirm('Remove this announcement?')) e.preventDefault();
							}}
						>
							<input type="hidden" name="id" value={a.id} />
							<button class="btn ghost sm" type="submit">Remove</button>
						</form>
					{/if}
				</div>
				<h3>{a.title}</h3>
				<p style="white-space:pre-line">{a.body}</p>
			</div>
		</article>
	{:else}
		<div class="empty">No announcements yet.</div>
	{/each}
</div>
