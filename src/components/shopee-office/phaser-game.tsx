'use client'

import { useEffect, useRef, useState } from 'react'
import { OfficeToolbar } from './OfficeToolbar'
import * as Phaser from 'phaser'
import { OfficeScene, type AgentData } from './game/scenes/OfficeScene'
import { GAME_WIDTH, GAME_HEIGHT } from './game/config'
import { useStudio } from './lib/store'

export type { AgentData }

export interface PhaserGameProps {
  agents: AgentData[]
  onStatusUpdate?: (agentId: string, status: string) => void
  onAgentSelected?: (agentId: string) => void
  className?: string
}

export default function PhaserGame({ agents, onStatusUpdate, onAgentSelected, className }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const sceneRef = useRef<OfficeScene | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  
  const { state } = useStudio()
  const isWsConnected = state.connection === 'connected'

  const isFullBleed = (className || '').includes('h-full')

  useEffect(() => {
    if (!containerRef.current) return

    let mounted = true

    try {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        parent: containerRef.current,
        transparent: false,
        backgroundColor: '#25262B',
        pixelArt: true,
        antialias: false,
        roundPixels: true,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        physics: {
          default: 'arcade',
          arcade: { gravity: { x: 0, y: 0 }, debug: false }
        },
        scene: OfficeScene,
      }

      const game = new Phaser.Game(config)
      gameRef.current = game

      // Register shared variables
      game.registry.set('fullBleed', isFullBleed)
      game.registry.set('wsConnected', isWsConnected)

      game.events.once('ready', () => {
        const scene = game.scene.getScene('OfficeScene') as OfficeScene
        if (scene) {
          scene.configure({ agents, onStatusUpdate, onAgentSelected })
          sceneRef.current = scene
          scene.events.once('create', () => {
            if (!mounted) return
            setIsLoading(false)
          })
        }
      })

      // Fallback for loading state
      const timeout = setTimeout(() => { if (mounted) setIsLoading(false) }, 5000)

      return () => {
        mounted = false
        clearTimeout(timeout)
        if (sceneRef.current) {
          sceneRef.current.cleanup()
        }
        if (gameRef.current) {
          gameRef.current.destroy(true)
          gameRef.current = null
        }
      }

    } catch (err) {
      if (mounted) {
        console.error('Failed to load Phaser:', err)
        setLoadError('Failed to load game engine.')
        setIsLoading(false)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const scene = sceneRef.current
    if (scene) {
      scene.setWsStatus(isWsConnected)
    }
  }, [isWsConnected])

  useEffect(() => {
    const scene = sceneRef.current
    if (scene?.configure) {
      scene.configure({ agents, onStatusUpdate, onAgentSelected })
    }
  }, [agents, onStatusUpdate, onAgentSelected])

  return (
    <div className={`relative w-full ${className || ''}`}>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#1a1a2e] rounded-lg">
          <div className="relative">
            <span className="text-5xl animate-bounce mb-4 block">🛒</span>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-black/40 rounded-full blur-sm" />
          </div>
          <span className="text-xl font-bold text-white font-mono tracking-widest mt-4">HQ_INITIALIZING...</span>
          <div className="w-48 h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
             <div className="h-full bg-[#FF7020] animate-[shimmer_2s_infinite]" style={{ width: '40%' }} />
          </div>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#1a1a2e] rounded-lg border border-red-500/20">
          <span className="text-red-400 font-mono text-sm uppercase tracking-tighter">{loadError}</span>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-1 text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            RETRY_BOOT_SEQUENCE
          </button>
        </div>
      )}

      {/* Only show toolbar in standalone mode, not in full-bleed Agent Office */}
      {!isLoading && !loadError && !isFullBleed && <OfficeToolbar />}

      <div
        ref={containerRef}
        className={`w-full overflow-hidden ${isFullBleed ? 'h-full' : 'rounded-lg border border-white/10 shadow-2xl'}`}
        style={{ imageRendering: 'pixelated', ...(!isFullBleed ? { aspectRatio: '16/9' } : {}) }}
      />
      
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  )
}
