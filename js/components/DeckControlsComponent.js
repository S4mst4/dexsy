import { Utils } from '../utils.js';

/**
 * Component responsible for handling deck controls functionality
 */
export class DeckControlsComponent {
    constructor(cardManager, deckDisplayManager, exportImportManager) {
        this.cardManager = cardManager;
        this.deckDisplayManager = deckDisplayManager;
        this.exportImportManager = exportImportManager;
        this.priceToggle = null;
        this.showPrices = true;
        
        this.initializeElements();
        this.setupEventListeners();
        this.updateStats();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.priceToggle = document.getElementById('price-toggle');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
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
    }

    /**
     * Update deck statistics display
     */
    updateStats() {
        const stats = this.cardManager.getDeckStats();
        
        const totalCount = document.getElementById('total-count');
        const pokemonCount = document.getElementById('pokemon-count');
        const energyCount = document.getElementById('energy-count');
        const trainerCount = document.getElementById('trainer-count');
        const priceCount = document.getElementById('price-count');
        
        if (totalCount) totalCount.textContent = stats.total;
        if (pokemonCount) pokemonCount.textContent = stats.pokemon;
        if (energyCount) energyCount.textContent = stats.energy;
        if (trainerCount) trainerCount.textContent = stats.trainer;
        if (priceCount) priceCount.textContent = `$${stats.price.toFixed(2)}`;
    }

    /**
     * Update undo button visibility
     */
    updateUndoButton() {
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
            const removedCardsCount = this.cardManager.getRemovedCardsCount();
            undoBtn.style.display = removedCardsCount > 0 ? 'block' : 'none';
        }
    }

    /**
     * Undo last card removal
     */
    undoCardRemoval() {
        const restoredCard = this.cardManager.restoreLastRemovedCard();
        if (restoredCard) {
            this.deckDisplayManager.updateDisplay();
            this.updateStats();
            this.updateUndoButton();
            this.deckDisplayManager.updateSortButtonVisibility();
        }
    }

    /**
     * Sort the deck
     */
    sortDeck() {
        this.cardManager.sortDeck();
        this.deckDisplayManager.updateDisplay();
        this.deckDisplayManager.updateSortButtonVisibility();
    }

    /**
     * Clear the deck
     */
    clearDeck() {
        if (confirm('Are you sure you want to clear the deck?')) {
            this.cardManager.clearDeck();
            this.deckDisplayManager.updateDisplay();
            this.updateStats();
            this.updateUndoButton();
            this.deckDisplayManager.updateSortButtonVisibility();
        }
    }

    /**
     * Import deck from file
     */
    importDeck() {
        this.exportImportManager.importDeck((cardsToImport, deckName) => {
            this.cardManager.replaceDeck(cardsToImport);
            this.deckDisplayManager.updateDisplay();
            this.updateStats();
            this.updateUndoButton();
            this.deckDisplayManager.updateSortButtonVisibility();
        });
    }

    /**
     * Open deck in table.c0di.com
     */
    openDeckInTable() {
        const deck = this.cardManager.deck;
        if (deck.length === 0) {
            alert('No cards in deck to display.');
            return;
        }

        // Format deck for table.c0di.com
        const deckData = this.formatDeckForTableC0di(deck);
        
        // Open table.c0di.com in a new window
        const tableWindow = window.open('https://table.c0di.com', '_blank');
        
        // Wait for the page to load, then try to inject the deck data
        if (tableWindow) {
            // Note: Due to CORS restrictions, we can't directly inject data into table.c0di.com
            // Instead, we'll copy the deck data to clipboard and show instructions
            this.copyDeckToClipboard(deckData);
            
            // Show instructions to the user
            setTimeout(() => {
                alert('Deck JSON data has been copied to your clipboard!\n\n' +
                      '1. Go to table.c0di.com\n' +
                      '2. Click "Import Deck" or paste the JSON data\n' +
                      '3. Your deck will be loaded automatically');
            }, 100);
        }
    }

    /**
     * Format deck data for table.c0di.com
     */
    formatDeckForTableC0di(deck) {
        const cardCounts = {};
        deck.forEach(card => {
            const key = `${card.name}-${card.set?.name || 'Unknown'}`;
            cardCounts[key] = (cardCounts[key] || 0) + 1;
        });

        // Format as a simple array of cards that table.c0di.com expects
        const deckList = [];
        Object.entries(cardCounts).forEach(([key, count]) => {
            const [name, setName] = key.split('-');
            const card = deck.find(c => c.name === name && (c.set?.name || 'Unknown') === setName);
            
            // Add the card count times to the array
            for (let i = 0; i < count; i++) {
                deckList.push({
                    name: name,
                    set: setName,
                    id: card?.id || null,
                    front_image_url: card?.images?.small || card?.images?.large || '',
                    back_image_url: 'https://images.pokemontcg.io/base1/back.png'
                });
            }
        });

        // Return as a simple array of cards (not wrapped in an object)
        return JSON.stringify(deckList, null, 2);
    }

    /**
     * Copy deck data to clipboard
     */
    copyDeckToClipboard(deckData) {
        if (navigator.clipboard && window.isSecureContext) {
            // Use the modern clipboard API
            navigator.clipboard.writeText(deckData).then(() => {
                console.log('Deck data copied to clipboard');
            }).catch(err => {
                console.error('Failed to copy deck data:', err);
                this.fallbackCopyToClipboard(deckData);
            });
        } else {
            // Fallback for older browsers
            this.fallbackCopyToClipboard(deckData);
        }
    }

    /**
     * Fallback method to copy text to clipboard
     */
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            console.log('Deck data copied to clipboard (fallback method)');
        } catch (err) {
            console.error('Failed to copy deck data:', err);
            // If all else fails, show the data in an alert
            alert('Please copy this deck data manually:\n\n' + text);
        }
        
        document.body.removeChild(textArea);
    }

    /**
     * Get price visibility state
     */
    getPriceVisibility() {
        return this.showPrices;
    }

    /**
     * Set price visibility state
     */
    setPriceVisibility(visible) {
        this.showPrices = visible;
        if (this.priceToggle) {
            this.priceToggle.checked = visible;
        }
        this.deckDisplayManager.setPriceVisibility(visible);
    }

    /**
     * Get card price data
     */
    getCardPriceData(card) {
        return Utils.getCardPriceData(card);
    }
} 