<script lang="ts">
	import { enhance } from '$app/forms';
	import Logo from '#lib/components/Logo.svelte';
	import PasswordMeter from '#lib/components/PasswordMeter.svelte';

	let { data, form } = $props();
	let busy = $state(false);
	let password = $state('');
</script>

<svelte:head><title>Set your password · SDU Krakens Hub</title></svelte:head>

<div class="auth">
	<section class="auth-brand">
		<div class="brand-row"><span class="logo-tile"><Logo /></span><b>SDU Krakens</b></div>
		<div style="position:relative;z-index:1;display:flex;flex-direction:column;gap:16px">
			<h1>Task hub.<br /><span>Monaco 2027.</span></h1>
			<p>One more step before you get in.</p>
		</div>
	</section>
	<section class="auth-form">
		<form
			class="auth-card"
			method="POST"
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					await update({ reset: false });
					busy = false;
				};
			}}
		>
			<div>
				<div class="eyebrow">Welcome aboard, {data.firstName}</div>
				<h2>Set your password</h2>
			</div>
			<p class="muted">You are using a temporary password. Choose your own before you continue.</p>
			<div class="field">
				<label class="lbl" for="fp-1">New password</label>
				<input
					class="inp"
					id="fp-1"
					name="p1"
					type="password"
					autocomplete="new-password"
					bind:value={password}
					required
				/>
				<PasswordMeter {password} />
			</div>
			<div class="field">
				<label class="lbl" for="fp-2">Repeat new password</label>
				<input
					class="inp"
					id="fp-2"
					name="p2"
					type="password"
					autocomplete="new-password"
					required
				/>
			</div>
			<div class="err" role="alert">{form?.error ?? ''}</div>
			<button class="btn" type="submit" disabled={busy}>
				{busy ? 'Saving…' : 'Save and continue'}
			</button>
		</form>
		<form method="POST" action="/logout" class="auth-card" style="margin-top:12px;padding-top:0">
			<button class="btn ghost" type="submit">Back to log in</button>
		</form>
	</section>
</div>
