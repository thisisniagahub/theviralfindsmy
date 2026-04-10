export { default as PhaserGame } from './phaser-game'
export type { PhaserGameProps, AgentData } from './phaser-game'
export { LanguageToggle } from './language-toggle'
export type { Language } from './language-toggle'
export { ControlPanel } from './control-panel'
export { AgentsPanel } from './agents-panel'
export type { AgentInfo } from './agents-panel'
export { MemoPanel } from './memo-panel'
export type { MemoData } from './memo-panel'
export { AgentGrid } from './agent-grid'
export type { AgentGridAgent } from './agent-grid'
export { AgentProfile } from './agent-profile'
export type { ProfileAgent } from './agent-profile'

// Game engine modules are NOT exported here to avoid SSR issues.
// Phaser.js requires `window` which doesn't exist on the server.
// These are internal modules used only by phaser-game.tsx via dynamic require().
