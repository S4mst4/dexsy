import { Utils } from '../utils.js';

/**
 * Component responsible for handling individual card display
 */
export class CardDisplayComponent {
    constructor() {
        this.showPrices = true;
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
        `;

        cardElement.innerHTML = buttonsHTML;
        cardElement.insertBefore(img, cardElement.firstChild);
        cardElement.appendChild(countBadge);

        // Add price badge if needed
        if (priceHTML) {
            cardElement.insertAdjacentHTML('beforeend', priceHTML);
        }

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
                if (options.onCardClick) {
                    options.onCardClick(card);
                }
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
     * Open TCGPlayer page for a card
     * @param {Object} card - The card object
     */
    openTCGPlayer(card) {
        const searchQuery = encodeURIComponent(card.name);
        window.open(`https://www.tcgplayer.com/search/all/product?q=${searchQuery}`, '_blank');
    }

    /**
     * Set price visibility
     * @param {boolean} show - Whether to show prices
     */
    setPriceVisibility(show) {
        this.showPrices = show;
    }

    /**
     * Get price visibility state
     * @returns {boolean} Whether prices are shown
     */
    getPriceVisibility() {
        return this.showPrices;
    }

    /**
     * Update price visibility on existing cards
     * @param {HTMLElement} container - Container with cards
     */
    updatePriceVisibility(container) {
        const priceBadges = container.querySelectorAll('.price-badge');
        priceBadges.forEach(badge => {
            badge.style.display = this.showPrices ? 'block' : 'none';
        });
    }
} 