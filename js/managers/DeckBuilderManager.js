import { CardManager } from './CardManager.js';
import { SearchManager } from './SearchManager.js';
import { DeckDisplayManager } from './DeckDisplayManager.js';
import { ExportImportManager } from './ExportImportManager.js';
import { GameManager } from './GameManager.js';
import { MultiDeckManager } from './MultiDeckManager.js';
import { SearchComponent } from '../components/SearchComponent.js';
import { DeckControlsComponent } from '../components/DeckControlsComponent.js';
import { SetSuggestionsComponent } from '../components/SetSuggestionsComponent.js';

/**
 * Main DeckBuilder manager that orchestrates all functionality
 */
export class DeckBuilderManager {
    constructor() {
        // Initialize managers
        this.cardManager = new CardManager();
        this.searchManager = new SearchManager();
        this.deckDisplayManager = new DeckDisplayManager(this.cardManager);
        this.exportImportManager = new ExportImportManager();
        this.gameManager = new GameManager(this.cardManager);
        this.multiDeckManager = new MultiDeckManager(this.cardManager, this);
        
        // Initialize components
        this.searchComponent = new SearchComponent(this.searchManager, this.cardManager);
        this.deckControlsComponent = new DeckControlsComponent(
            this.cardManager, 
            this.deckDisplayManager, 
            this.exportImportManager
        );
        this.setSuggestionsComponent = new SetSuggestionsComponent(this.searchManager);
        
        // Setup callbacks and event listeners
        this.setupCallbacks();
        this.setupScrollListener();
        
        // Initialize set suggestions and initial search
        this.initializeSetSuggestions();
        this.initialBaseSetSearch();
    }

    /**
     * Setup callbacks between managers
     */
    setupCallbacks() {
        // Set up card operation callbacks
        this.deckDisplayManager.setCardDecreaseCallback((card) => this.decreaseCardQuantity(card));
        this.deckDisplayManager.setCardIncreaseCallback((card) => this.increaseCardQuantity(card));
        
        // Set up export callbacks - pass the deck data to the export manager
        this.exportImportManager.setDeckData(() => this.cardManager.deck);
    }

    /**
     * Setup scroll event for infinite scrolling
     */
    setupScrollListener() {
        window.addEventListener('scroll', () => {
            if (this.searchManager.isLoadingResults() || !this.searchManager.hasMoreResultsAvailable()) return;

            const scrollPosition = window.innerHeight + window.scrollY;
            const scrollThreshold = document.documentElement.scrollHeight - 200;

            if (scrollPosition >= scrollThreshold) {
                this.searchComponent.loadMoreCards();
            }
        });
    }

    /**
     * Initialize set suggestions
     */
    async initializeSetSuggestions() {
        await this.setSuggestionsComponent.initializeSetSuggestions();
    }

    /**
     * Perform initial base set search
     */
    async initialBaseSetSearch() {
        try {
            // Search for some popular cards to populate initial results
            const cards = await this.searchManager.searchCards('pikachu', {});
            if (cards && cards.length > 0) {
                // Display the results using the search component
                this.searchComponent.displaySearchResults(cards, false);
                console.log('Initial search completed with', cards.length, 'cards');
            }
        } catch (error) {
            console.error('Error in initial search:', error);
        }
    }

    /**
     * Increase card quantity in deck
     */
    increaseCardQuantity(card) {
        this.cardManager.addCard(card);
        this.deckDisplayManager.updateDisplay();
        this.deckControlsComponent.updateStats();
        this.deckControlsComponent.updateUndoButton();
        this.deckDisplayManager.updateSortButtonVisibility();
    }

    /**
     * Decrease card quantity in deck
     */
    decreaseCardQuantity(card) {
        const removed = this.cardManager.removeLastInstanceOfCard(card);
        if (removed) {
            this.deckDisplayManager.updateDisplay();
            this.deckControlsComponent.updateStats();
            this.deckControlsComponent.updateUndoButton();
            this.deckDisplayManager.updateSortButtonVisibility();
        }
    }

    /**
     * Update card status in search results
     */
    updateCardStatus(card) {
        const isInDeck = this.cardManager.isCardInDeck(card);
        const count = this.cardManager.getCardCount(card);
        
        // This would update the visual status of cards in search results
        // Implementation would depend on how search results are displayed
        return { isInDeck, count };
    }

    /**
     * Get card manager
     */
    getCardManager() {
        return this.cardManager;
    }

    /**
     * Get search manager
     */
    getSearchManager() {
        return this.searchManager;
    }

    /**
     * Get deck display manager
     */
    getDeckDisplayManager() {
        return this.deckDisplayManager;
    }

    /**
     * Get export import manager
     */
    getExportImportManager() {
        return this.exportImportManager;
    }

    /**
     * Get game manager
     */
    getGameManager() {
        return this.gameManager;
    }

    /**
     * Get multi deck manager
     */
    getMultiDeckManager() {
        return this.multiDeckManager;
    }

    /**
     * Get search component
     */
    getSearchComponent() {
        return this.searchComponent;
    }

    /**
     * Get deck controls component
     */
    getDeckControlsComponent() {
        return this.deckControlsComponent;
    }

    /**
     * Get set suggestions component
     */
    getSetSuggestionsComponent() {
        return this.setSuggestionsComponent;
    }

    /**
     * Refresh all displays
     */
    refreshDisplays() {
        this.deckDisplayManager.updateDisplay();
        this.deckControlsComponent.updateStats();
        this.deckControlsComponent.updateUndoButton();
        this.deckDisplayManager.updateSortButtonVisibility();
    }

    /**
     * Reset the application state
     */
    reset() {
        this.cardManager.clearDeck();
        this.searchComponent.clearSearchResults();
        this.refreshDisplays();
    }
} 