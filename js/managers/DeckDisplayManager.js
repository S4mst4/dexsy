import { CardDisplayComponent } from '../components/CardDisplayComponent.js';
import { CardModalComponent } from '../components/CardModalComponent.js';
import { Utils } from '../utils.js';

/**
 * Manages deck display and UI updates
 */
export class DeckDisplayManager {
    constructor(cardManager) {
        this.cardManager = cardManager;
        this.deckDisplay = null;
        this.counters = {};
        this.cardDisplayComponent = new CardDisplayComponent();
        this.cardModalComponent = new CardModalComponent();
        this.cardDecreaseCallback = null;
        this.cardIncreaseCallback = null;
        
        this.initializeElements();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.deckDisplay = document.getElementById('deck-display');
        this.counters = {
            total: document.getElementById('total-count'),
            pokemon: document.getElementById('pokemon-count'),
            energy: document.getElementById('energy-count'),
            trainer: document.getElementById('trainer-count'),
            price: document.getElementById('price-count')
        };
    }

    /**
     * Update the deck display
     */
    updateDisplay() {
        if (!this.deckDisplay) return;
        
        this.deckDisplay.innerHTML = '';
        
        // Create a map to count duplicate cards and track their first occurrence
        const cardCounts = new Map();
        const firstOccurrence = new Map();
        
        // First pass: count cards and record first occurrence
        this.cardManager.deck.forEach((card, index) => {
            const cardKey = Utils.createCardKey(card);
            cardCounts.set(cardKey, (cardCounts.get(cardKey) || 0) + 1);
            if (!firstOccurrence.has(cardKey)) {
                firstOccurrence.set(cardKey, { card, index });
            }
        });

        // Sort by the original order of first appearance
        const sortedCards = Array.from(firstOccurrence.entries())
            .sort((a, b) => a[1].index - b[1].index);

        // Display cards in their original order
        sortedCards.forEach(([cardKey, { card }]) => {
            const count = cardCounts.get(cardKey);
            const cardElement = this.cardDisplayComponent.createCardElement(card, count, {
                onDecrease: (card) => this.onCardDecrease(card),
                onIncrease: (card) => this.onCardIncrease(card),
                onCardClick: (card) => this.cardModalComponent.showCardModal(card)
            });
            this.deckDisplay.appendChild(cardElement);
        });

        this.updatePriceVisibility();
        this.updateCounters();
        this.updateSortButtonVisibility();
    }

    /**
     * Update deck counters
     */
    updateCounters() {
        const stats = this.cardManager.getDeckStats();

        // Update count displays
        for (const key of ['total', 'pokemon', 'energy', 'trainer']) {
            if (this.counters[key]) {
                this.counters[key].textContent = stats[key];
            }
        }
        
        // Format and update price display
        if (this.counters.price) {
            this.counters.price.textContent = '$' + stats.price.toFixed(2);
        }

        // Show/hide game start button based on deck size
        this.updateGameStartButton();
    }

    /**
     * Update game start button visibility
     */
    updateGameStartButton() {
        const gameStartButton = document.getElementById('gameStartButton');
        if (gameStartButton) {
            const isPlayable = this.cardManager.isDeckPlayable();
            if (isPlayable) {
                gameStartButton.classList.add('visible');
            } else {
                gameStartButton.classList.remove('visible');
            }
        }
    }

    /**
     * Update sort button visibility
     */
    updateSortButtonVisibility() {
        const sortBtn = document.getElementById('sortBtn');
        if (sortBtn) {
            sortBtn.style.display = this.cardManager.getDeckSize() > 0 ? 'block' : 'none';
        }
    }

    /**
     * Update price visibility on all cards
     */
    updatePriceVisibility() {
        if (this.deckDisplay) {
            this.cardDisplayComponent.updatePriceVisibility(this.deckDisplay);
        }
    }

    /**
     * Set price visibility
     * @param {boolean} show - Whether to show prices
     */
    setPriceVisibility(show) {
        this.cardDisplayComponent.setPriceVisibility(show);
        this.updatePriceVisibility();
    }

    /**
     * Update card status in search results
     * @param {Object} card - The card object
     * @param {boolean} isInDeck - Whether the card is in the deck
     */
    updateCardStatusInSearchResults(card, isInDeck) {
        const searchResults = document.getElementById('search-results');
        if (!searchResults) return;

        const cardElements = searchResults.querySelectorAll('.card');
        cardElements.forEach(cardElement => {
            const cardImg = cardElement.querySelector('img');
            if (cardImg && cardImg.alt === card.name) {
                let statusBox = cardElement.querySelector('.status-box');
                
                if (!statusBox) {
                    statusBox = document.createElement('div');
                    statusBox.className = 'status-box';
                    cardElement.appendChild(statusBox);
                }
                
                if (isInDeck) {
                    statusBox.textContent = 'In Deck';
                    statusBox.className = 'status-box in-deck';
                } else {
                    statusBox.textContent = 'Not in Deck';
                    statusBox.className = 'status-box not-in-deck';
                }
            }
        });
    }

    /**
     * Reset all card status indicators
     */
    resetAllCardStatus() {
        const searchResults = document.getElementById('search-results');
        if (!searchResults) return;

        const statusBoxes = searchResults.querySelectorAll('.status-box');
        statusBoxes.forEach(box => {
            box.textContent = 'Not in Deck';
            box.className = 'status-box not-in-deck';
        });
    }

    /**
     * Handle card decrease
     * @param {Object} card - The card object
     */
    onCardDecrease(card) {
        if (this.cardDecreaseCallback) {
            this.cardDecreaseCallback(card);
        }
    }

    /**
     * Handle card increase
     * @param {Object} card - The card object
     */
    onCardIncrease(card) {
        if (this.cardIncreaseCallback) {
            this.cardIncreaseCallback(card);
        }
    }

    /**
     * Set card decrease callback
     * @param {Function} callback - The callback function
     */
    setCardDecreaseCallback(callback) {
        this.cardDecreaseCallback = callback;
    }

    /**
     * Set card increase callback
     * @param {Function} callback - The callback function
     */
    setCardIncreaseCallback(callback) {
        this.cardIncreaseCallback = callback;
    }

    /**
     * Get card display component
     * @returns {CardDisplayComponent} The card display component
     */
    getCardDisplayComponent() {
        return this.cardDisplayComponent;
    }

    /**
     * Get card modal component
     * @returns {CardModalComponent} The card modal component
     */
    getCardModalComponent() {
        return this.cardModalComponent;
    }
} 