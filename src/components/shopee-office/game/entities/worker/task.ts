/**
 * Task and status logic for Shopee Office workers.
 * Handles task messages and status transitions.
 */

import type { WorkerStatus } from '../Worker'

export function getRandomTaskMessage(status: WorkerStatus): string {
  const messages: Record<string, string[]> = {
    writing: [
      '✍️ Crafting viral captions...',
      '🔗 Generating affiliate links...',
      '📝 Updating SEO content...',
      '🎨 Optimizing social copy...',
      '📄 Writing product reviews...',
    ],
    researching: [
      '🔍 Analyzing sale trends...',
      '💎 Scouting high-commission items...',
      '📊 Comparing competitor prices...',
      '🔥 Discovering trending tags...',
      '📈 Checking weekly analytics...',
    ],
    syncing: [
      '📡 Syncing with OpenClaw VPS...',
      '⬆️ Uploading conversion data...',
      '💾 Updating link database...',
      '🔄 Refreshing product cache...',
    ],
    executing: [
      '🚀 Deploying redirection links...',
      '⚙️ Running SEO indexing...',
      '💰 Processing payouts...',
      '✅ Finalizing validation...',
    ],
    thinking: [
      '🤔 Planning next campaign...',
      '💡 Brainstorming viral hooks...',
      '🗺️ Mapping user journeys...',
    ],
    collaborating: [
      '🤝 Coordinating with NiagaBot...',
      '💬 Real-time agent sync...',
      '🔄 Sharing research insights...',
    ],
    error: [
      '⚠️ Connection lost to Gateway!',
      '❌ Critical API error encountered.',
      '🛠️ Re-authenticating...',
    ],
    break: [
      '🍵 Quick break...',
      '💤 Recharging batteries...',
      '🍪 Snack time!',
    ]
  }

  const pool = messages[status] || ['Working on tasks...']
  return pool[Math.floor(Math.random() * pool.length)]
}
