import { Utils } from './utils.js';

/**
 * Manages deck display and UI updates
 */
export class DeckDisplayManager {
    constructor(cardManager) {
        this.cardManager = cardManager;
        this.deckDisplay = null;
        this.counters = {};
        this.showPrices = true;
        this.cardBackUrl = 'https://images.pokemontcg.io/cardback.png';
        this.modalOverlay = null;
        this.modalContent = null;
        
        this.initializeElements();
        this.createModalOverlay();
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
     * Create modal overlay for card details
     */
    createModalOverlay() {
        const modalData = Utils.createModalOverlay();
        this.modalOverlay = modalData.overlay;
        this.modalContent = modalData.content;
    }

    /**
     * Create a card element for display
     * @param {Object} card - The card object
     * @param {number} count - Number of copies of this card
     * @param {Object} options - Display options
     * @returns {HTMLElement} Card element
     */
    createCardElement(card, count = 1, options = {}) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        
        // Get price data
        const priceData = Utils.getCardPriceData(card);
        const price = priceData.price || 0;
        cardElement.dataset.price = price;
        
        // Create image element
        const img = document.createElement('img');
        img.src = card.images.small;
        img.alt = card.name;

        // Add count badge
        const countBadge = document.createElement('div');
        countBadge.className = 'card-count';
        countBadge.textContent = `×${count}`;

        // Add price information
        let priceHTML = '';
        if (priceData.price && this.showPrices) {
            priceHTML = `
                <div class="price-badge">
                    <span class="price-value">$${priceData.price.toFixed(2)}</span>
                </div>
            `;
        }

        // Add buttons for quantity control and TCGPlayer
        const buttonsHTML = `
            <div class="card-buttons">
                <button class="card-button decrease-button" title="Decrease quantity">➖</button>
                <button class="card-button increase-button" title="Increase quantity">➕</button>
                <button class="card-button tcgplayer-button" title="View on TCGPlayer">💰</button>
            </div>
            ${priceHTML}
        `;

        cardElement.innerHTML = buttonsHTML;
        cardElement.insertBefore(img, cardElement.firstChild);
        cardElement.appendChild(countBadge);

        // Add event listeners
        this.addCardEventListeners(cardElement, card, options);

        return cardElement;
    }

    /**
     * Add event listeners to a card element
     * @param {HTMLElement} cardElement - The card element
     * @param {Object} card - The card object
     * @param {Object} options - Event options
     */
    addCardEventListeners(cardElement, card, options = {}) {
        // Card click for zoom
        cardElement.addEventListener('click', (e) => {
            if (!e.target.closest('.card-button')) {
                this.showCardModal(card);
            }
        });

        // Decrease button
        const decreaseButton = cardElement.querySelector('.decrease-button');
        if (decreaseButton && options.onDecrease) {
            decreaseButton.addEventListener('click', (e) => {
                e.stopPropagation();
                options.onDecrease(card);
            });
        }

        // Increase button
        const increaseButton = cardElement.querySelector('.increase-button');
        if (increaseButton && options.onIncrease) {
            increaseButton.addEventListener('click', (e) => {
                e.stopPropagation();
                options.onIncrease(card);
            });
        }

        // TCGPlayer button
        const tcgPlayerButton = cardElement.querySelector('.tcgplayer-button');
        if (tcgPlayerButton) {
            tcgPlayerButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openTCGPlayer(card);
            });
        }
    }

    /**
     * Update the deck display
     */
    updateDeckDisplay() {
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
            const cardElement = this.createCardElement(card, count, {
                onDecrease: (card) => this.onCardDecrease(card),
                onIncrease: (card) => this.onCardIncrease(card)
            });
            this.deckDisplay.appendChild(cardElement);
        });

        this.updatePriceVisibility();
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
            if (this.cardManager.isDeckPlayable()) {
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
     * Update price visibility in the deck display
     */
    updatePriceVisibility() {
        const cardElements = this.deckDisplay.querySelectorAll('.card');
        cardElements.forEach(cardElement => {
            const priceBadge = cardElement.querySelector('.price-badge');
            if (priceBadge) {
                priceBadge.style.display = this.showPrices ? 'block' : 'none';
            }
        });
    }

    /**
     * Set price visibility
     * @param {boolean} show - Whether to show prices
     */
    setPriceVisibility(show) {
        this.showPrices = show;
        this.updatePriceVisibility();
    }

    /**
     * Show card details modal
     * @param {Object} card - The card to display
     */
    showCardModal(card) {
        this.modalContent.innerHTML = '';

        const modalDiv = document.createElement('div');
        modalDiv.className = 'card-modal-content';

        // Card Image
        const img = document.createElement('img');
        img.src = card.images.large || card.images.small;
        img.alt = card.name;
        img.className = 'modal-card-image';
        modalDiv.appendChild(img);

        // Details Container
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'modal-card-details';

        // Basic Info
        detailsDiv.innerHTML += `<h2>${card.name} ${card.hp ? '<span class="hp">HP ' + card.hp + '</span>' : ''}</h2>`;
        detailsDiv.innerHTML += `<p><strong>Set:</strong> ${card.set.name} #${card.number}</p>`;
        if (card.rarity) {
            detailsDiv.innerHTML += `<p><strong>Rarity:</strong> ${card.rarity}</p>`;
        }

        // Attacks (if Pokémon)
        if (card.attacks && card.attacks.length > 0) {
            detailsDiv.innerHTML += `<h3>Attacks</h3>`;
            card.attacks.forEach(attack => {
                detailsDiv.innerHTML += `
                    <div class="attack-detail">
                        <p><strong>${attack.name}</strong> ${Utils.renderEnergyCost(attack.cost)} ${attack.damage ? '<span class="damage">' + attack.damage + '</span>' : ''}</p>
                        ${attack.text ? '<p class="attack-text">' + attack.text + '</p>' : ''}
                    </div>
                `;
            });
        }
        
        // Abilities (if any)
        if (card.abilities && card.abilities.length > 0) {
            detailsDiv.innerHTML += `<h3>Abilities</h3>`;
            card.abilities.forEach(ability => {
                detailsDiv.innerHTML += `
                    <div class="ability-detail">
                        <p><strong>${ability.name}</strong> (${ability.type})</p>
                        <p class="ability-text">${ability.text}</p>
                    </div>
                `;
            });
        }

        // Rules (if any)
        if (card.rules && card.rules.length > 0) {
            detailsDiv.innerHTML += `<h3>Rules</h3>`;
            card.rules.forEach(rule => {
                detailsDiv.innerHTML += `<p class="rule-text">${rule}</p>`;
            });
        }

        // Weakness, Resistance, Retreat Cost (if Pokémon)
        if (card.supertype?.toLowerCase() === 'pokemon') {
            detailsDiv.innerHTML += `<div class="stats-grid pokemon-stats">
                <p><strong>Weakness:</strong> ${Utils.renderWeakRes(card.weaknesses)}</p>
                <p><strong>Resistance:</strong> ${Utils.renderWeakRes(card.resistances)}</p>
                <p><strong>Retreat Cost:</strong> ${Utils.renderEnergyCost(card.retreatCost)}</p>
             </div>`;
        }

        modalDiv.appendChild(detailsDiv);
        this.modalContent.appendChild(modalDiv);

        // Show the modal
        this.modalOverlay.classList.add('active');
    }

    /**
     * Open TCGPlayer for a card
     * @param {Object} card - The card to search for
     */
    openTCGPlayer(card) {
        const searchQuery = encodeURIComponent(`${card.name} ${card.set.name}`);
        const tcgPlayerUrl = `https://www.tcgplayer.com/search/pokemon/${card.set.name.toLowerCase()}?q=${searchQuery}&productLineName=pokemon`;
        window.open(tcgPlayerUrl, '_blank');
    }

    /**
     * Update card status in search results
     * @param {Object} card - The card to update
     * @param {boolean} isInDeck - Whether the card is in the deck
     */
    updateCardStatusInSearchResults(card, isInDeck) {
        const searchResults = document.getElementById('search-results');
        if (!searchResults) return;

        const searchResultCards = searchResults.querySelectorAll('.card');
        
        searchResultCards.forEach(cardElement => {
            const imgElement = cardElement.querySelector('img');
            if (!imgElement || imgElement.alt !== card.name) return;
            
            const statusBox = cardElement.querySelector('.status-box');
            if (!statusBox) return;
            
            if (isInDeck) {
                const cardCount = this.cardManager.getCardCount(card);
                statusBox.classList.remove('not-in-deck');
                statusBox.classList.add('in-deck');
                statusBox.innerHTML = `✔<span class="card-count-indicator">${cardCount}</span>`;
            } else {
                statusBox.classList.remove('in-deck');
                statusBox.classList.add('not-in-deck');
                statusBox.textContent = '❌';
            }
        });
    }

    /**
     * Reset all card status indicators in search results
     */
    resetAllCardStatus() {
        const searchResults = document.getElementById('search-results');
        if (!searchResults) return;

        const statusBoxes = searchResults.querySelectorAll('.status-box');
        statusBoxes.forEach(statusBox => {
            statusBox.classList.remove('in-deck');
            statusBox.classList.add('not-in-deck');
            statusBox.innerHTML = '❌';
        });
    }

    /**
     * Handle card decrease event
     * @param {Object} card - The card to decrease
     */
    onCardDecrease(card) {
        // This will be implemented by the main DeckBuilder class
        if (this.onCardDecreaseCallback) {
            this.onCardDecreaseCallback(card);
        }
    }

    /**
     * Handle card increase event
     * @param {Object} card - The card to increase
     */
    onCardIncrease(card) {
        // This will be implemented by the main DeckBuilder class
        if (this.onCardIncreaseCallback) {
            this.onCardIncreaseCallback(card);
        }
    }

    /**
     * Set callback for card decrease events
     * @param {Function} callback - The callback function
     */
    setCardDecreaseCallback(callback) {
        this.onCardDecreaseCallback = callback;
    }

    /**
     * Set callback for card increase events
     * @param {Function} callback - The callback function
     */
    setCardIncreaseCallback(callback) {
        this.onCardIncreaseCallback = callback;
    }
} 