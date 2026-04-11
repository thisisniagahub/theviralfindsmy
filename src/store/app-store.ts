import { create } from 'zustand'

interface AppState {
  activePage: string
  sidebarOpen: boolean
  searchQuery: string
  setActivePage: (page: string) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  activePage: 'agent-office',
  sidebarOpen: true,
  searchQuery: '',
  setActivePage: (page) => set({ activePage: page }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))
