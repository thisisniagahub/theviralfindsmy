/**
 * Idle behavior for Shopee Office workers.
 * Handles wandering to POIs, seat activities, and emotes.
 */

import * as Phaser from 'phaser'
import type { WorkerCtx } from '../Worker'
import {
  WANDER_MIN_DELAY,
  WANDER_MAX_DELAY,
  STAGGER_EXTRA_MIN,
  STAGGER_EXTRA_MAX,
  POI_WANDER_CHANCE,
  POI_STAY_MIN,
  POI_STAY_MAX,
  SEAT_ACTIVITIES,
  POI_BUBBLE_TEXTS,
} from '../../config'
import type { POI } from '../../config'
import { navigateTo, navigateHome } from './movement'

const wanderClock = { lastStartedAt: -Infinity }

export function resetWanderClock() {
  wanderClock.lastStartedAt = -Infinity
}

function poiBubbleText(poiName: string): string {
  const lower = poiName.toLowerCase()
  for (const [keyword, texts] of Object.entries(POI_BUBBLE_TEXTS)) {
    if (lower.includes(keyword)) {
      return texts[Math.floor(Math.random() * texts.length)]
    }
  }
  return `At ${poiName}~`
}

export function stopIdleActivity(ctx: WorkerCtx) {
  if (ctx.wanderTimer) {
    ctx.wanderTimer.destroy()
    ctx.wanderTimer = null
  }
  if (ctx.activityTimer) {
    ctx.activityTimer.destroy()
    ctx.activityTimer = null
  }
  ctx.onArrival = null
  ctx.isWandering = false
  ctx.interactionLocked = false
}

export function scheduleWander(ctx: WorkerCtx) {
  stopIdleActivity(ctx)
  if (!ctx.canWander || ctx._status !== 'idle') return

  const delay = Phaser.Math.Between(WANDER_MIN_DELAY, WANDER_MAX_DELAY)
  ctx.wanderTimer = ctx.scene.time.delayedCall(delay, () => {
    tryStartWander(ctx)
  })
}

function tryStartWander(ctx: WorkerCtx) {
  if (!ctx.canWander || ctx._status !== 'idle') return

  const now = ctx.scene.time.now
  const sinceLast = now - wanderClock.lastStartedAt
  if (sinceLast < 1800) {
    const extraDelay = 1800 - sinceLast + Phaser.Math.Between(STAGGER_EXTRA_MIN, STAGGER_EXTRA_MAX)
    ctx.wanderTimer = ctx.scene.time.delayedCall(extraDelay, () => {
      tryStartWander(ctx)
    })
    return
  }

  wanderClock.lastStartedAt = now
  startWander(ctx)
}

function startWander(ctx: WorkerCtx) {
  const goToPoi = ctx.pois.length > 0 && Math.random() < POI_WANDER_CHANCE
  if (goToPoi) {
    wanderToPoi(ctx)
  } else {
    seatActivity(ctx)
  }
}

function wanderToPoi(ctx: WorkerCtx) {
  const poi = Phaser.Utils.Array.GetRandom(ctx.pois) as POI
  ctx.isWandering = true
  ctx.arrivalFacing = poi.facing ?? null

  ctx.onArrival = () => {
    if (ctx._status !== 'idle' || !ctx.canWander) return
    ctx.bubble?.show(poiBubbleText(poi.name), ctx.sprite.x, ctx.sprite.y - 50, POI_STAY_MIN)

    const stayDuration = Phaser.Math.Between(POI_STAY_MIN, POI_STAY_MAX)
    ctx.activityTimer = ctx.scene.time.delayedCall(stayDuration, () => {
      if (ctx._status !== 'idle' || !ctx.canWander) return
      ctx.onArrival = () => {
        ctx.isWandering = false
        scheduleWander(ctx)
      }
      navigateHome(ctx)
      ctx.activityTimer = null
    })
  }

  navigateTo(ctx, poi.x, poi.y, { x: poi.x, y: poi.y })
}

function seatActivity(ctx: WorkerCtx) {
  const def = Phaser.Utils.Array.GetRandom(SEAT_ACTIVITIES) as (typeof SEAT_ACTIVITIES)[number]
  const duration = Phaser.Math.Between(def.minDuration, def.maxDuration)

  // Use spritesheet emote
  const emoteKey = def.emote.replace('emote:', 'emote:') // ensuring prefix matches
  ctx.playEmote?.(emoteKey, duration)
  
  if (def.bubbles.length > 0) {
    ctx.bubble?.show(def.bubbles[0], ctx.sprite.x, ctx.sprite.y - 50, duration)
  }

  ctx.activityTimer = ctx.scene.time.delayedCall(duration, () => {
    if (ctx._status !== 'idle' || !ctx.canWander) return
    scheduleWander(ctx)
    ctx.activityTimer = null
  })
}
