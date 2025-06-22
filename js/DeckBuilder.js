import { CardManager } from './CardManager.js';
import { SearchManager } from './SearchManager.js';
import { DeckDisplayManager } from './DeckDisplayManager.js';
import { ExportImportManager } from './ExportImportManager.js';
import { GameManager } from './GameManager.js';
import { MultiDeckManager } from './MultiDeckManager.js';
import { Utils } from './utils.js';

/**
 * Main DeckBuilder class that orchestrates all functionality
 */
export class DeckBuilder {
    constructor() {
        // Initialize managers
        this.cardManager = new CardManager();
        this.searchManager = new SearchManager();
        this.deckDisplayManager = new DeckDisplayManager(this.cardManager);
        this.exportImportManager = new ExportImportManager();
        this.gameManager = new GameManager(this.cardManager);
        this.multiDeckManager = new MultiDeckManager(this.cardManager);
        
        // Initialize UI state
        this.showPrices = true;
        
        // Initialize DOM elements and event listeners
        this.initializeElements();
        this.setupEventListeners();
        this.setupCallbacks();
        
        // Initialize set suggestions and initial search
        this.initializeSetSuggestions();
        this.initialBaseSetSearch();
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
        this.priceToggle = document.getElementById('price-toggle');
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
        const cardTypeSelector = document.getElementById('card-type-selector');
        if (cardTypeSelector) {
            cardTypeSelector.addEventListener('change', () => this.updateSelectorVisibility());
        }
        
        // Price sort selector
        if (this.priceSortSelector) {
            this.priceSortSelector.addEventListener('change', () => {
                if (this.searchResults && this.searchResults.children.length > 0) {
                    this.sortAndDisplayResults();
                }
            });
        }
        
        // Undo button
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undoCardRemoval());
        }
        
        // Sort button
        const sortBtn = document.getElementById('sortBtn');
        if (sortBtn) {
            sortBtn.addEventListener('click', () => this.sortDeck());
        }
        
        // Price toggle
        if (this.priceToggle) {
            this.priceToggle.addEventListener('change', () => {
                this.showPrices = this.priceToggle.checked;
                this.deckDisplayManager.setPriceVisibility(this.showPrices);
            });
        }
        
        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportImportManager.showExportModal());
        }
        
        // Import button
        const importBtn = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importDeck());
        }
        
        // Open in Table button
        const openInTableBtn = document.getElementById('openInTableBtn');
        if (openInTableBtn) {
            openInTableBtn.addEventListener('click', () => this.openDeckInTable());
        }
        
        // Clear button
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearDeck());
        }
        
        // Scroll event for infinite scrolling
        window.addEventListener('scroll', () => {
            if (this.searchManager.isLoadingResults() || !this.searchManager.hasMoreResultsAvailable()) return;

            const scrollPosition = window.innerHeight + window.scrollY;
            const scrollThreshold = document.documentElement.scrollHeight - 200;

            if (scrollPosition >= scrollThreshold) {
                this.loadMoreCards();
            }
        });
    }

    /**
     * Setup callbacks between managers
     */
    setupCallbacks() {
        // Set up card operation callbacks
        this.deckDisplayManager.setCardDecreaseCallback((card) => this.decreaseCardQuantity(card));
        this.deckDisplayManager.setCardIncreaseCallback((card) => this.increaseCardQuantity(card));
        
        // Set up export callbacks
        this.exportImportManager.exportQRData = (deck) => this.exportImportManager.exportQRData(this.cardManager.deck);
        this.exportImportManager.exportFullData = (deck) => this.exportImportManager.exportFullData(this.cardManager.deck);
    }

    /**
     * Update selector visibility based on card type
     */
    updateSelectorVisibility() {
        const cardTypeSelector = document.getElementById('card-type-selector');
        if (!cardTypeSelector) return;
        
        const selectedType = cardTypeSelector.value;
        
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
        // Always allow search, even if query and filters are empty
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
            const filters = this.getSearchFilters();
            const cards = await this.searchManager.loadMoreCards(filters);
            this.displaySearchResults(cards, true);
        } catch (error) {
            console.error('Error loading more cards:', error);
        }
    }

    /**
     * Get current search filters
     * @returns {Object} Search filters
     */
    getSearchFilters() {
        const cardTypeSelector = document.getElementById('card-type-selector');
        const selectedType = cardTypeSelector ? cardTypeSelector.value : '';
        const tcgTypeFilter = document.getElementById('tcg-type-filter');
        const selectedTCGType = tcgTypeFilter ? tcgTypeFilter.value : '';
        
        const filters = {
            cardType: selectedType,
            priceSort: this.priceSortSelector ? this.priceSortSelector.value : ''
        };
        
        if (selectedType === 'trainer' && this.trainerSubtypeSelector) {
            filters.trainerSubtype = this.trainerSubtypeSelector.value;
        }
        
        if (selectedType === 'pokemon') {
            if (this.pokemonTypeSelector) {
                filters.pokemonType = this.pokemonTypeSelector.value;
            }
            if (this.pokemonStageSelector) {
                filters.pokemonStage = this.pokemonStageSelector.value;
            }
        }
        
        if (selectedTCGType) {
            filters.tcgType = selectedTCGType;
        }
        
        return filters;
    }

    /**
     * Display search results
     * @param {Array} cards - Array of card objects
     * @param {boolean} append - Whether to append to existing results
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

        // Sort results if price sort is active
        if (this.priceSortSelector && this.priceSortSelector.value) {
            this.sortAndDisplayResults();
        }
    }

    /**
     * Create a search result card element
     * @param {Object} card - The card object
     * @returns {HTMLElement} Card element
     */
    createSearchResultCard(card) {
        const cardElement = this.deckDisplayManager.createCardElement(card, 1, {
            onDecrease: (card) => this.decreaseCardQuantity(card),
            onIncrease: (card) => this.increaseCardQuantity(card)
        });
        
        // Add status box for search results
        const statusBox = document.createElement('div');
        statusBox.className = 'status-box not-in-deck';
        statusBox.textContent = '❌';
        cardElement.appendChild(statusBox);
        
        // Update status based on current deck
        this.updateCardStatus(card);
        
        return cardElement;
    }

    /**
     * Update card status in search results
     * @param {Object} card - The card to update
     */
    updateCardStatus(card) {
        const isInDeck = this.cardManager.isCardInDeck(card);
        this.deckDisplayManager.updateCardStatusInSearchResults(card, isInDeck);
    }

    /**
     * Sort and display search results
     */
    sortAndDisplayResults() {
        if (!this.searchResults || !this.priceSortSelector) return;
        
        const sortOrder = this.priceSortSelector.value;
        const sortedCards = this.searchManager.sortResultsByPrice(this.searchResults.children, sortOrder);
        
        // Clear and re-add cards in sorted order
        const nonCardElements = Array.from(this.searchResults.children)
            .filter(el => !el.classList.contains('card'));
        
        this.searchResults.innerHTML = '';
        nonCardElements.forEach(el => this.searchResults.appendChild(el));
        sortedCards.forEach(element => this.searchResults.appendChild(element));
    }

    /**
     * Increase card quantity
     * @param {Object} card - The card to add
     */
    increaseCardQuantity(card) {
        this.cardManager.addCard(card);
        this.updateDeckDisplay();
        this.updateCardStatus(card);
    }

    /**
     * Decrease card quantity
     * @param {Object} card - The card to remove
     */
    decreaseCardQuantity(card) {
        const wasRemoved = this.cardManager.removeLastInstanceOfCard(card);
        if (wasRemoved) {
            this.updateDeckDisplay();
            this.updateCardStatus(card);
            this.updateUndoButton();
        }
    }

    /**
     * Undo last card removal
     */
    undoCardRemoval() {
        const restoredCard = this.cardManager.restoreLastRemovedCard();
        if (restoredCard) {
            this.updateDeckDisplay();
            this.updateCardStatus(restoredCard);
            this.updateUndoButton();
        }
    }

    /**
     * Update deck display
     */
    updateDeckDisplay() {
        this.deckDisplayManager.updateDeckDisplay();
        this.deckDisplayManager.updateCounters();
        this.deckDisplayManager.updateSortButtonVisibility();
    }

    /**
     * Update undo button visibility
     */
    updateUndoButton() {
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
            undoBtn.style.display = this.cardManager.getRemovedCardsCount() > 0 ? 'block' : 'none';
        }
    }

    /**
     * Sort the deck
     */
    sortDeck() {
        this.cardManager.sortDeck();
        this.updateDeckDisplay();
    }

    /**
     * Clear the deck
     */
    clearDeck() {
        if (confirm('Are you sure you want to clear your deck? This action cannot be undone.')) {
            this.cardManager.clearDeck();
            this.updateDeckDisplay();
            this.deckDisplayManager.resetAllCardStatus();
        }
    }

    /**
     * Import deck from file
     */
    importDeck() {
        this.exportImportManager.importDeck((cards, deckName) => {
            this.cardManager.replaceDeck(cards);
            this.updateDeckDisplay();
            this.deckDisplayManager.resetAllCardStatus();
        });
    }

    /**
     * Open deck in Table
     */
    openDeckInTable() {
        const deck = this.cardManager.deck;
        
        if (deck.length === 0) {
            alert('Your deck is empty. Please add some cards before opening in Table.');
            return;
        }

        try {
            // Convert deck to Table format
            const tableDeck = deck.map(card => ({
                front_image_url: card.images?.small || card.images?.large || '',
                name: card.name || 'Unknown Card'
            }));

            // Filter out cards without images
            const validCards = tableDeck.filter(card => card.front_image_url);
            
            if (validCards.length === 0) {
                alert('No cards with valid images found in your deck. Please add cards with images before opening in Table.');
                return;
            }

            // Create deck object with back image URL at deck level
            const deckForTable = {
                cards: validCards,
                back_image_url: 'https://images.pokemontcg.io/cardback.png' // Standard Pokémon card back
            };

            // Encode deck for Table URL
            const json = JSON.stringify(deckForTable);
            const base64 = btoa(json)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
            
            // Check URL length for very large decks
            const tableUrl = `https://table.c0di.com?deck=${base64}`;
            if (tableUrl.length > 20000) {
                const proceed = confirm(`Your deck is very large (${validCards.length} cards). The URL will be ${Math.round(tableUrl.length / 1000)}KB long. This might cause issues in some browsers. Do you want to proceed anyway?`);
                if (!proceed) {
                    return;
                }
            }
            
            // Open in Table
            window.open(tableUrl, '_blank');
            
        } catch (error) {
            console.error('Error opening deck in Table:', error);
            alert('An error occurred while preparing your deck for Table. Please try again.');
        }
    }

    /**
     * Initialize set suggestions
     */
    async initializeSetSuggestions() {
        try {
            const sets = await this.searchManager.getAllSets();
            this.createSetSuggestions(sets);
        } catch (error) {
            console.error('Error loading set suggestions:', error);
        }
    }

    /**
     * Create set suggestions datalist
     * @param {Array} sets - Array of set objects
     */
    createSetSuggestions(sets) {
        const datalist = document.createElement('datalist');
        datalist.id = 'set-suggestions';
        
        sets.forEach(set => {
            // Add set ID suggestion
            const idOption = document.createElement('option');
            idOption.value = `#${set.id}`;
            idOption.label = `${set.name} (${set.series}) - ID Search`;
            datalist.appendChild(idOption);
            
            // Add set name suggestion
            const nameOption = document.createElement('option');
            nameOption.value = `@${set.name}`;
            nameOption.label = `${set.series} Series - Name Search`;
            datalist.appendChild(nameOption);
        });
        
        document.body.appendChild(datalist);
        
        if (this.searchInput) {
            this.searchInput.setAttribute('list', 'set-suggestions');
        }
    }

    /**
     * Perform initial base set search
     */
    async initialBaseSetSearch() {
        try {
            const newestSet = await this.searchManager.getNewestSet();
            if (this.searchInput) {
                this.searchInput.value = `#${newestSet.id}`;
            }
            this.searchCards();
        } catch (error) {
            console.error('Error fetching newest set:', error);
            // Fallback to Base Set
            if (this.searchInput) {
                this.searchInput.value = "#base1";
            }
            this.searchCards();
        }
    }

    /**
     * Get the card manager
     * @returns {CardManager} The card manager instance
     */
    getCardManager() {
        return this.cardManager;
    }

    /**
     * Get the search manager
     * @returns {SearchManager} The search manager instance
     */
    getSearchManager() {
        return this.searchManager;
    }

    /**
     * Get the deck display manager
     * @returns {DeckDisplayManager} The deck display manager instance
     */
    getDeckDisplayManager() {
        return this.deckDisplayManager;
    }

    /**
     * Get the export import manager
     * @returns {ExportImportManager} The export import manager instance
     */
    getExportImportManager() {
        return this.exportImportManager;
    }

    /**
     * Get the game manager
     * @returns {GameManager} The game manager instance
     */
    getGameManager() {
        return this.gameManager;
    }

    /**
     * Get the multi deck manager
     * @returns {MultiDeckManager} The multi deck manager instance
     */
    getMultiDeckManager() {
        return this.multiDeckManager;
    }
} 