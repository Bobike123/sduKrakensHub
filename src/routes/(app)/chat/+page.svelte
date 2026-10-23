<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { invalidate } from '$app/navigation';
	import Avatar from '#lib/components/Avatar.svelte';
	import DeptChip from '#lib/components/DeptChip.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { DEPTS, DEPT_LABEL } from '#lib/config.js';
	import { firstName, fmtWhen } from '#lib/format.js';

	let { data, form } = $props();
	let log: HTMLElement | undefined = $state();

	// Keep the newest message in view whenever the list changes.
	$effect(() => {
		void data.messages.length;
		tick().then(() => {
			if (log) log.scrollTop = log.scrollHeight;
		});
	});

	// No browser-side Supabase client (the session cookie is HttpOnly), so poll.
	onMount(() => {
		const timer = setInterval(() => {
			if (document.visibilityState === 'visible') invalidate('app:chat');
		}, 5_000);
		return () => clearInterval(timer);
	});
</script>

<Toast result={form} />

{#if data.me.is_admin}
	<form method="GET" class="tabs" aria-label="Department">
		{#each DEPTS as d (d)}
			<button
				class="tab"
				class:active={d === data.dept}
				aria-current={d === data.dept ? 'page' : undefined}
				name="d"
				value={d}
			>
				{DEPT_LABEL[d]}{d === data.me.dept ? ' (yours)' : ''}
			</button>
		{/each}
	</form>
{/if}

<section class="chat d-{data.dept}">
	<div class="chat-head">
		<div class="row">
			<DeptChip dept={data.dept} />
			<span class="small muted"
				>{data.memberCount} members{data.me.is_admin && data.dept !== data.me.dept
					? ' · admin view'
					: ''}</span
			>
		</div>
		<a class="btn ghost sm" href={resolve('/(app)/meetings')}
			><Icon name="clock" />Request meeting</a
		>
	</div>
	<div class="chat-log" bind:this={log} aria-live="polite">
		{#each data.messages as msg (msg.id)}
			{@const mine = msg.user_id === data.me.id}
			<div class="msg" class:me={mine}>
				{#if !mine}<Avatar profile={msg.author} sm />{/if}
				<div class="bubble">
					<b>{mine ? 'You' : msg.author ? firstName(msg.author.full_name) : 'Someone'}</b>
					<time>{fmtWhen(msg.created_at)}</time>
					<div style="white-space:pre-line">{msg.body}</div>
				</div>
			</div>
		{:else}
			<div class="empty">No messages yet. Say hello.</div>
		{/each}
	</div>
	<form class="chat-form" method="POST" action="?/send" use:enhance>
		<input type="hidden" name="dept" value={data.dept} />
		<input
			class="inp"
			name="body"
			placeholder="Message {DEPT_LABEL[data.dept]}…"
			autocomplete="off"
			maxlength="2000"
			aria-label="Message"
			required
		/>
		<button class="btn" type="submit">Send</button>
	</form>
</section>
