// Create one member account. No email is sent: the temporary password is printed
// once and you hand it over yourself. The member must change it at first login.
//
//   node --env-file=.env.local scripts/create-member.mjs \
//     --username claudiu --name "Claudiu Example" --dept electrical --role "Software" --admin
//
// Needs PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in the environment.
import { parseArgs } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import {
	DEPTS,
	USERNAME_PATTERN,
	generatePassword,
	memberMetadata,
	usernameToEmail
} from '../src/lib/config.ts';

const { values } = parseArgs({
	options: {
		username: { type: 'string' },
		name: { type: 'string' },
		dept: { type: 'string' },
		role: { type: 'string', default: '' },
		admin: { type: 'boolean', default: false }
	}
});

const fail = (message) => {
	console.error(`Error: ${message}`);
	process.exit(1);
};

const username = (values.username ?? '').trim().toLowerCase();
const fullName = (values.name ?? '').trim();
if (!USERNAME_PATTERN.test(username)) fail('--username must be 2-32 chars: a-z 0-9 . _ -');
if (!fullName) fail('--name is required');
if (!DEPTS.includes(values.dept)) fail(`--dept must be one of: ${DEPTS.join(', ')}`);

const url = process.env.PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key)
	fail('PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set (see .env.example)');

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const password = generatePassword();

const { data, error } = await admin.auth.admin.createUser({
	email: usernameToEmail(username),
	password,
	email_confirm: true,
	role: 'authenticated', // GoTrue stores role '' otherwise and PostgREST rejects the tokens
	app_metadata: memberMetadata({
		username,
		fullName,
		dept: values.dept,
		roleTitle: values.role,
		isAdmin: values.admin
	})
});
if (error) fail(error.message);

console.log(`Created ${values.admin ? 'admin ' : ''}${username} (${data.user.id}) on ${url}`);
console.log(`Temporary password (shown once): ${password}`);
