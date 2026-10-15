<script lang="ts">
	import '@fontsource/barlow/400.css';
	import '@fontsource/barlow/500.css';
	import '@fontsource/barlow/600.css';
	import '@fontsource/barlow/700.css';
	import '@fontsource/saira-condensed/600.css';
	import '@fontsource/saira-condensed/700.css';
	import '@fontsource/saira-condensed/800.css';
	import '@fontsource/ibm-plex-mono/400.css';
	import '@fontsource/ibm-plex-mono/500.css';
	import '../app.css';

	let { children } = $props();
</script>

{@render children()}
