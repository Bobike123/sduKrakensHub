<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import Logo from '#lib/components/Logo.svelte';
	import Icon from '#lib/components/Icon.svelte';

	let { form } = $props();
	let busy = $state(false);
	let dark = $state(true);

	// The theme lives on <html> (set before first paint), which only exists in the browser.
	onMount(() => {
		dark = document.documentElement.dataset.theme !== 'light';
	});

	function toggleTheme() {
		const next = dark ? 'light' : 'dark';
		document.documentElement.dataset.theme = next;
		try {
			localStorage.setItem('krakens-theme', next);
		} catch {
			/* private mode: the theme just will not persist */
		}
		dark = next === 'dark';
	}
</script>

<svelte:head><title>Log in · SDU Krakens Hub</title></svelte:head>

<div class="auth">
	<section class="auth-brand">
		<div class="brand-row"><span class="logo-tile"><Logo /></span><b>SDU Krakens</b></div>
		<div style="position:relative;z-index:1;display:flex;flex-direction:column;gap:16px">
			<h1>Task hub.<br /><span>Monaco 2027.</span></h1>
			<p>
				Parts, tasks and who does what, for the University of Southern Denmark's energy boat team.
			</p>
		</div>
	</section>
	<section class="auth-form">
		<form
			class="auth-card"
			method="POST"
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					await update();
					busy = false;
				};
			}}
		>
			<div>
				<div class="eyebrow">Members only</div>
				<h2>Log in</h2>
			</div>
			<div class="field">
				<label class="lbl" for="li-u">Username</label>
				<input
					class="inp"
					id="li-u"
					name="username"
					autocomplete="username"
					placeholder="e.g. andrea"
					value={form?.username ?? ''}
					required
				/>
			</div>
			<div class="field">
				<label class="lbl" for="li-p">Password</label>
				<input
					class="inp"
					id="li-p"
					name="password"
					type="password"
					autocomplete="current-password"
					required
				/>
			</div>
			<div class="err" role="alert">{form?.error ?? ''}</div>
			<button class="btn" type="submit" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
			<div class="auth-foot small muted">
				<span>First time? Use the temporary password an admin gave you.</span>
				<button
					type="button"
					class="icon-btn"
					onclick={toggleTheme}
					aria-label="Toggle light and dark mode"
				>
					<Icon name={dark ? 'sun' : 'moon'} />
				</button>
			</div>
		</form>
	</section>
</div>
