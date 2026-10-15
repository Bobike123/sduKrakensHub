<script lang="ts">
	// Pass the page's `form` result. Every action response is a new object, so the
	// effect re-runs (and the toast reappears) even if the message text repeats.
	let { result }: { result: { message?: string } | null | undefined } = $props();
	let text = $state('');

	$effect(() => {
		const message = result?.message;
		if (!message) return;
		text = message;
		const timer = setTimeout(() => (text = ''), 3200);
		return () => clearTimeout(timer);
	});
</script>

{#if text}
	<div class="toast" role="status">{text}</div>
{/if}
