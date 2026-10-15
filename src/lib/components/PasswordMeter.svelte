<script lang="ts">
	import { MIN_PASSWORD_LENGTH } from '#lib/config.js';

	let { password }: { password: string } = $props();

	const result = $derived.by(() => {
		if (!password) return { s: 0, l: `Use at least ${MIN_PASSWORD_LENGTH} characters` };
		if (password.length < MIN_PASSWORD_LENGTH) {
			return { s: 1, l: `Too short: at least ${MIN_PASSWORD_LENGTH} characters` };
		}
		let s = 1;
		if (password.length >= 12) s++;
		if (/[a-z]/.test(password) && /[A-Z]/.test(password)) s++;
		if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) s++;
		else if (/\d/.test(password) && password.length >= 10) s++;
		s = Math.min(4, s);
		return { s, l: ['', 'Weak', 'Fair', 'Good', 'Strong'][s] };
	});
</script>

<div class="meter" data-s={result.s}><i></i><i></i><i></i><i></i></div>
<div class="meter-lbl">{result.l}</div>
