<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import Avatar from '#lib/components/Avatar.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import Logo from '#lib/components/Logo.svelte';

	let { data, children } = $props();
	let menuOpen = $state(false);
	let dark = $state(true);

	const nav = [
		{
			head: 'Work',
			items: [
				{ href: '/', label: 'My tasks', icon: 'check' },
				{ href: '/board', label: 'Board', icon: 'workflow' },
				{ href: '/parts', label: 'Parts', icon: 'boat' }
			]
		},
		{
			head: 'Team',
			items: [
				{ href: '/log', label: 'Contribution log', icon: 'log' },
				{ href: '/members', label: 'Members', icon: 'users' },
				{ href: '/profile', label: 'My profile', icon: 'user' }
			]
		}
	] as const;
	// resolve() takes route ids, which include the (app) group.
	const routeOf = {
		'/': '/(app)',
		'/board': '/(app)/board',
		'/parts': '/(app)/parts',
		'/log': '/(app)/log',
		'/members': '/(app)/members',
		'/profile': '/(app)/profile'
	} as const;

	const titles: Record<string, string> = {
		'/': 'My tasks',
		'/board': 'Board',
		'/parts': 'Parts',
		'/log': 'Contribution log',
		'/members': 'Members',
		'/profile': 'My profile',
		'/notifications': 'Notifications'
	};
	const section = $derived('/' + page.url.pathname.split('/')[1]);
	const title = $derived(titles[section] ?? 'Krakens Hub');
	const isActive = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);

	onMount(() => {
		dark = document.documentElement.dataset.theme !== 'light';
		// No realtime yet: refresh the data every minute while the tab is visible.
		const timer = setInterval(() => {
			if (document.visibilityState === 'visible') invalidateAll();
		}, 60_000);
		return () => clearInterval(timer);
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

<svelte:head><title>{title} · SDU Krakens Hub</title></svelte:head>

<div class="app">
	<aside class="sidebar" class:open={menuOpen} aria-label="Main navigation">
		<div class="sb-brand">
			<span class="logo-tile"><Logo /></span>
			<div><b>SDU Krakens</b><small>Task hub · Monaco 2027</small></div>
		</div>
		<nav class="sb-nav">
			{#each nav as group (group.head)}
				<div class="sb-head">{group.head}</div>
				{#each group.items as item (item.href)}
					<a
						class="sb-item"
						class:active={isActive(item.href)}
						href={resolve(routeOf[item.href])}
						aria-current={isActive(item.href) ? 'page' : undefined}
						onclick={() => (menuOpen = false)}
					>
						<Icon name={item.icon} /><span>{item.label}</span>
					</a>
				{/each}
			{/each}
		</nav>
		<div class="sb-user">
			<Avatar profile={data.me} sm />
			<div class="who">
				<b>{data.me.full_name}</b>
				<small>{data.me.role_title || data.me.dept}{data.me.is_admin ? ' · Admin' : ''}</small>
			</div>
			<form method="POST" action="/logout">
				<button class="icon-btn" type="submit" aria-label="Log out" title="Log out">
					<Icon name="logout" />
				</button>
			</form>
		</div>
	</aside>
	{#if menuOpen}
		<button class="scrim" type="button" aria-label="Close menu" onclick={() => (menuOpen = false)}
		></button>
	{/if}

	<div class="main" style="position:relative">
		<header class="topbar">
			<button
				class="icon-btn menu-btn"
				type="button"
				aria-label="Open menu"
				onclick={() => (menuOpen = true)}
			>
				<Icon name="menu" />
			</button>
			<h1>{title}</h1>
			<button
				class="icon-btn"
				type="button"
				onclick={toggleTheme}
				aria-label="Switch to {dark ? 'light' : 'dark'} mode"
			>
				<Icon name={dark ? 'sun' : 'moon'} />
			</button>
			<a
				class="icon-btn"
				href={resolve('/(app)/notifications')}
				aria-label="Notifications{data.unread ? ` (${data.unread} new)` : ''}"
			>
				<Icon name="bell" />
				{#if data.unread}<span class="bell-badge" aria-hidden="true"
						>{data.unread > 9 ? '9+' : data.unread}</span
					>{/if}
			</a>
		</header>
		<div class="content" id="content">
			<div class="page">{@render children()}</div>
		</div>
	</div>
</div>
