/**
 * Utility functions used across the DeckBuilder application
 */

export class Utils {
    /**
     * Get card price data from TCGPlayer information
     * @param {Object} card - The card object
     * @returns {Object} Price data with price, category, and updatedAt
     */
    static getCardPriceData(card) {
        let priceData = { 
            price: null,
            category: null,
            updatedAt: null
        };
        
        if (card.tcgplayer && card.tcgplayer.prices) {
            const priceCategories = Object.keys(card.tcgplayer.prices);
            if (priceCategories.length > 0) {
                const category = priceCategories[0];
                const prices = card.tcgplayer.prices[category];
                
                // Prefer market price, fall back to mid, then low
                const price = prices.market || prices.mid || prices.low;
                if (price) {
                    priceData.price = price;
                    priceData.category = category;
                    priceData.updatedAt = card.tcgplayer.updatedAt;
                }
            }
        }
        
        return priceData;
    }

    /**
     * Render energy cost symbols for card display
     * @param {Array} cost - Array of energy types
     * @returns {string} HTML string for energy symbols
     */
    static renderEnergyCost(cost) {
        if (!cost || cost.length === 0) return 'None';
        
        const typeColors = {
            'Fire': '#F08030',
            'Water': '#6890F0',
            'Grass': '#78C850',
            'Lightning': '#F8D030',
            'Psychic': '#F85888',
            'Fighting': '#C03028',
            'Darkness': '#705848',
            'Metal': '#B8B8D0',
            'Fairy': '#EE99AC',
            'Dragon': '#7038F8',
            'Colorless': '#A8A878'
        };
        
        return cost.map(type => {
            const color = typeColors[type] || '#A8A878';
            return `<span class="energy-symbol" style="background-color: ${color}">${type.charAt(0)}</span>`;
        }).join('');
    }

    /**
     * Render weaknesses/resistances for card display
     * @param {Array} items - Array of weakness/resistance objects
     * @returns {string} HTML string for weakness/resistance display
     */
    static renderWeakRes(items) {
        if (!items || items.length === 0) return 'None';
        
        const typeColors = {
            'Fire': '#F08030',
            'Water': '#6890F0',
            'Grass': '#78C850',
            'Lightning': '#F8D030',
            'Psychic': '#F85888',
            'Fighting': '#C03028',
            'Darkness': '#705848',
            'Metal': '#B8B8D0',
            'Fairy': '#EE99AC',
            'Dragon': '#7038F8',
            'Colorless': '#A8A878'
        };
        
        return items.map(item => {
            const color = typeColors[item.type] || '#A8A878';
            return `<span class="energy-symbol" style="background-color: ${color}">${item.type.charAt(0)}</span> ${item.value}`;
        }).join(', ');
    }

    /**
     * Create a unique card key for identifying cards
     * @param {Object} card - The card object
     * @returns {string} Unique card identifier
     */
    static createCardKey(card) {
        return `${card.name}-${card.number}-${card.set.id}`;
    }

    /**
     * Check if two cards are the same
     * @param {Object} card1 - First card
     * @param {Object} card2 - Second card
     * @returns {boolean} True if cards are the same
     */
    static areCardsEqual(card1, card2) {
        return card1.name === card2.name && 
               card1.number === card2.number && 
               card1.set.id === card2.set.id;
    }

    /**
     * Show a notification message
     * @param {boolean} success - Whether the operation was successful
     * @param {string} message - The message to display
     */
    static showNotification(success, message) {
        let notification = document.querySelector('.import-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'import-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 10px 15px;
                border-radius: 5px;
                font-weight: bold;
                display: none;
                z-index: 1000;
                transition: opacity 0.5s ease-in-out;
            `;
            document.body.appendChild(notification);
        }

        notification.textContent = success ? '✓ ' + message : '✗ ' + message;
        notification.style.backgroundColor = success ? '#4CAF50' : '#F44336';
        notification.style.color = 'white';
        notification.style.display = 'block';
        notification.style.opacity = '1';
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 500);
        }, 3000);
    }

    /**
     * Create a modal overlay element
     * @returns {Object} Object with overlay and content elements
     */
    static createModalOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        const content = document.createElement('div');
        content.className = 'modal-content';
        overlay.appendChild(content);
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });

        return { overlay, content };
    }

    /**
     * Fisher-Yates shuffle algorithm
     * @param {Array} array - Array to shuffle
     * @returns {Array} Shuffled array
     */
    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
} 