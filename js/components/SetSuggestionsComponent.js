/**
 * Component responsible for handling set suggestions and initial search
 */
export class SetSuggestionsComponent {
    constructor(searchManager) {
        this.searchManager = searchManager;
        this.sets = [];
    }

    /**
     * Initialize set suggestions
     */
    async initializeSetSuggestions() {
        try {
            const response = await fetch('https://api.pokemontcg.io/v2/sets');
            const data = await response.json();
            this.sets = data.data || [];
            this.createSetSuggestions(this.sets);
        } catch (error) {
            console.error('Error fetching sets:', error);
        }
    }

    /**
     * Create set suggestions dropdown
     */
    createSetSuggestions(sets) {
        const searchInput = document.getElementById('search-input');
        if (!searchInput) return;

        // Create datalist for set suggestions
        let datalist = document.getElementById('set-suggestions');
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = 'set-suggestions';
            searchInput.parentNode.appendChild(datalist);
        }

        // Clear existing options
        datalist.innerHTML = '';

        // Add set options
        sets.forEach(set => {
            const option = document.createElement('option');
            option.value = `@${set.name}`;
            option.textContent = `${set.name} (${set.series})`;
            datalist.appendChild(option);
        });

        // Add datalist to search input
        searchInput.setAttribute('list', 'set-suggestions');
    }

    /**
     * Perform initial base set search
     */
    async initialBaseSetSearch() {
        try {
            // Search for some popular cards to populate initial results
            const cards = await this.searchManager.searchCards('pikachu', {});
            if (cards && cards.length > 0) {
                // Trigger display of results (this would be handled by the main DeckBuilder)
                console.log('Initial search completed with', cards.length, 'cards');
            }
        } catch (error) {
            console.error('Error in initial search:', error);
        }
    }

    /**
     * Get all available sets
     */
    getSets() {
        return this.sets;
    }

    /**
     * Find a set by name
     */
    findSetByName(name) {
        return this.sets.find(set => 
            set.name.toLowerCase().includes(name.toLowerCase()) ||
            set.series.toLowerCase().includes(name.toLowerCase())
        );
    }

    /**
     * Get recent sets (last 10)
     */
    getRecentSets() {
        return this.sets
            .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
            .slice(0, 10);
    }

    /**
     * Get sets by series
     */
    getSetsBySeries(series) {
        return this.sets.filter(set => 
            set.series.toLowerCase() === series.toLowerCase()
        );
    }
} 