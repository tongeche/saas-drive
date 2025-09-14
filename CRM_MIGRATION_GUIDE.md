# CRM Database Migration Guide

## Problem
The CRM functionality is trying to access database tables (`client_communications`, `client_activities`, etc.) that don't exist yet in the current database schema.

## Current Database Schema
The existing database has these tables:
- `tenants` - Business tenants
- `clients` - Basic client information
- `invoices` - Invoice data
- `invoice_items` - Invoice line items
- `payments` - Payment records

## Missing CRM Tables
The CRM system needs these additional tables:
- `client_communications` - Email, phone, SMS communications with clients
- `client_activities` - Client interactions, meetings, tasks
- `client_notes` - Private notes about clients
- `client_reminders` - Follow-up reminders

## Migration Options

### Option 1: Manual Migration (Recommended)
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the migration script: `supabase/migrations/20250914150000_add_crm_tables.sql`

### Option 2: Using Migration Files
If you have the Supabase CLI set up:
```bash
supabase db push
```

### Option 3: Check Migration Status
Visit the endpoint: `/.netlify/functions/check-crm-db` to see the current database status and get migration instructions.

## Migration Script Location
- **File**: `supabase/migrations/20250914150000_add_crm_tables.sql`
- **Alternative**: `supabase/migrations/20250914_add_crm_tables.sql`

## What the Migration Does
1. **Adds columns to existing `clients` table**:
   - `status` (active, prospect, inactive, lead)
   - `tier` (premium, standard, basic)  
   - `company` 
   - `tags` (array of tags)
   - `satisfaction_score` (1-10)
   - `satisfaction_feedback`
   - `payment_terms` (days)
   - `preferred_contact` (email, phone, sms, whatsapp)
   - `last_contact_date`

2. **Creates new CRM tables**:
   - `client_communications` - Communication history
   - `client_activities` - Activity tracking
   - `client_notes` - Client notes
   - `client_reminders` - Follow-up reminders

3. **Adds performance indexes** for faster queries

4. **Sets up proper foreign key relationships** between tables

## Error Handling
The application has been updated to handle missing tables gracefully:
- If CRM tables don't exist, empty arrays are returned
- Console warnings indicate which tables need migration
- No application crashes due to missing tables

## After Migration
Once the migration is complete:
1. The CRM dashboard will populate with data
2. Client communications can be tracked
3. Activities and notes can be added
4. Follow-up reminders will work

## Verification
After running the migration, verify it worked by:
1. Visiting the CRM dashboard - should load without errors
2. Checking the browser console - no "table does not exist" warnings
3. Adding a test communication or activity

## Rollback
If needed, you can remove the CRM tables with:
```sql
DROP TABLE IF EXISTS public.client_reminders;
DROP TABLE IF EXISTS public.client_notes;
DROP TABLE IF EXISTS public.client_activities;
DROP TABLE IF EXISTS public.client_communications;
```

Note: This will delete all CRM data, so only do this if necessary.