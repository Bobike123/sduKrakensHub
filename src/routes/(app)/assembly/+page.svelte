<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '#lib/components/Icon.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { MONTHS_LONG, firstName, fmtDate } from '#lib/format.js';
	import { ASSEMBLY_LABEL, ASSEMBLY_TAG } from '#lib/hub.js';

	let { data, form } = $props();

	const pad = (n: number) => String(n).padStart(2, '0');
	const shift = (ym: string, by: number) => {
		const [y, m] = ym.split('-').map(Number);
		const d = new Date(Date.UTC(y, m - 1 + by, 1));
		return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
	};
	const monthTitle = (ym: string) => {
		const [y, m] = ym.split('-').map(Number);
		return `${MONTHS_LONG[m - 1]} ${y}`;
	};

	/** Monday-first grid for one month; null cells pad the first week. */
	function cells(ym: string) {
		const [y, m] = ym.split('-').map(Number);
		const offset = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
		const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
		const out: ({ iso: string; day: number; weekend: boolean } | null)[] = Array(offset).fill(null);
		for (let d = 1; d <= days; d++) {
			out.push({ iso: `${ym}-${pad(d)}`, day: d, weekend: (offset + d - 1) % 7 >= 5 });
		}
		return out;
	}
	const onDay = (iso: string) => data.assemblies.find((a) => a.held_on === iso);
	const months = $derived([data.month, shift(data.month, 1)]);
</script>

<Toast result={form} />

<div class="note">
	<Icon name="info" />
	<span>
		General assemblies happen <b>3 times a semester</b> with an update from each department. One is planned
		once every department head agrees. We also use them to show the university we are active.
	</span>
</div>

<div class="section-head">
	<div class="legend">
		<span><i style="background:var(--red)"></i>Planned</span>
		<span><i style="background:var(--surface-2);border:1px solid var(--bad)"></i>Cancelled</span>
		<span><i style="outline:2px dashed var(--warn);outline-offset:-2px"></i>Proposed</span>
	</div>
	<form method="GET" class="row">
		<button class="icon-btn" name="m" value={shift(data.month, -1)} aria-label="Previous month">
			<Icon name="left" />
		</button>
		<button class="btn ghost sm" name="m" value={data.today.slice(0, 7)}>This month</button>
		<button class="icon-btn" name="m" value={shift(data.month, 1)} aria-label="Next month">
			<Icon name="right" />
		</button>
	</form>
</div>

<div class="cal-wrap">
	{#each months as ym (ym)}
		<div class="cal">
			<h3>{monthTitle(ym)}</h3>
			<div class="cal-grid">
				{#each ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as dow (dow)}<div class="dow">
						{dow}
					</div>{/each}
				{#each cells(ym) as c, i (c?.iso ?? `pad-${i}`)}
					{#if c}
						{@const ga = onDay(c.iso)}
						<div
							class="day {ga?.status ?? ''}"
							class:we={c.weekend}
							class:today={c.iso === data.today}
							title={ga ? `General assembly: ${ASSEMBLY_LABEL[ga.status]}` : undefined}
						>
							<span>{c.day}</span>
						</div>
					{:else}
						<div></div>
					{/if}
				{/each}
			</div>
		</div>
	{/each}
</div>

{#if data.me.is_admin}
	<form class="card row" method="POST" action="?/propose" use:enhance style="align-items:flex-end">
		<div class="field" style="width:170px">
			<label class="lbl" for="ga-d">Date</label>
			<input class="inp" type="date" id="ga-d" name="held_on" min={data.today} required />
		</div>
		<div class="field grow">
			<label class="lbl" for="ga-n">Agenda</label>
			<input
				class="inp"
				id="ga-n"
				name="agenda"
				maxlength="300"
				placeholder="Department updates, …"
				required
			/>
		</div>
		<button class="btn" type="submit">Propose assembly</button>
	</form>
{/if}

<div class="section-head"><h2>Assemblies</h2></div>
<div class="grid g2">
	{#each data.assemblies as a (a.id)}
		{@const approved = (id: string) => a.approvals.some((x) => x.user_id === id)}
		{@const [y, m] = a.held_on.split('-').map(Number)}
		<article class="card ga-card">
			<div class="top">
				<div>
					<h3>General assembly · {MONTHS_LONG[m - 1]} {y}</h3>
					<div class="small muted">{fmtDate(a.held_on)}</div>
				</div>
				<span class="tag {ASSEMBLY_TAG[a.status]}">{ASSEMBLY_LABEL[a.status]}</span>
			</div>
			<p>{a.agenda}</p>

			{#if a.status === 'proposed'}
				<div class="stack" style="gap:6px">
					<span class="eyebrow"
						>Dept head approval {data.heads.filter((h) => approved(h.id)).length}/{data.heads
							.length}</span
					>
					<div class="heads">
						{#each data.heads as h (h.id)}
							<span class="chip">{approved(h.id) ? '✓' : '○'} {firstName(h.full_name)}</span>
						{/each}
						{#if data.me.is_admin}
							<form
								method="POST"
								action={approved(data.me.id) ? '?/withdraw' : '?/approve'}
								use:enhance
							>
								<input type="hidden" name="id" value={a.id} />
								<button class="btn sm" class:ghost={approved(data.me.id)} type="submit"
									>{approved(data.me.id) ? 'Withdraw approval' : 'Approve'}</button
								>
							</form>
						{/if}
					</div>
				</div>
			{/if}

			<div><span class="eyebrow">Summary</span></div>
			<div class="summary-box" style="white-space:pre-line">
				{a.summary || 'No summary yet. An admin adds the notes after the meeting.'}
			</div>

			{#if data.me.is_admin}
				<details>
					<summary class="small">Manage</summary>
					<div class="stack" style="margin-top:8px">
						<form class="stack" method="POST" action="?/summary" use:enhance>
							<input type="hidden" name="id" value={a.id} />
							<label class="lbl" for="ga-s-{a.id}">Summary or minutes</label>
							<textarea class="inp" id="ga-s-{a.id}" name="summary" maxlength="8000"
								>{a.summary}</textarea
							>
							<div><button class="btn ghost sm" type="submit">Save summary</button></div>
						</form>
						<div class="row" style="gap:6px">
							{#if a.status !== 'cancelled'}
								<form method="POST" action="?/setStatus" use:enhance>
									<input type="hidden" name="id" value={a.id} />
									<input type="hidden" name="status" value="cancelled" />
									<button class="btn ghost sm" type="submit">Cancel assembly</button>
								</form>
							{/if}
							{#if a.status !== 'proposed'}
								<form method="POST" action="?/setStatus" use:enhance>
									<input type="hidden" name="id" value={a.id} />
									<input type="hidden" name="status" value="proposed" />
									<button class="btn ghost sm" type="submit">Propose again</button>
								</form>
							{/if}
							<form
								method="POST"
								action="?/remove"
								use:enhance
								onsubmit={(e) => {
									if (!confirm('Remove this assembly?')) e.preventDefault();
								}}
							>
								<input type="hidden" name="id" value={a.id} />
								<button class="btn ghost sm" type="submit">Remove</button>
							</form>
						</div>
					</div>
				</details>
			{/if}
		</article>
	{:else}
		<div class="empty">No assemblies yet.</div>
	{/each}
</div>
