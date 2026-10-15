<script lang="ts">
	import { DEPT_LABEL, type Dept } from '#lib/config.js';

	let { dept }: { dept: Dept } = $props();
</script>

<span class="dchip d-{dept}">{DEPT_LABEL[dept]}</span>
