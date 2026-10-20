---
title: Release-gate test account cleanup
---

# Release-gate test account cleanup

During Sprint 15 verification a small number of **temporary** accounts were
created to exercise real login flows. They are not product data and should be
removed before real users onboard.

**Never delete production users.** The procedure below is scoped by an explicit
allow-list of addresses on the `@careerconnect.test` domain, which is not a
routable mail domain and cannot belong to a genuine user.

## 1. Identify (read-only)

```sql
select u.id, u.email, u.created_at, u.last_sign_in_at
from auth.users u
where u.email like '%@careerconnect.test'
order by u.created_at;
```

Cross-check the roles attached to each candidate before removing anything:

```sql
select ur.user_id, ur.role
from public.user_roles ur
join auth.users u on u.id = ur.user_id
where u.email like '%@careerconnect.test';
```

Review the returned list by hand. If any address does **not** end in
`@careerconnect.test`, stop — it is out of scope for this procedure.

## 2. Confirm blast radius

For each id, check what would cascade:

```sql
select 'applications' t, count(*) from public.applications where student_id in (
  select id from public.students where user_id = :user_id)
union all select 'resumes', count(*) from public.resumes where user_id = :user_id
union all select 'audit_logs', count(*) from public.audit_logs where actor_id = :user_id;
```

Audit rows are deliberately retained: delete the account, keep the audit trail
(`audit_logs.actor_id` is nullable/decoupled by design).

## 3. Remove

Deletion is performed by an operator with backend admin access, one id at a
time, from the backend console — not from application code and not from a
scheduled job:

```sql
-- one explicit id per statement, taken from step 1
delete from auth.users where id = '<uuid>' and email like '%@careerconnect.test';
```

Profile, student/recruiter, resume and role rows cascade via
`references auth.users(id) on delete cascade`.

## 4. Verify

```sql
select count(*) from auth.users where email like '%@careerconnect.test';  -- expect 0
```

Then re-run the public smoke paths (`/`, `/jobs`, `/careers`, `/companies`,
`/auth`) and confirm at least one genuine account can still sign in.

## Rules

- No credentials are stored in this repository, in scripts, or in CI.
- Do not automate this as a recurring job; it is a one-off release chore.
- If a test account is still needed for monitoring, keep exactly one, document
  it here, and store its password in the secret manager — never in git.
