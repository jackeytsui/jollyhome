# Beta Access Codes

Jolly Home is currently configured for invitation-only tester signup.

## How signup works

- new account creation goes through the `invite-signup` Edge Function
- the function checks `public.beta_access_codes`
- valid codes can be reused up to `max_uses`
- successful signup records a row in `public.beta_access_redemptions`

## Create a single-use tester code

```sql
insert into public.beta_access_codes (code, batch_label, max_uses)
values ('JOLLY-TEST-001', 'wave-1', 1);
```

## Create a reusable batch code

```sql
insert into public.beta_access_codes (code, batch_label, max_uses, note)
values ('JOLLY-WAVE1', 'wave-1', 25, 'Shared with first private tester batch');
```

## Disable a code

```sql
update public.beta_access_codes
set active = false
where code = 'JOLLY-WAVE1';
```

## Check redemptions

```sql
select
  c.code,
  c.batch_label,
  c.used_count,
  c.max_uses,
  r.email,
  r.redeemed_at
from public.beta_access_codes c
left join public.beta_access_redemptions r
  on r.beta_access_code_id = c.id
order by c.created_at desc, r.redeemed_at desc nulls last;
```
