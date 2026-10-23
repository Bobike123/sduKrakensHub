<script lang="ts">
	import { DEPT_LABEL, type Dept } from '#lib/config.js';

	// null means the whole team (ideas can be for everyone).
	let { dept }: { dept: Dept | null } = $props();
</script>

<span class="dchip d-{dept ?? 'all'}">{dept ? DEPT_LABEL[dept] : 'All team'}</span>
