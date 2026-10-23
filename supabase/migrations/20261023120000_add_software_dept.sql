-- Adds the software department. Enum values cannot be removed again, so this is one-way.
alter type public.dept add value if not exists 'software';
