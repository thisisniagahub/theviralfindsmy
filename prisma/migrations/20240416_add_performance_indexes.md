# Database Performance Indexes - Task 15

## Migration: 20240416_add_performance_indexes.sql

### Overview
This migration adds optimized database indexes to improve query performance.

## Indexes Created

### 1. idx_links_user_id_created_at
**Table:** AffiliateLink
**Columns:** userId, createdAt DESC
**Purpose:** Dashboard queries, link listings, analytics by user
**Estimated Size:** ~50MB per 1M links

### 2. idx_clicks_link_id_timestamp
**Table:** ClickRecord
**Columns:** linkId, createdAt DESC
**Purpose:** Time-series analytics for click data
**Estimated Size:** ~100MB per 10M clicks

### 3. idx_campaigns_status_dates
**Table:** Campaign
**Columns:** status, startDate, endDate
**Purpose:** Find active campaigns by date ranges
**Estimated Size:** ~5MB

### 4. idx_links_active (Partial Index)
**Table:** AffiliateLink
**Columns:** id (WHERE status = active)
**Purpose:** Optimizes active link queries
**Estimated Size:** ~15MB per 1M active links

### 5. idx_conversions_link_date
**Table:** Conversion
**Columns:** linkId, createdAt DESC
**Purpose:** Earnings reports

### 6. idx_notifications_user_read_created
**Table:** Notification
**Columns:** userId, read, createdAt DESC
**Purpose:** Notification feed and unread counts

### 7. idx_payouts_user_status
**Table:** Payout
**Columns:** userId, status, requestedAt DESC
**Purpose:** Payout history
