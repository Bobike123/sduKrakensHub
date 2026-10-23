<script lang="ts">
	let { name }: { name: string } = $props();
</script>

<svg
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.8"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#if name === 'check'}
		<path d="M5 12l5 5 9-10" />
	{:else if name === 'workflow'}
		<rect x="3" y="3" width="6" height="6" rx="1" />
		<rect x="15" y="15" width="6" height="6" rx="1" />
		<path d="M9 6h4a2 2 0 0 1 2 2v7" />
	{:else if name === 'boat'}
		<path d="M3 15h18l-2.5 4.4a1 1 0 0 1-.9.6H6.4a1 1 0 0 1-.9-.6z" />
		<path d="M12 3v12M12 4l6 8h-6" />
	{:else if name === 'log'}
		<path d="M10 6h10M10 12h10M10 18h10" />
		<path d="M3.5 6l1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17" />
	{:else if name === 'users'}
		<circle cx="9" cy="8" r="3.5" />
		<path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" />
	{:else if name === 'user'}
		<circle cx="12" cy="8" r="4" />
		<path d="M4 21a8 8 0 0 1 16 0" />
	{:else if name === 'bell'}
		<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
		<path d="M10 20a2 2 0 0 0 4 0" />
	{:else if name === 'sun'}
		<circle cx="12" cy="12" r="4" />
		<path
			d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
		/>
	{:else if name === 'moon'}
		<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
	{:else if name === 'menu'}
		<path d="M4 7h16M4 12h16M4 17h16" />
	{:else if name === 'logout'}
		<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" />
	{:else if name === 'plus'}
		<path d="M12 5v14M5 12h14" />
	{:else if name === 'info'}
		<circle cx="12" cy="12" r="9" />
		<path d="M12 11v5M12 8h.01" />
	{:else if name === 'x'}
		<path d="M6 6l12 12M18 6L6 18" />
	{:else if name === 'key'}
		<circle cx="8" cy="15" r="4" />
		<path d="M11 12l9-9M17 6l3 3M14.5 8.5l2 2" />
	{:else if name === 'cube'}
		<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
		<path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" />
	{:else if name === 'megaphone'}
		<path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z" />
		<path d="M16.5 9a4 4 0 0 1 0 6" />
		<path d="M19 6.5a8 8 0 0 1 0 11" />
	{:else if name === 'bulb'}
		<path d="M9 18h6M10 21h4" />
		<path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
	{:else if name === 'poll'}
		<path d="M5 20V11M11 20V5M17 20v-6M3 20h18" />
	{:else if name === 'calendar'}
		<rect x="3" y="5" width="18" height="16" rx="2" />
		<path d="M3 10h18M8 3v4M16 3v4" />
	{:else if name === 'assembly'}
		<circle cx="12" cy="8" r="3" />
		<circle cx="5" cy="10" r="2" />
		<circle cx="19" cy="10" r="2" />
		<path d="M7 20a5 5 0 0 1 10 0M2 19a3 3 0 0 1 4-3M22 19a3 3 0 0 0-4-3" />
	{:else if name === 'chat'}
		<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
	{:else if name === 'clock'}
		<circle cx="12" cy="12" r="8.5" />
		<path d="M12 7.5V12l3 2" />
	{:else if name === 'toolbox'}
		<rect x="3" y="8" width="18" height="12" rx="2" />
		<path d="M9 8V5.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V8M3 13h18M10 13v2h4v-2" />
	{:else if name === 'book'}
		<path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z" />
		<path d="M4 20a2 2 0 0 0 2 1h13v-3M8 7h7" />
	{:else if name === 'contacts'}
		<rect x="4" y="3" width="16" height="18" rx="2" />
		<circle cx="12" cy="10" r="3" />
		<path d="M8 17a4 4 0 0 1 8 0" />
	{:else if name === 'thumb'}
		<path d="M7 10v11H4V10z" />
		<path d="M7 10l4-7a2 2 0 0 1 3 2l-1 4h6a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 17.6 21H7" />
	{:else if name === 'copy'}
		<rect x="9" y="9" width="11" height="11" rx="2" />
		<path d="M5 15V5a2 2 0 0 1 2-2h8" />
	{:else if name === 'left'}
		<path d="M15 6l-6 6 6 6" />
	{:else if name === 'right'}
		<path d="M9 6l6 6-6 6" />
	{/if}
</svg>
