import { create } from 'zustand'

interface AppState {
  sidebarOpen: boolean
  searchQuery: string
  activePage: string
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
  setActivePage: (page: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  searchQuery: '',
  activePage: 'dashboard',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActivePage: (page) => set({ activePage: page }),
}))
