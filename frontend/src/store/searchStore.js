import { create } from 'zustand';

const useSearchStore = create((set) => ({
    searchQuery: '',
    sortBy: 'default',
    availability: 'all',
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setSortBy: (sortBy) => set({ sortBy }),
    setAvailability: (availability) => set({ availability }),
    resetFilters: () => set({ sortBy: 'default', availability: 'all', searchQuery: '' })
}));

export default useSearchStore;
