<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '#lib/components/Avatar.svelte';
	import DeptChip from '#lib/components/DeptChip.svelte';
	import PasswordMeter from '#lib/components/PasswordMeter.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { resolve } from '$app/paths';
	import type { Dept } from '#lib/config.js';
	import { DM_CHANNELS, DM_LABEL, LIFECYCLE, ONBOARD_ITEMS } from '#lib/hub.js';

	let { data, form } = $props();
	let password = $state('');
	const sem = $derived(data.details?.semester ?? 0);
</script>

<Toast result={form} />

<div class="grid g2" style="align-items:start">
	<section class="card stack">
		<div class="row">
			<Avatar profile={data.me} />
			<div>
				<h3 style="font-size:24px">{data.me.full_name}</h3>
				<div class="small muted">
					{data.me.role_title || 'Member'}{data.me.is_admin ? ' · Admin' : ''}
				</div>
			</div>
		</div>
		<dl class="kv">
			<dt>Username</dt>
			<dd class="mono">{data.me.username}</dd>
			<dt>Department</dt>
			<dd><DeptChip dept={data.me.dept as Dept} /></dd>
		</dl>
		<p class="small muted">An admin keeps your name, department and role up to date.</p>
		<form
			class="stack"
			method="POST"
			action="?/saveDetails"
			use:enhance={() =>
				async ({ update }) =>
					update({ reset: false })}
		>
			<dl class="kv">
				<dt><label for="pf-st">Studies</label></dt>
				<dd>
					<input
						class="inp"
						id="pf-st"
						name="studies"
						maxlength="80"
						value={data.details?.studies ?? ''}
						placeholder="e.g. BSc Electrical Engineering"
					/>
				</dd>
				<!-- Time in the team, not the study semester: it drives the lifecycle. -->
				<dt><label for="pf-se">Semester in the team</label></dt>
				<dd>
					<select
						class="inp"
						id="pf-se"
						name="semester"
						value={String(data.details?.semester ?? '')}
					>
						<option value="">Not set</option>
						{#each [1, 2, 3, 4, 5, 6] as n (n)}<option value={String(n)}>{n}</option>{/each}
						<option value="7">7 or more</option>
					</select>
				</dd>
				<dt><label for="pf-c">Preferred DM</label></dt>
				<dd>
					<select class="inp" id="pf-c" name="dm_channel" value={data.details?.dm_channel ?? ''}>
						<option value="">Not set</option>
						{#each DM_CHANNELS as c (c)}<option value={c}>{DM_LABEL[c]}</option>{/each}
					</select>
				</dd>
			</dl>
			<div><button class="btn ghost" type="submit">Save details</button></div>
		</form>
	</section>

	<form
		class="card stack"
		method="POST"
		action="?/changePassword"
		use:enhance={() =>
			async ({ update }) => {
				await update();
				password = '';
			}}
	>
		<h3>Change password</h3>
		<div class="field">
			<label class="lbl" for="cp-0">Current password</label>
			<input
				class="inp"
				id="cp-0"
				name="current"
				type="password"
				autocomplete="current-password"
				required
			/>
		</div>
		<div class="field">
			<label class="lbl" for="cp-1">New password</label>
			<input
				class="inp"
				id="cp-1"
				name="p1"
				type="password"
				autocomplete="new-password"
				bind:value={password}
				required
			/>
			<PasswordMeter {password} />
		</div>
		<div class="field">
			<label class="lbl" for="cp-2">Repeat new password</label>
			<input class="inp" id="cp-2" name="p2" type="password" autocomplete="new-password" required />
		</div>
		<div class="err" role="alert">
			{form?.message && form.message !== 'Password updated' && !form.details ? form.message : ''}
		</div>
		<div><button class="btn" type="submit">Update password</button></div>
	</form>
</div>

<section class="card stack">
	<h3>Where you are in the lifecycle</h3>
	{#if sem >= 1 && sem <= 6}
		<p>
			<span class="eyebrow">Semester {sem} in the team · club member</span><br />{LIFECYCLE.member[
				sem - 1
			]}
		</p>
		<!-- The head track is for juniors shadowing a dept head, so everyone sees it. -->
		{#if LIFECYCLE.head[sem - 1]}
			<p>
				<span class="eyebrow">If you are on the dept head track</span><br />{LIFECYCLE.head[
					sem - 1
				]}
			</p>
		{/if}
	{:else if sem > 6}
		<p class="muted">
			You are past the six-semester lifecycle. Focus on handover and documentation.
		</p>
	{:else}
		<p class="muted">Set your semester in the team to see what your role looks like right now.</p>
	{/if}
	<div>
		<span class="eyebrow">Onboarding {data.onboardingDone}/{ONBOARD_ITEMS.length}</span>
		<div class="progress" style="margin-top:6px;max-width:420px">
			<i style="width:{(data.onboardingDone / ONBOARD_ITEMS.length) * 100}%"></i>
		</div>
	</div>
	<div>
		<a class="btn ghost sm" href="{resolve('/(app)/handbook')}?tab=onboarding"
			>Open onboarding checklist</a
		>
	</div>
</section>
