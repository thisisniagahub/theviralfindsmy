-- =============================================================================
-- Database Performance Optimization Migration
-- TheViralFinds Project - Task 15
-- Date: 2026-04-16
-- =============================================================================

/*
 * MIGRATION OVERVIEW:
 * This migration adds performance indexes to support high-frequency queries
 * identified through codebase analysis. All indexes are created CONCURRENTLY
 * to avoid table locking during creation.
 */

-- =============================================================================
-- INDEX 1: idx_links_user_id_created_at
-- =============================================================================

/*
 * RATIONALE:
 * This composite index optimizes the most frequent query pattern in the application:
 * - Dashboard queries fetching user's links ordered by creation date
 * - Link listing pages with pagination (ORDER BY createdAt DESC)
 * - Analytics queries filtering by user and time range
 *
 * QUERY PATTERN SUPPORTED:
 *   SELECT * FROM links WHERE userId = 'xxx' ORDER BY createdAt DESC LIMIT 10;
 *   SELECT * FROM links WHERE userId = 'xxx' AND createdAt > '2024-01-01';
 *
 * INDEX DESIGN:
 * - userId first: High cardinality, equality filter in WHERE clause
 * - createdAt DESC: Supports ORDER BY without sort operation
 * - Composite allows index-only scans for covered queries
 *
 * ESTIMATED SIZE: ~50MB per 1M links
 * WRITE IMPACT: Low - only affects INSERT/UPDATE on userId or createdAt
 */
DROP INDEX IF EXISTS idx_links_user_id_created_at;
CREATE INDEX CONCURRENTLY idx_links_user_id_created_at
    ON "AffiliateLink"(userId, createdAt DESC);

-- =============================================================================
-- INDEX 2: idx_clicks_link_id_timestamp
-- =============================================================================

/*
 * RATIONALE:
 * The ClickRecord table is the highest volume table (time-series data).
 * This index optimizes:
 * - Click analytics by link over time periods
 * - Recent click queries for dashboard charts
 * - Time-series aggregations (daily/weekly clicks)
 *
 * QUERY PATTERN SUPPORTED:
 *   SELECT * FROM clicks WHERE linkId = 'xxx' AND createdAt >= '2024-01-01';
 *   SELECT DATE(createdAt), COUNT(*) FROM clicks WHERE linkId = 'xxx'
 *     GROUP BY DATE(createdAt);
 *
 * INDEX DESIGN:
 * - linkId first: Filters to specific link(s)
 * - createdAt DESC: Time-series ordering for recent data first
 * - Supports range queries on timestamps efficiently
 *
 * ESTIMATED SIZE: ~100MB per 10M clicks (largest index)
 * WRITE IMPACT: Medium - high insert volume table, but essential for reads
 */
DROP INDEX IF EXISTS idx_clicks_link_id_timestamp;
CREATE INDEX CONCURRENTLY idx_clicks_link_id_timestamp
    ON "ClickRecord"(linkId, createdAt DESC);

-- =============================================================================
-- INDEX 3: idx_campaigns_status_dates
-- =============================================================================

/*
 * RATIONALE:
 * Campaign queries frequently filter by status and date ranges to find:
 * - Currently active campaigns (status = 'active' AND now BETWEEN startDate AND endDate)
 * - Campaigns within specific date ranges for reporting
 * - Upcoming/expired campaigns
 *
 * QUERY PATTERN SUPPORTED:
 *   SELECT * FROM campaigns WHERE status = 'active'
 *     AND startDate <= NOW() AND endDate >= NOW();
 *
 * INDEX DESIGN:
 * - status first: Low cardinality, equality filter
 * - startDate: Range filter support
 * - endDate: Range filter support
 *
 * ESTIMATED SIZE: ~5MB (smaller table)
 * WRITE IMPACT: Low - campaign updates are infrequent
 */
DROP INDEX IF EXISTS idx_campaigns_status_dates;
CREATE INDEX CONCURRENTLY idx_campaigns_status_dates
    ON "Campaign"(status, startDate, endDate);

-- =============================================================================
-- INDEX 4: idx_links_active (Partial Index)
-- =============================================================================

/*
 * RATIONALE:
 * Partial index for active links only - the most frequently queried subset.
 * The application constantly queries active links for:
 * - Dashboard active link counts
 * - Redirect endpoint (high traffic)
 * - Active campaign link listings
 *
 * QUERY PATTERN SUPPORTED:
 *   SELECT COUNT(*) FROM links WHERE status = 'active' AND userId = 'xxx';
 *   SELECT * FROM links WHERE status = 'active' ORDER BY createdAt DESC;
 *
 * INDEX DESIGN:
 * - Partial index: Only indexes rows where status = 'active'
 * - Smaller size than full index
 * - Automatically maintained by PostgreSQL
 *
 * ESTIMATED SIZE: ~30% of full index (~15MB per 1M active links)
 * WRITE IMPACT: Very Low - only maintained for active status changes
 */
DROP INDEX IF EXISTS idx_links_active;
CREATE INDEX CONCURRENTLY idx_links_active
    ON "AffiliateLink"(id)
    WHERE status = 'active';

-- =============================================================================
-- ADDITIONAL OPTIMIZATION INDEXES
-- Identified from codebase analysis
-- =============================================================================

-- INDEX 5: idx_conversions_link_date
-- RATIONALE: Conversions are frequently queried by link and filtered by date
DROP INDEX IF EXISTS idx_conversions_link_date;
CREATE INDEX CONCURRENTLY idx_conversions_link_date
    ON "Conversion"(linkId, createdAt DESC);

-- INDEX 6: idx_notifications_user_read_created
-- RATIONALE: Notification queries filter by userId + read status + createdAt
DROP INDEX IF EXISTS idx_notifications_user_read_created;
CREATE INDEX CONCURRENTLY idx_notifications_user_read_created
    ON "Notification"(userId, read, createdAt DESC);

-- INDEX 7: idx_payouts_user_status
-- RATIONALE: Payout queries filter by user and status for summary calculations
DROP INDEX IF EXISTS idx_payouts_user_status;
CREATE INDEX CONCURRENTLY idx_payouts_user_status
    ON "Payout"(userId, status, requestedAt DESC);

-- =============================================================================
-- VERIFICATION QUERIES
-- Run these after migration to verify indexes are created
-- =============================================================================

/*
-- Verify indexes were created:
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check index sizes:
SELECT relname as table_name,
       pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE indexrelname LIKE 'idx_%';

-- Update table statistics for query planner:
ANALYZE "AffiliateLink";
ANALYZE "ClickRecord";
ANALYZE "Campaign";
ANALYZE "Conversion";
ANALYZE "Notification";
ANALYZE "Payout";
*/

-- =============================================================================
-- ROLLBACK SCRIPT (Run if migration needs to be reversed)
-- =============================================================================
/*
DROP INDEX IF EXISTS idx_links_user_id_created_at;
DROP INDEX IF EXISTS idx_clicks_link_id_timestamp;
DROP INDEX IF EXISTS idx_campaigns_status_dates;
DROP INDEX IF EXISTS idx_links_active;
DROP INDEX IF EXISTS idx_conversions_link_date;
DROP INDEX IF EXISTS idx_notifications_user_read_created;
DROP INDEX IF EXISTS idx_payouts_user_status;
*/
