<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '#lib/components/Avatar.svelte';
	import DeptChip from '#lib/components/DeptChip.svelte';
	import PasswordMeter from '#lib/components/PasswordMeter.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import type { Dept } from '#lib/config.js';

	let { data, form } = $props();
	let password = $state('');
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
			{form?.message && form.message !== 'Password updated' ? form.message : ''}
		</div>
		<div><button class="btn" type="submit">Update password</button></div>
	</form>
</div>
