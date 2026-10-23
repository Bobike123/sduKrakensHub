/**
 * Labels and fixed content for the hub pages. The handbook material comes from
 * the organisation proposal (Juraj and Fynn, 7 Oct 2026) via the v1 prototype.
 */

export const COMPETITION = { name: 'Monaco Energy Boat Challenge', date: '2027-07-08' } as const;

export const ANNOUNCEMENT_TAGS = ['info', 'urgent', 'event'] as const;
export type AnnouncementTag = (typeof ANNOUNCEMENT_TAGS)[number];
export const ANNOUNCEMENT_LABEL: Record<AnnouncementTag, string> = {
	info: 'Info',
	urgent: 'Urgent',
	event: 'Event'
};

export const TOOL_STATUSES = ['workshop', 'borrowed', 'home'] as const;
export type ToolStatus = (typeof TOOL_STATUSES)[number];
export const TOOL_LABEL: Record<ToolStatus, string> = {
	workshop: 'In workshop',
	borrowed: 'Borrowed',
	home: 'At home'
};
/** Tag colour class from the stylesheet. */
export const TOOL_TAG: Record<ToolStatus, string> = {
	workshop: 'ok',
	borrowed: 'warn',
	home: 'neutral'
};

export const DM_CHANNELS = ['whatsapp', 'teams', 'email', 'phone'] as const;
export type DmChannel = (typeof DM_CHANNELS)[number];
export const DM_LABEL: Record<DmChannel, string> = {
	whatsapp: 'WhatsApp',
	teams: 'Teams',
	email: 'Email',
	phone: 'Phone'
};

export const COMPONENT_STATUSES = ['confirmed', 'planned'] as const;
export type ComponentStatus = (typeof COMPONENT_STATUSES)[number];
export const COMPONENT_LABEL: Record<ComponentStatus, string> = {
	confirmed: 'Confirmed on board',
	planned: 'Planned'
};

export const OPENING_STATUSES = ['draft', 'open', 'closed'] as const;
export type OpeningStatus = (typeof OPENING_STATUSES)[number];
export const OPENING_LABEL: Record<OpeningStatus, string> = {
	draft: 'Draft',
	open: 'Open',
	closed: 'Closed'
};
export const OPENING_TAG: Record<OpeningStatus, string> = {
	draft: 'warn',
	open: 'ok',
	closed: 'neutral'
};

export const ASSEMBLY_STATUSES = ['proposed', 'planned', 'cancelled'] as const;
export type AssemblyStatus = (typeof ASSEMBLY_STATUSES)[number];
export const ASSEMBLY_LABEL: Record<AssemblyStatus, string> = {
	proposed: 'Proposed',
	planned: 'Planned',
	cancelled: 'Cancelled'
};
export const ASSEMBLY_TAG: Record<AssemblyStatus, string> = {
	proposed: 'warn',
	planned: 'urgent',
	cancelled: 'neutral'
};

/** What each semester looks like, for a club member and on the dept head track. */
export const LIFECYCLE = {
	member: [
		'Go over the internal wiki, work on the side project (RC boat)',
		'Design minor components for the final boat (e.g. a sensor on board)',
		'Implement on the large boat, supervise 1st semester',
		'Work on the boat, finalise systems before competition',
		'Documentation, wiki writing, supervise 3rd semester, look for a replacement, hiring',
		'Goodbye: delegate work, finalise documentation'
	],
	head: [
		'',
		'',
		'Shadow the current dept head, work on the large boat',
		'Shadow the current dept head, lead 2nd semesters',
		'Take over the full project, supervise and lead 3rd semester',
		'Document work, update the wiki, goodbye'
	]
} as const;

export const ONBOARD_ITEMS = [
	{ id: 'wiki', text: 'Read the internal file system and process descriptions' },
	{ id: 'role', text: 'Read your role description in the Handbook' },
	{ id: 'workshop', text: 'Go through the workshop rules with your dept head' },
	{ id: 'contact', text: 'Set your preferred DM channel in My profile' },
	{ id: 'tools', text: 'Add the tools you own or can share to the Tool list' },
	{ id: 'project', text: 'Pick up your first-semester project (RC boat)' },
	{ id: 'oneonone', text: 'First one-on-one with your dept head' }
] as const;
export const ONBOARD_KEYS = ONBOARD_ITEMS.map((i) => i.id);
