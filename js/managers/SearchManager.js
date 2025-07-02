import { Utils } from '../utils.js';

/**
 * Manages card search functionality including API calls and query building
 */
export class SearchManager {
    constructor() {
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMoreResults = true;
        this.lastSearchQuery = '';
        this.lastPriceSort = '';
        this.apiBaseUrl = 'https://api.pokemontcg.io/v2';
    }

    /**
     * Build search query based on user input and filters
     * @param {string} query - Raw user query
     * @param {Object} filters - Search filters (card type, subtypes, etc.)
     * @returns {string} Formatted search query for API
     */
    buildSearchQuery(query, filters = {}) {
        let searchQuery = '';
        
        // Handle special rarity prefixes
        if (query.startsWith('$V') && !query.includes('$VMAX') && !query.includes('$VSTAR')) {
            return `(name:"*-V" OR name:"* V" OR name:" V " OR subtypes:"V" OR name:" V") -name:"VMAX" -name:"VSTAR"`;
        } 
        else if (query.startsWith('$GX')) {
            return `(name:"*-GX" OR name:"* GX" OR name:" GX " OR subtypes:"GX")`;
        } 
        else if (query.startsWith('$EX')) {
            return `(name:"*-EX" OR name:"* EX" OR name:" EX " OR subtypes:"EX")`;
        } 
        else if (query.startsWith('$VSTAR')) {
            return `(name:"*VSTAR*" OR subtypes:"VSTAR")`;
        } 
        else if (query.startsWith('$VMAX')) {
            return `(name:"*VMAX*" OR subtypes:"VMAX")`;
        } 
        else if (query.startsWith('$Prism')) {
            return `(name:"*♢*" OR name:"* Prism Star" OR subtypes:"Prism Star")`;
        } 
        else if (query.startsWith('$ACESPEC')) {
            return `(name:"*ACE SPEC*" OR subtypes:"ACE SPEC" OR rarity:"ACE SPEC")`;
        }
        // Handle set ID search
        else if (query.startsWith('#')) {
            const setQuery = query.substring(1);
            if (setQuery.match(/^[a-zA-Z0-9]+-\d+$/)) {
                searchQuery = `number:"${setQuery.split('-')[1]}" set.id:"${setQuery.split('-')[0]}"`;
            } else {
                searchQuery = `set.id:"${setQuery}"`;
            }
        }
        // Handle set name search
        else if (query.startsWith('@')) {
            const setQuery = query.substring(1);
            searchQuery = `(set.name:"*${setQuery}*" OR set.series:"*${setQuery}*")`;
        }
        // Default name search
        else {
            const lowerQuery = query.toLowerCase();
            const mentionsSpecial = /\b(ex|gx|vstar|vmax|mega| v)\b/.test(lowerQuery);
            if (!mentionsSpecial) {
                // Include all variants of the Pokémon (regular, full art, EX, GX, V, VSTAR, VMAX)
                searchQuery = `name:"*${query}*"`;
            } else {
                searchQuery = `name:"*${query}*"`;
            }
        }
        
        // Add filters
        searchQuery = this.addFiltersToQuery(searchQuery, filters);
        
        return searchQuery;
    }

    /**
     * Add filter conditions to the search query
     * @param {string} baseQuery - Base search query
     * @param {Object} filters - Filter options
     * @returns {string} Query with filters applied
     */
    addFiltersToQuery(baseQuery, filters) {
        let query = baseQuery;
        
        if (filters.cardType) {
            const supertypeQuery = this.getSupertypeQuery(filters.cardType);
            if (supertypeQuery) {
                query = query ? `${query} AND ${supertypeQuery}` : supertypeQuery;
            }

            // Add subtype filters
            if (filters.cardType === 'trainer' && filters.trainerSubtype) {
                const subtypeQuery = `subtypes:"${filters.trainerSubtype}"`;
                query = query ? `${query} AND ${subtypeQuery}` : subtypeQuery;
            }
            
            if (filters.cardType === 'pokemon') {
                if (filters.pokemonType) {
                    const typeQuery = `types:"${filters.pokemonType}"`;
                    query = query ? `${query} AND ${typeQuery}` : typeQuery;
                }
                
                if (filters.pokemonStage) {
                    const stageQuery = this.getStageQuery(filters.pokemonStage);
                    if (stageQuery) {
                        query = query ? `${query} AND ${stageQuery}` : stageQuery;
                    }
                }
            }
        }
        // Add TCG type filter regardless of cardType
        if (filters.tcgType) {
            const tcgTypeQuery = `types:"${filters.tcgType}"`;
            query = query ? `${query} AND ${tcgTypeQuery}` : tcgTypeQuery;
        }
        
        return query;
    }

    /**
     * Get supertype query for card type filter
     * @param {string} cardType - The card type
     * @returns {string} Supertype query
     */
    getSupertypeQuery(cardType) {
        const supertypeMap = {
            'pokemon': 'supertype:"Pokémon"',
            'trainer': 'supertype:"Trainer"',
            'energy': 'supertype:"Energy"'
        };
        return supertypeMap[cardType] || '';
    }

    /**
     * Get stage query for Pokémon stage filter
     * @param {string} stage - The Pokémon stage
     * @returns {string} Stage query
     */
    getStageQuery(stage) {
        const stageQueries = {
            'V': `(name:"*-V" OR name:"* V" OR name:" V " OR subtypes:"V" OR name:" V") -name:"VMAX" -name:"VSTAR"`,
            'VSTAR': `(name:"*VSTAR*" OR subtypes:"VSTAR")`,
            'VMAX': `(name:"*VMAX*" OR subtypes:"VMAX")`,
            'EX': `(name:"*-EX" OR name:"* EX" OR name:" EX " OR subtypes:"EX")`,
            'GX': `(name:"*-GX" OR name:"* GX" OR name:" GX " OR subtypes:"GX")`
        };
        return stageQueries[stage] || `subtypes:"${stage}"`;
    }

    /**
     * Search for cards using the Pokémon TCG API
     * @param {string} query - Search query
     * @param {Object} filters - Search filters
     * @param {boolean} append - Whether to append to existing results
     * @returns {Promise<Array>} Array of card objects
     */
    async searchCards(query, filters = {}, append = false) {
        if (!append) {
            this.resetPagination();
            this.lastSearchQuery = query;
            this.lastPriceSort = filters.priceSort || '';
        }

        try {
            this.isLoading = true;
            const searchQuery = this.buildSearchQuery(query, filters);
            // Only apply orderBy for empty search (show all cards) or type-only search
            let url = '';
            if (!query && (filters.tcgType || !filters.tcgType)) {
                url = `${this.apiBaseUrl}/cards?q=${searchQuery}&orderBy=-set.releaseDate&page=${this.currentPage}&pageSize=20`;
            } else {
                url = `${this.apiBaseUrl}/cards?q=${searchQuery}&page=${this.currentPage}&pageSize=20`;
            }
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            
            const data = await response.json();
            this.hasMoreResults = data.data.length === 20;
            
            if (!append) {
                this.currentPage = 1;
            }
            let cards = data.data;
            // Custom set order for empty or type-only search
            if (!query && (filters.tcgType || !filters.tcgType)) {
                const setPriority = setId => {
                    if (!setId) return 99;
                    if (setId.startsWith('sv')) return 1;
                    if (setId.startsWith('swsh')) return 2;
                    if (setId.startsWith('sm')) return 3;
                    if (setId.startsWith('xy')) return 4;
                    return 99;
                };
                cards = cards.slice().sort((a, b) => {
                    const aPriority = setPriority(a.set && a.set.id);
                    const bPriority = setPriority(b.set && b.set.id);
                    if (aPriority !== bPriority) return aPriority - bPriority;
                    return 0; // preserve API order within group
                });
            }
            return cards;
        } catch (error) {
            console.error('Error searching cards:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Load more cards for infinite scrolling
     * @param {Object} filters - Search filters
     * @returns {Promise<Array>} Array of additional card objects
     */
    async loadMoreCards(filters = {}) {
        if (this.isLoading || !this.hasMoreResults) return [];

        try {
            this.isLoading = true;
            this.currentPage++;

            const searchQuery = this.buildSearchQuery(this.lastSearchQuery, filters);
            const response = await fetch(
                `${this.apiBaseUrl}/cards?q=${searchQuery}&page=${this.currentPage}&pageSize=20`
            );
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            
            const data = await response.json();
            this.hasMoreResults = data.data.length === 20;
            
            return data.data;
        } catch (error) {
            console.error('Error loading more cards:', error);
            this.currentPage--; // Revert page increment on error
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Get the newest set from the API
     * @returns {Promise<Object>} Newest set object
     */
    async getNewestSet() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/sets`);
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            
            const data = await response.json();
            const sortedSets = data.data.sort((a, b) => 
                new Date(b.releaseDate) - new Date(a.releaseDate)
            );
            
            return sortedSets[0];
        } catch (error) {
            console.error('Error fetching newest set:', error);
            throw error;
        }
    }

    /**
     * Get all sets for suggestions
     * @returns {Promise<Array>} Array of set objects
     */
    async getAllSets() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/sets`);
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            
            const data = await response.json();
            return data.data.sort((a, b) => 
                new Date(b.releaseDate) - new Date(a.releaseDate)
            );
        } catch (error) {
            console.error('Error fetching sets:', error);
            throw error;
        }
    }

    /**
     * Sort search results by price
     * @param {Array} cards - Array of card elements
     * @param {string} sortOrder - Sort order ('low' or 'high')
     * @returns {Array} Sorted array of card elements
     */
    sortResultsByPrice(cards, sortOrder) {
        const cardElements = Array.from(cards)
            .filter(el => el.classList.contains('card'))
            .map(cardEl => ({
                element: cardEl,
                price: parseFloat(cardEl.dataset.price) || 0
            }));

        if (sortOrder === 'low') {
            cardElements.sort((a, b) => a.price - b.price);
        } else if (sortOrder === 'high') {
            cardElements.sort((a, b) => b.price - a.price);
        }

        return cardElements.map(({ element }) => element);
    }

    /**
     * Reset pagination state
     */
    resetPagination() {
        this.currentPage = 1;
        this.hasMoreResults = true;
    }

    /**
     * Check if more results are available
     * @returns {boolean} True if more results can be loaded
     */
    hasMoreResultsAvailable() {
        return this.hasMoreResults && !this.isLoading;
    }

    /**
     * Check if currently loading
     * @returns {boolean} True if a search is in progress
     */
    isLoadingResults() {
        return this.isLoading;
    }

    /**
     * Get current search state
     * @returns {Object} Current search state
     */
    getSearchState() {
        return {
            currentPage: this.currentPage,
            isLoading: this.isLoading,
            hasMoreResults: this.hasMoreResults,
            lastSearchQuery: this.lastSearchQuery,
            lastPriceSort: this.lastPriceSort
        };
    }
} 