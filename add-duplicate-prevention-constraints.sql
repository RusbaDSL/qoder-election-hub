-- Migration: Add unique constraints to prevent duplicate voters
-- This script can be run on an existing database with data
-- Date: 2025-01-07

-- Step 1: Check for existing duplicates (optional - for information only)
-- Uncomment these queries to see if you have any duplicates before applying constraints

-- Check for duplicate emails within elections:
-- SELECT election_id, LOWER(email) as email, COUNT(*) 
-- FROM public.voters 
-- WHERE email IS NOT NULL 
-- GROUP BY election_id, LOWER(email) 
-- HAVING COUNT(*) > 1;

-- Check for duplicate phone numbers within elections:
-- SELECT election_id, phone_number, COUNT(*) 
-- FROM public.voters 
-- WHERE phone_number IS NOT NULL 
-- GROUP BY election_id, phone_number 
-- HAVING COUNT(*) > 1;

-- Check for duplicate names within elections:
-- SELECT election_id, LOWER(name) as name, COUNT(*) 
-- FROM public.voters 
-- GROUP BY election_id, LOWER(name) 
-- HAVING COUNT(*) > 1;

-- Step 2: Create unique partial indexes to prevent future duplicates
-- These indexes will only affect new inserts/updates, not existing data

-- Prevent duplicate emails within the same election (case-insensitive)
-- This will only index non-null email values
CREATE UNIQUE INDEX IF NOT EXISTS idx_voters_unique_email_per_election 
    ON public.voters(election_id, LOWER(email)) 
    WHERE email IS NOT NULL;

-- Prevent duplicate phone numbers within the same election
-- This will only index non-null phone_number values
CREATE UNIQUE INDEX IF NOT EXISTS idx_voters_unique_phone_per_election 
    ON public.voters(election_id, phone_number) 
    WHERE phone_number IS NOT NULL;

-- Prevent duplicate names within the same election (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_voters_unique_name_per_election 
    ON public.voters(election_id, LOWER(name));

-- Step 3: Verify the indexes were created
-- Run this to confirm:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'voters' 
-- AND indexname LIKE 'idx_voters_unique%';

-- Note: If the CREATE INDEX commands fail, it means you have duplicate data
-- In that case, you need to clean up duplicates first before adding constraints
-- Use the queries in Step 1 to identify duplicates, then delete or merge them manually

-- Migration complete!
-- The database now enforces uniqueness for email, phone, and name per election.
