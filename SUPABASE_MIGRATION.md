# Supabase Backend Setup

This project now has a Supabase REST client and service-post API wrapper. The current Node API is still untouched, so screens can be migrated one by one.

## 1. Create Supabase Project

Create a Supabase project, open the SQL editor, and run:

```sql
-- supabase/schema.sql
```

Use the contents of `supabase/schema.sql`.

## 2. Add App Keys

Update both environment files:

```ts
supabaseUrl: 'https://your-project.supabase.co',
supabaseAnonKey: 'your-anon-key',
supabaseStorageBucket: 'service-images'
```

## 3. Client Services Added

- `SupabaseClientService` handles Supabase REST and Storage calls.
- `SupabaseAuthApiService` handles Supabase signup/login and returns the same token response shape used by the app.
- `SupabaseServicePostsApiService` handles list, create, edit, activate/deactivate, delete, and image upload for service posts.
- `SupabaseHomeRepairApiService` powers Home Repair/Hardware Shop listing, create, edit, activate/deactivate, delete, and image upload.
- `SupabaseWorkerApiService` powers Skilled Workers listing, create, edit, activate/deactivate, delete, and image upload.
- `SupabaseCategoryServiceApi` powers Beauty & Wellness and Education, including their category-specific fields.
- `SupabaseTransportApiService` powers Vehicles/Transportation, including materials, facilities, pricing, and location.
- Supabase endpoints are centralized in `src/app/constants/supabase.constants.ts`.

## 4. Important Auth Note

The SQL policies expect Supabase Auth, where `auth.uid()` matches `owner_id`. If the app continues using the existing custom JWT login, direct client writes should be moved through Supabase Edge Functions or the policy must be adjusted carefully.

## 5. Recommended Migration Order

1. Move read-only listing screens to `SupabaseServicePostsApiService.list(...)`.
2. Move image upload to `uploadImage(...)`.
3. Move dashboard create/edit/activate/delete.
4. After all screens are stable, remove old endpoints from the existing Node API path.
