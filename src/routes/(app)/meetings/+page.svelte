<script lang="ts">
	import { enhance } from '$app/forms';
	import DeptChip from '#lib/components/DeptChip.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { DEPTS, DEPT_LABEL, type Dept } from '#lib/config.js';
	import { firstName, fmtDate } from '#lib/format.js';

	let { data, form } = $props();
	// Admins can pick another department; it starts as their own.
	let dept = $derived<Dept>(data.me.dept as Dept);
	let copied = $state('');

	const tomorrow = $derived.by(() => {
		const [y, m, d] = data.today.split('-').map(Number);
		return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
	});
	const hhmm = (t: string) => t.slice(0, 5);

	const share = $derived.by(() => {
		const s = form?.sent;
		if (!s) return null;
		const label = DEPT_LABEL[s.dept];
		const when = `${fmtDate(s.meet_on)} at ${hhmm(s.meet_at)}`;
		const name = data.me.full_name;
		const notified = data.people.filter((p) => p.dept === s.dept && p.id !== data.me.id).length;
		return {
			notified,
			whatsapp:
				`*Meeting request: ${label} department*\n*Topic:* ${s.topic}\n*When:* ${when}` +
				(s.note ? `\n*Note:* ${s.note}` : '') +
				`\n\nRequested by ${name}. Reply here if the time doesn't work for you.`,
			email:
				`Subject: Meeting request: ${s.topic} (${when})\n\nHi ${label} team,\n\n` +
				`I'd like to set up a meeting.\n\nTopic: ${s.topic}\nWhen: ${when}` +
				(s.note ? `\nNote: ${s.note}` : '') +
				`\n\nPlease reply if the time doesn't work for you.\n\nBest,\n${name}\nSDU Krakens`
		};
	});

	async function copy(which: 'whatsapp' | 'email') {
		if (!share) return;
		try {
			await navigator.clipboard.writeText(share[which]);
			copied = which;
			setTimeout(() => (copied = ''), 2000);
		} catch {
			copied = '';
		}
	}
</script>

<Toast result={form} />

<p class="page-intro">
	Ask your department for a meeting. Everyone in the department gets a notification, and you get a
	ready-made message to paste into WhatsApp or an email.
</p>

<form class="card stack" method="POST" action="?/request" use:enhance>
	<div class="field">
		<label class="lbl" for="mt-t">Topic</label>
		<input
			class="inp"
			id="mt-t"
			name="topic"
			maxlength="120"
			placeholder="e.g. Motor mount design review"
			required
		/>
	</div>
	<div class="row">
		<div class="field" style="flex:1;min-width:160px">
			<label class="lbl" for="mt-d">Date</label>
			<input class="inp" type="date" id="mt-d" name="meet_on" value={tomorrow} required />
		</div>
		<div class="field" style="flex:1;min-width:130px">
			<label class="lbl" for="mt-h">Time</label>
			<input class="inp" type="time" id="mt-h" name="meet_at" value="16:00" required />
		</div>
		<div class="field" style="flex:1;min-width:170px">
			<label class="lbl" for="mt-dp">Department</label>
			{#if data.me.is_admin}
				<select class="inp dept-sel" id="mt-dp" name="dept" bind:value={dept} data-dept={dept}>
					{#each DEPTS as d (d)}<option value={d}>{DEPT_LABEL[d]}</option>{/each}
				</select>
			{:else}
				<input class="inp" id="mt-dp" value={DEPT_LABEL[data.me.dept as Dept]} readonly />
				<input type="hidden" name="dept" value={data.me.dept} />
			{/if}
		</div>
	</div>
	<div class="field">
		<label class="lbl" for="mt-n">Note (optional)</label>
		<input class="inp" id="mt-n" name="note" maxlength="200" placeholder="Room, what to prepare…" />
	</div>
	<div><button class="btn" type="submit"><Icon name="bell" />Send request</button></div>
</form>

{#if share}
	<section class="card stack">
		<div class="section-head">
			<h2>Share it</h2>
			<span class="tag ok">Request sent · {share.notified} notified</span>
		</div>
		<div class="grid g2">
			<div class="field">
				<label class="lbl" for="tx-wa">WhatsApp message</label>
				<textarea class="inp mono small" id="tx-wa" rows="9" readonly>{share.whatsapp}</textarea>
				<div style="margin-top:8px">
					<button class="btn ghost sm" type="button" onclick={() => copy('whatsapp')}>
						<Icon name="copy" />{copied === 'whatsapp' ? 'Copied' : 'Copy WhatsApp text'}
					</button>
				</div>
			</div>
			<div class="field">
				<label class="lbl" for="tx-em">Email</label>
				<textarea class="inp mono small" id="tx-em" rows="9" readonly>{share.email}</textarea>
				<div style="margin-top:8px">
					<button class="btn ghost sm" type="button" onclick={() => copy('email')}>
						<Icon name="copy" />{copied === 'email' ? 'Copied' : 'Copy email text'}
					</button>
				</div>
			</div>
		</div>
	</section>
{/if}

<div class="section-head"><h2>Requests</h2></div>
{#if data.requests.length}
	<div class="tbl-wrap">
		<table>
			<thead><tr><th>Topic</th><th>When</th><th>Dept</th><th>By</th><th></th></tr></thead>
			<tbody>
				{#each data.requests as r (r.id)}
					<tr>
						<td>
							{r.topic}
							{#if r.note}<div class="small muted">{r.note}</div>{/if}
						</td>
						<td class="mono">{fmtDate(r.meet_on)} {hhmm(r.meet_at)}</td>
						<td><DeptChip dept={r.dept as Dept} /></td>
						<td>{r.author ? firstName(r.author.full_name) : '—'}</td>
						<td>
							{#if r.created_by === data.me.id || data.me.is_admin}
								<form method="POST" action="?/remove" use:enhance>
									<input type="hidden" name="id" value={r.id} />
									<button class="btn ghost sm" type="submit">Remove</button>
								</form>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else}
	<div class="empty">No meeting requests yet.</div>
{/if}
