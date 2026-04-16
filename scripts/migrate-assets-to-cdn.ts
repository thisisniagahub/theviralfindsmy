/**
 * Migration Script: Asset Paths to CDN URLs
 *
 * This script lists all files in public/shopee-office/, generates a mapping
 * of old local paths to new CDN URLs, and provides instructions for uploading
 * to Cloudflare R2 or BunnyCDN.
 *
 * Usage:
 *   bun run scripts/migrate-assets-to-cdn.ts
 *   bun run scripts/migrate-assets-to-cdn.ts --cdn-url https://cdn.example.com
 *   bun run scripts/migrate-assets-to-cdn.ts --provider r2
 *   bun run scripts/migrate-assets-to-cdn.ts --provider bunny
 *
 * Output: Prints mapping table and upload instructions to stdout.
 */

import { readdirSync, statSync, existsSync, writeFileSync } from 'node:fs'
import { join, extname } from 'node:path'

// ============================================================
// Configuration
// ============================================================

const ASSETS_DIR = 'public/shopee-office'
const OUTPUT_FILE = 'scripts/cdn-mapping.json'

interface AssetFile {
  localPath: string
  cdnUrl: string
  size: number
  mimeType: string
}

interface MigrationResult {
  generatedAt: string
  cdnBaseUrl: string
  provider: string
  totalFiles: number
  totalSize: number
  assets: AssetFile[]
}

// ============================================================
// CLI Argument Parsing
// ============================================================

function parseArgs(): { cdnBaseUrl: string; provider: string; outputMapping: boolean } {
  const args = process.argv.slice(2)
  let cdnBaseUrl = 'https://pub-<account-id>.r2.dev'
  let provider = 'r2'
  let outputMapping = true

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--cdn-url':
        cdnBaseUrl = args[++i] || cdnBaseUrl
        break
      case '--provider':
        provider = args[++i] || provider
        break
      case '--no-output':
        outputMapping = false
        break
      case '--help':
        console.log(`
Usage: bun run scripts/migrate-assets-to-cdn.ts [options]

Options:
  --cdn-url <url>       CDN base URL (default: https://pub-<account-id>.r2.dev)
  --provider <name>     CDN provider: r2 | bunny (default: r2)
  --no-output           Skip writing cdn-mapping.json
  --help                Show this help message
`)
        process.exit(0)
    }
  }

  return { cdnBaseUrl, provider, outputMapping }
}

// ============================================================
// MIME Type Detection
// ============================================================

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
}

function getMimeType(filename: string): string {
  const ext = extname(filename).toLowerCase()
  return MIME_TYPES[ext] || 'application/octet-stream'
}

// ============================================================
// File Listing
// ============================================================

function listFiles(dir: string): string[] {
  if (!existsSync(dir)) {
    console.error(`Error: Directory '${dir}' does not exist`)
    process.exit(1)
  }
  return readdirSync(dir).filter(file => {
    const fullPath = join(dir, file)
    return statSync(fullPath).isFile()
  })
}

// ============================================================
// CDN URL Generation
// ============================================================

function generateCdnUrl(filename: string, baseUrl: string, provider: string): string {
  switch (provider) {
    case 'r2':
      return `${baseUrl}/shopee-office/${filename}`
    case 'bunny':
      return `${baseUrl}/shopee-office/${filename}`
    default:
      return `${baseUrl}/shopee-office/${filename}`
  }
}

// ============================================================
// Upload Instructions
// ============================================================

function printUploadInstructions(files: string[], provider: string, cdnBaseUrl: string) {
  console.log('\n' + '='.repeat(70))
  console.log('  UPLOAD INSTRUCTIONS')
  console.log('='.repeat(70))

  if (provider === 'r2') {
    console.log(`
  Cloudflare R2 Upload Steps:

  1. Install rclone or wrangler CLI:
     npm install -g wrangler

  2. Authenticate with Cloudflare:
     wrangler login

  3. Create an R2 bucket (if not already created):
     wrangler r2 bucket create theviralfinds-assets

  4. Upload all files:
     npx wrangler r2 object put theviralfinds-assets/shopee-office/<filename> --file public/shopee-office/<filename>

     Or use rclone for batch upload:
     rclone copy public/shopee-office r2:theviralfinds-assets/shopee-office

  5. Set CDN_BASE_URL in your .env:
     CDN_BASE_URL=${cdnBaseUrl}

  6. Set up a Custom Domain (optional):
     - Go to R2 > Manage R2.dev Subdomain
     - Or use Cloudflare Pages/Workers for custom domain
`)
  } else if (provider === 'bunny') {
    console.log(`
  BunnyCDN Upload Steps:

  1. Create a Pull Zone in BunnyCDN dashboard:
     - Go to Pull Zones > Add Pull Zone
     - Set Origin URL to your app domain
     - Set Pull Zone URL as your CDN base

  2. Upload files via FTP or API:
     FTP:
       Host: storage.bunnycdn.com
       User: <storage-zone-name>
       Password: <storage-zone-password>
       Path: /shopee-office/

     API:
       curl -X PUT "https://storage.bunnycdn.com/<zone>/shopee-office/<filename>" \\
         -H "AccessKey: <api-key>" \\
         -H "Content-Type: <mime-type>" \\
         --data-binary @public/shopee-office/<filename>

  3. Set CDN_BASE_URL in your .env:
     CDN_BASE_URL=${cdnBaseUrl}

  4. Purge CDN cache after updates:
     curl -X POST "https://api.bunny.net/pullzone/<id>/purge" \\
       -H "AccessKey: <api-key>"
`)
  } else {
    console.log(`
  Generic CDN Upload Steps:

  1. Configure your CDN provider to pull from your origin
  2. Upload files to: <cdn-base-url>/shopee-office/
  3. Set CDN_BASE_URL in your .env:
     CDN_BASE_URL=${cdnBaseUrl}
`)
  }

  console.log('  Files to upload:')
  for (const file of files) {
    const size = statSync(join(ASSETS_DIR, file)).size
    const sizeKB = (size / 1024).toFixed(1)
    console.log(`    - ${file} (${sizeKB} KB)`)
  }
  console.log('='.repeat(70))
}

// ============================================================
// Main
// ============================================================

function main() {
  const { cdnBaseUrl, provider, outputMapping } = parseArgs()

  console.log('='.repeat(70))
  console.log('  Asset CDN Migration Script')
  console.log('='.repeat(70))
  console.log(`  Provider: ${provider.toUpperCase()}`)
  console.log(`  CDN Base URL: ${cdnBaseUrl}`)
  console.log(`  Source: ${ASSETS_DIR}/`)
  console.log('='.repeat(70))

  const files = listFiles(ASSETS_DIR)
  const assets: AssetFile[] = []
  let totalSize = 0

  console.log('\n  Asset Mapping:')
  console.log('  ' + '-'.repeat(66))
  console.log(`  ${'Local Path'.padEnd(45)} | ${'CDN URL'.padEnd(20)}`)
  console.log('  ' + '-'.repeat(66))

  for (const file of files) {
    const localPath = `/shopee-office/${file}`
    const cdnUrl = generateCdnUrl(file, cdnBaseUrl, provider)
    const size = statSync(join(ASSETS_DIR, file)).size
    const mimeType = getMimeType(file)

    assets.push({ localPath, cdnUrl, size, mimeType })
    totalSize += size

    console.log(`  ${localPath.padEnd(45)} | ${cdnUrl}`)
  }

  console.log('  ' + '-'.repeat(66))
  console.log(`\n  Total: ${files.length} files, ${(totalSize / 1024).toFixed(1)} KB`)

  // Write mapping JSON
  if (outputMapping) {
    const result: MigrationResult = {
      generatedAt: new Date().toISOString(),
      cdnBaseUrl,
      provider,
      totalFiles: files.length,
      totalSize,
      assets,
    }

    writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2))
    console.log(`\n  Mapping saved to: ${OUTPUT_FILE}`)
  }

  // Print upload instructions
  printUploadInstructions(files, provider, cdnBaseUrl)

  console.log('\n  Note: After uploading, update your components to use cdnUrl()')
  console.log('  from src/lib/asset-cdn.ts instead of hardcoded paths.')
  console.log('='.repeat(70))
}

main()
