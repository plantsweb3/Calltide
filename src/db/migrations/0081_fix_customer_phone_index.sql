-- Drop the old non-partial unique index that blocks soft-deleted customers
-- from re-using their phone number under the same business.
-- The partial index (idx_customers_business_phone) from migration 0070
-- already enforces uniqueness for active customers only (WHERE deleted_at IS NULL).
DROP INDEX IF EXISTS customers_business_phone_idx;
