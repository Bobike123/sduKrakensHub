export const MONTHS = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec'
];
export const MONTHS_LONG = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
];

/** All "today" maths happens in the team's timezone, on server and client alike,
 *  so a task is never overdue on one side and fine on the other. */
export const TZ = 'Europe/Copenhagen';

export const todayISO = (): string =>
	new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());

const dayNumber = (iso: string): number => {
	const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
	return Date.UTC(y, m - 1, d) / 864e5;
};

/** Whole days from `from` (default today) to `iso`; negative means in the past. */
export const daysUntil = (iso: string, from: string = todayISO()): number =>
	dayNumber(iso) - dayNumber(from);

export const fmtDate = (iso: string): string => {
	const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
	return `${d} ${MONTHS[m - 1]} ${y}`;
};

export const relDays = (n: number): string =>
	n === 0
		? 'today'
		: n === 1
			? 'tomorrow'
			: n === -1
				? 'yesterday'
				: n > 0
					? `in ${n} days`
					: `${-n} days ago`;

export const fmtWhen = (timestamp: string): string =>
	new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
		timeZone: TZ
	}).format(new Date(timestamp));

export const initials = (name: string): string =>
	name
		.split(/\s+/)
		.filter(Boolean)
		.map((p) => p[0])
		.slice(0, 2)
		.join('')
		.toUpperCase();

export const firstName = (name: string): string => name.split(' ')[0];
