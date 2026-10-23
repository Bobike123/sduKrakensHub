<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Icon from '#lib/components/Icon.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { COMPONENT_LABEL, COMPONENT_STATUSES } from '#lib/hub.js';

	let { data, form } = $props();
</script>

<Toast result={form} />

<section class="boat-stage">
	<span class="tag warn soon">3D tracker coming soon</span>
	<svg
		viewBox="0 0 800 260"
		role="img"
		aria-label="Side view of the boat with the motor and power converters marked"
	>
		<path
			d="M0 196 Q50 186 100 196 T200 196 T300 196 T400 196 T500 196 T600 196 T700 196 T800 196 V260 H0Z"
			style="fill:var(--elec-soft)"
		/>
		<path
			d="M70 118 H735 L778 104 L742 158 Q700 192 600 194 H140 Q92 192 80 166 Z"
			style="fill:var(--surface-2);stroke:var(--tx);stroke-width:2.5;stroke-linejoin:round"
		/>
		<path
			d="M290 118 Q320 70 410 68 H490 Q540 72 566 118"
			style="fill:none;stroke:var(--tx);stroke-width:2.5"
		/>
		<path d="M140 172 L96 214" style="stroke:var(--tx-2);stroke-width:3;stroke-linecap:round" />
		<ellipse cx="92" cy="218" rx="6" ry="16" style="fill:var(--tx-2)" />
		<rect x="128" y="142" width="58" height="34" rx="6" style="fill:var(--red)" />
		<rect x="340" y="138" width="90" height="30" rx="5" style="fill:var(--elec)" />
		<rect
			x="450"
			y="138"
			width="130"
			height="30"
			rx="5"
			style="fill:none;stroke:var(--tx-2);stroke-width:2;stroke-dasharray:6 5"
		/>
		<text x="515" y="158" text-anchor="middle" style="fill:var(--tx-2);font:600 13px var(--f-body)"
			>battery (TBD)</text
		>
		<circle cx="157" cy="112" r="15" style="fill:var(--red)" />
		<text x="157" y="117" text-anchor="middle" style="fill:#fff;font:800 15px var(--f-display)"
			>1</text
		>
		<circle cx="385" cy="112" r="15" style="fill:var(--red)" />
		<text x="385" y="117" text-anchor="middle" style="fill:#fff;font:800 15px var(--f-display)"
			>2</text
		>
		<path d="M157 127 V142 M385 127 V138" style="stroke:var(--red);stroke-width:2" />
	</svg>
</section>

<div class="note">
	<Icon name="info" />
	<span>
		<b>3D interactive tracker coming soon.</b> This page will become a rotatable model of the boat where
		you can click a component to see its status, owner and documentation.
	</span>
</div>

<div class="section-head"><h2>On the boat</h2></div>
<div class="grid g2">
	{#each data.components as c, i (c.id)}
		<div class="comp">
			<span class="num">{i + 1}</span>
			<div>
				<h3 style="font-size:19px">{c.name}</h3>
				{#if c.detail}<p class="muted">{c.detail}</p>{/if}
				<div style="margin-top:8px" class="row">
					<span class="tag {c.status === 'confirmed' ? 'ok' : 'neutral'}"
						>{c.status === 'confirmed' ? '✓ ' : ''}{COMPONENT_LABEL[c.status]}</span
					>
					{#if data.me.is_admin}
						<form method="POST" action="?/setStatus" use:enhance>
							<input type="hidden" name="id" value={c.id} />
							<input
								type="hidden"
								name="status"
								value={c.status === 'confirmed' ? 'planned' : 'confirmed'}
							/>
							<button class="btn ghost sm" type="submit"
								>{c.status === 'confirmed' ? 'Mark planned' : 'Mark confirmed'}</button
							>
						</form>
						<form
							method="POST"
							action="?/remove"
							use:enhance
							onsubmit={(e) => {
								if (!confirm(`Remove ${c.name}?`)) e.preventDefault();
							}}
						>
							<input type="hidden" name="id" value={c.id} />
							<button class="btn ghost sm" type="submit">Remove</button>
						</form>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<div class="empty">Nothing on the boat yet.</div>
	{/each}
</div>

{#if data.me.is_admin}
	<form class="card row" method="POST" action="?/add" use:enhance style="align-items:flex-end">
		<div class="field grow">
			<label class="lbl" for="bc-n">Component</label>
			<input class="inp" id="bc-n" name="name" maxlength="80" placeholder="e.g. Battery" required />
		</div>
		<div class="field grow">
			<label class="lbl" for="bc-d">Detail</label>
			<input class="inp" id="bc-d" name="detail" maxlength="160" placeholder="Supplier, spec…" />
		</div>
		<div class="field" style="width:190px">
			<label class="lbl" for="bc-s">Status</label>
			<select class="inp" id="bc-s" name="status">
				{#each COMPONENT_STATUSES as s (s)}<option value={s}>{COMPONENT_LABEL[s]}</option>{/each}
			</select>
		</div>
		<button class="btn" type="submit"><Icon name="plus" />Add</button>
	</form>
{/if}

<p class="small muted">
	Hull, battery system, sensors and steering get added as they are confirmed. Track individual parts
	in
	<a href={resolve('/(app)/parts')}>Parts</a>.
</p>
