import { create } from 'zustand'

interface AppState {
  sidebarOpen: boolean
  searchQuery: string
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  searchQuery: '',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))
