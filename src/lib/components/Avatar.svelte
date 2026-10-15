<script lang="ts">
	import { initials } from '#lib/format.js';

	let {
		profile,
		sm = false
	}: { profile: { full_name: string; dept: string } | null | undefined; sm?: boolean } = $props();
</script>

{#if profile}
	<span class="av {profile.dept}" class:sm title={profile.full_name}>
		{initials(profile.full_name)}
	</span>
{/if}
