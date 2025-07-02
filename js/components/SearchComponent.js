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
        
        // Sort cards by variant type for better organization
        const sortedCards = cards.sort((a, b) => this.compareCardVariants(a, b));
        
        sortedCards.forEach(card => {
            const cardElement = this.createSearchResultCard(card);
            this.searchResults.appendChild(cardElement);
        });
    }

    /**
     * Compare card variants for sorting
     */
    compareCardVariants(a, b) {
        const variantOrder = {
            'regular': 1,
            'full art': 2,
            'ex': 3,
            'gx': 4,
            'v': 5,
            'vstar': 6,
            'vmax': 7,
            'mega': 8,
            'prism star': 9,
            'ace spec': 10
        };
        
        const getVariantType = (card) => {
            const name = card.name.toLowerCase();
            const subtypes = (card.subtypes || []).map(s => s.toLowerCase());
            
            if (name.includes('vmax')) return 'vmax';
            if (name.includes('vstar')) return 'vstar';
            if (name.includes('gx')) return 'gx';
            if (name.includes('ex')) return 'ex';
            if (name.includes('mega')) return 'mega';
            if (name.includes('prism star') || name.includes('♢')) return 'prism star';
            if (name.includes('ace spec')) return 'ace spec';
            if (name.includes('v') && !name.includes('vmax') && !name.includes('vstar')) return 'v';
            
            // Check for full art variants
            if (subtypes.includes('full art') || name.includes('full art')) return 'full art';
            
            return 'regular';
        };
        
        const variantA = getVariantType(a);
        const variantB = getVariantType(b);
        
        return (variantOrder[variantA] || 999) - (variantOrder[variantB] || 999);
    }

    /**
     * Create a search result card element
     */
    createSearchResultCard(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        
        // Store card data as a data attribute for easy access
        cardDiv.setAttribute('data-card-info', JSON.stringify({
            name: card.name,
            number: card.number,
            setId: card.set?.id,
            images: card.images,
            tcgplayer: card.tcgplayer
        }));
        
        // Create image element
        const img = document.createElement('img');
        img.src = card.images?.small || card.images?.large || '';
        img.alt = card.name;
        img.loading = 'lazy';
        
        // Get price data
        const priceData = Utils.getCardPriceData(card);
        
        // Add buttons for quantity control and TCGPlayer
        const buttonsHTML = `
            <div class="card-buttons">
                <button class="card-button increase-button" title="Add to deck">➕</button>
                <button class="card-button tcgplayer-button" title="View on TCGPlayer">💰</button>
            </div>
        `;

        cardDiv.innerHTML = buttonsHTML;
        cardDiv.insertBefore(img, cardDiv.firstChild);

        // Add price badge if price data is available
        if (priceData.price) {
            const priceBadge = document.createElement('div');
            priceBadge.className = 'price-badge';
            priceBadge.innerHTML = `
                <span class="price-value">$${priceData.price.toFixed(2)}</span>
            `;
            cardDiv.appendChild(priceBadge);
        }

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
        
        // Collect all cards
        const allCards = [];
        const cardElements = Array.from(this.searchResults.querySelectorAll('.card'));
        
        cardElements.forEach(cardDiv => {
            const cardData = this.extractCardDataFromElement(cardDiv);
            allCards.push({ element: cardDiv, card: cardData });
        });
        
        // Sort cards by price
        allCards.sort((a, b) => {
            const priceA = Utils.getCardPriceData(a.card).price || 0;
            const priceB = Utils.getCardPriceData(b.card).price || 0;
            
            return sortOrder === 'low' ? priceA - priceB : priceB - priceA;
        });
        
        // Re-display sorted cards
        this.searchResults.innerHTML = '';
        allCards.forEach(({ element }) => {
            this.searchResults.appendChild(element);
        });
    }

    /**
     * Extract card data from DOM element
     */
    extractCardDataFromElement(cardDiv) {
        try {
            const cardInfo = cardDiv.getAttribute('data-card-info');
            if (cardInfo) {
                return JSON.parse(cardInfo);
            }
        } catch (error) {
            console.error('Error parsing card data:', error);
        }
        
        // Fallback to extracting from image alt text
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