import { Utils } from '../utils.js';

/**
 * Component responsible for handling search functionality
 */
export class SearchComponent {
    constructor(searchManager, cardManager) {
        this.searchManager = searchManager;
        this.cardManager = cardManager;
        this.searchInput = null;
        this.searchButton = null;
        this.searchResults = null;
        this.trainerSubtypeSelector = null;
        this.pokemonTypeSelector = null;
        this.pokemonStageSelector = null;
        this.priceSortSelector = null;
        this.tcgTypeFilter = null;
        this.cardTypeSelector = null;
        
        this.initializeElements();
        this.setupEventListeners();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.searchInput = document.getElementById('search-input');
        this.searchButton = document.getElementById('search-button');
        this.searchResults = document.getElementById('search-results');
        
        // Set up search input placeholder
        if (this.searchInput) {
            this.searchInput.placeholder = '🔍 Search by name, #set-id, @set-name, $subtype';
        }
        
        // Initialize selectors
        this.trainerSubtypeSelector = document.getElementById('trainer-subtype-selector');
        this.pokemonTypeSelector = document.getElementById('pokemon-type-selector');
        this.pokemonStageSelector = document.getElementById('pokemon-stage-selector');
        this.priceSortSelector = document.getElementById('price-sort-selector');
        this.tcgTypeFilter = document.getElementById('tcg-type-filter');
        this.cardTypeSelector = document.getElementById('card-type-selector');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search functionality
        if (this.searchButton) {
            this.searchButton.addEventListener('click', () => this.searchCards());
        }
        
        if (this.searchInput) {
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && this.searchInput.value.trim()) {
                    this.searchCards();
                }
            });
        }
        
        // Card type selector
        if (this.cardTypeSelector) {
            this.cardTypeSelector.addEventListener('change', () => this.updateSelectorVisibility());
        }
        
        // Price sort selector
        if (this.priceSortSelector) {
            this.priceSortSelector.addEventListener('change', () => {
                if (this.searchResults && this.searchResults.children.length > 0) {
                    this.sortAndDisplayResults();
                }
            });
        }
    }

    /**
     * Update selector visibility based on card type
     */
    updateSelectorVisibility() {
        if (!this.cardTypeSelector) return;
        
        const selectedType = this.cardTypeSelector.value;
        
        if (this.trainerSubtypeSelector) {
            this.trainerSubtypeSelector.style.display = selectedType === 'trainer' ? 'block' : 'none';
        }
        if (this.pokemonTypeSelector) {
            this.pokemonTypeSelector.style.display = selectedType === 'pokemon' ? 'block' : 'none';
        }
        if (this.pokemonStageSelector) {
            this.pokemonStageSelector.style.display = selectedType === 'pokemon' ? 'block' : 'none';
        }
    }

    /**
     * Search for cards
     */
    async searchCards() {
        const query = this.searchInput.value.trim();
        const filters = this.getSearchFilters();
        
        try {
            const cards = await this.searchManager.searchCards(query, filters);
            this.displaySearchResults(cards, false);
        } catch (error) {
            console.error('Error searching cards:', error);
            if (this.searchResults) {
                this.searchResults.innerHTML = '<div class="error-message">An error occurred while searching for cards. Please try again.</div>';
            }
        }
    }

    /**
     * Load more cards for infinite scrolling
     */
    async loadMoreCards() {
        try {
            const cards = await this.searchManager.loadMoreCards();
            this.displaySearchResults(cards, true);
        } catch (error) {
            console.error('Error loading more cards:', error);
        }
    }

    /**
     * Get search filters from all selectors
     */
    getSearchFilters() {
        const filters = {};
        
        if (this.cardTypeSelector && this.cardTypeSelector.value) {
            filters.cardType = this.cardTypeSelector.value;
        }
        
        if (this.trainerSubtypeSelector && this.trainerSubtypeSelector.value) {
            filters.trainerSubtype = this.trainerSubtypeSelector.value;
        }
        
        if (this.pokemonTypeSelector && this.pokemonTypeSelector.value) {
            filters.pokemonType = this.pokemonTypeSelector.value;
        }
        
        if (this.pokemonStageSelector && this.pokemonStageSelector.value) {
            filters.pokemonStage = this.pokemonStageSelector.value;
        }
        
        if (this.tcgTypeFilter && this.tcgTypeFilter.value) {
            filters.tcgType = this.tcgTypeFilter.value;
        }
        
        return filters;
    }

    /**
     * Display search results
     */
    displaySearchResults(cards, append = false) {
        if (!this.searchResults) return;
        
        if (!append) {
            this.searchResults.innerHTML = '';
        }
        
        cards.forEach(card => {
            const cardElement = this.createSearchResultCard(card);
            this.searchResults.appendChild(cardElement);
        });
    }

    /**
     * Create a search result card element
     */
    createSearchResultCard(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        
        // Create image element
        const img = document.createElement('img');
        img.src = card.images?.small || card.images?.large || '';
        img.alt = card.name;
        img.loading = 'lazy';
        
        // Add buttons for quantity control and TCGPlayer
        const buttonsHTML = `
            <div class="card-buttons">
                <button class="card-button increase-button" title="Add to deck">➕</button>
                <button class="card-button tcgplayer-button" title="View on TCGPlayer">💰</button>
            </div>
        `;

        cardDiv.innerHTML = buttonsHTML;
        cardDiv.insertBefore(img, cardDiv.firstChild);

        // Add event listeners
        this.addSearchCardEventListeners(cardDiv, card);

        return cardDiv;
    }

    /**
     * Add event listeners to search result cards
     * @param {HTMLElement} cardElement - The card element
     * @param {Object} card - The card object
     */
    addSearchCardEventListeners(cardElement, card) {
        // Card click for zoom
        cardElement.addEventListener('click', (e) => {
            if (!e.target.closest('.card-button')) {
                // Trigger card modal (this would be handled by the main DeckBuilder)
                if (window.deckBuilder && window.deckBuilder.getDeckDisplayManager) {
                    const modalComponent = window.deckBuilder.getDeckDisplayManager().getCardModalComponent();
                    if (modalComponent) {
                        modalComponent.showCardModal(card);
                    }
                }
            }
        });

        // Increase button (add to deck)
        const increaseButton = cardElement.querySelector('.increase-button');
        if (increaseButton) {
            increaseButton.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.cardManager) {
                    this.cardManager.addCard(card);
                    // Trigger deck display update
                    if (window.deckBuilder && window.deckBuilder.refreshDisplays) {
                        window.deckBuilder.refreshDisplays();
                    }
                }
            });
        }

        // TCGPlayer button
        const tcgPlayerButton = cardElement.querySelector('.tcgplayer-button');
        if (tcgPlayerButton) {
            tcgPlayerButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const searchQuery = encodeURIComponent(card.name);
                window.open(`https://www.tcgplayer.com/search/all/product?q=${searchQuery}`, '_blank');
            });
        }
    }

    /**
     * Sort and display results based on price
     */
    sortAndDisplayResults() {
        if (!this.priceSortSelector || !this.searchResults) return;
        
        const sortOrder = this.priceSortSelector.value;
        if (!sortOrder) return;
        
        const cards = Array.from(this.searchResults.children).map(cardDiv => {
            const cardData = this.extractCardDataFromElement(cardDiv);
            return { element: cardDiv, card: cardData };
        });
        
        cards.sort((a, b) => {
            const priceA = Utils.getCardPriceData(a.card).price || 0;
            const priceB = Utils.getCardPriceData(b.card).price || 0;
            
            return sortOrder === 'low' ? priceA - priceB : priceB - priceA;
        });
        
        this.searchResults.innerHTML = '';
        cards.forEach(({ element }) => {
            this.searchResults.appendChild(element);
        });
    }

    /**
     * Extract card data from DOM element
     */
    extractCardDataFromElement(cardDiv) {
        // This is a simplified version - in a real implementation,
        // you'd want to store the card data as a data attribute
        const img = cardDiv.querySelector('img');
        const name = img?.alt || '';
        return { name };
    }

    /**
     * Get search input value
     */
    getSearchQuery() {
        return this.searchInput ? this.searchInput.value.trim() : '';
    }

    /**
     * Set search input value
     */
    setSearchQuery(query) {
        if (this.searchInput) {
            this.searchInput.value = query;
        }
    }

    /**
     * Clear search results
     */
    clearSearchResults() {
        if (this.searchResults) {
            this.searchResults.innerHTML = '';
        }
    }
} 