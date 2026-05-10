# Storage Bucket Setup

## Create property-photos Bucket

1. Go to **Supabase Dashboard** → **Storage**
2. Click **New Bucket**
3. Fill in:
   - **Name:** `property-photos`
   - **Public bucket:** ✅ Check this
4. Click **Create bucket**

## Add Storage Policies

Once bucket is created, go to the bucket's **Policies** tab and add these two policies:

### Policy 1: Allow authenticated users to upload

```sql
CREATE POLICY "Allow authenticated users to upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-photos' AND
    auth.role() = 'authenticated'
  );
```

### Policy 2: Allow public read access

```sql
CREATE POLICY "Allow public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-photos');
```

## Verify

After creating the bucket and policies:
- ✅ Bucket appears in Storage list
- ✅ Bucket is marked as "Public"
- ✅ 2 policies are listed

---

**Status:** Storage bucket ready for Phase 2 ✅
