import { Utils } from '../utils.js';

/**
 * Manages game simulation functionality
 */
export class GameManager {
    constructor(cardManager) {
        this.cardManager = cardManager;
        this.gameStartButton = null;
        this.gameOverlay = null;
        this.playerHand = null;
        this.prizeCards = null;
        
        this.initializeElements();
    }

    /**
     * Initialize game-related DOM elements
     */
    initializeElements() {
        this.gameStartButton = document.getElementById('gameStartButton');
        this.gameOverlay = document.getElementById('gameOverlay');
        this.playerHand = document.getElementById('playerHand');
        this.prizeCards = document.getElementById('prizeCards');
        
        this.setupEventListeners();
    }

    /**
     * Setup game event listeners
     */
    setupEventListeners() {
        if (this.gameStartButton) {
            this.gameStartButton.addEventListener('click', () => this.startGameSimulation());
        }
        
        if (this.gameOverlay) {
            this.gameOverlay.addEventListener('click', (e) => {
                if (e.target === this.gameOverlay) {
                    this.gameOverlay.classList.remove('active');
                }
            });
        }
    }

    /**
     * Start the game simulation
     */
    startGameSimulation() {
        if (!this.cardManager.isDeckPlayable()) {
            alert('Deck must have at least 40 cards to start a game.');
            return;
        }

        // Shuffle the deck
        this.shuffleDeck();
        
        // Clear previous game state
        this.clearGameState();
        this.gameOverlay.classList.add('active');
        
        // Deal cards with animation after shuffle animation completes
        setTimeout(() => {
            this.dealHand();
            this.dealPrizeCards();
        }, 500);
    }

    /**
     * Shuffle the deck with animation
     */
    shuffleDeck() {
        if (this.gameStartButton) {
            const stackedCards = this.gameStartButton.querySelector('.stacked-cards');
            if (stackedCards) {
                stackedCards.classList.add('shuffle-animation');
            }
        }
        
        // Fisher-Yates shuffle
        this.cardManager.deck = Utils.shuffleArray(this.cardManager.deck);
        
        setTimeout(() => {
            if (this.gameStartButton) {
                const stackedCards = this.gameStartButton.querySelector('.stacked-cards');
                if (stackedCards) {
                    stackedCards.classList.remove('shuffle-animation');
                }
            }
        }, 500);
    }

    /**
     * Clear the game state
     */
    clearGameState() {
        if (this.playerHand) {
            this.playerHand.innerHTML = '';
        }
        if (this.prizeCards) {
            this.prizeCards.innerHTML = '';
        }
    }

    /**
     * Deal cards to the player's hand
     */
    dealHand() {
        if (!this.playerHand) return;

        const handSize = 7;
        const fanAngleSpread = 45;
        const startAngle = -fanAngleSpread / 2;
        const angleStep = fanAngleSpread / (handSize - 1);
        const radius = 750;

        for (let i = 0; i < handSize && i < this.cardManager.deck.length; i++) {
            const card = this.cardManager.deck[i];
            const cardElement = this.createGameCard(card);
            cardElement.classList.add('in-hand', 'dealing');
            this.playerHand.appendChild(cardElement);
            
            // Calculate fan position using trigonometry
            const angle = startAngle + (i * angleStep);
            const radian = (angle * Math.PI) / 180;
            
            // Calculate position along the arc
            const x = Math.sin(radian) * radius;
            const y = -Math.cos(radian) * radius * 0.15;

            // Trigger dealing animation after a short delay
            setTimeout(() => {
                cardElement.classList.add('dealt');
                cardElement.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
                
                // Flip card face up after it reaches its position
                setTimeout(() => {
                    cardElement.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg) rotateY(180deg)`;
                }, 600);
            }, i * 200);
        }
    }

    /**
     * Deal prize cards
     */
    dealPrizeCards() {
        if (!this.prizeCards) return;

        for (let i = 0; i < 6 && (i + 7) < this.cardManager.deck.length; i++) {
            const card = this.cardManager.deck[i + 7];
            const cardElement = this.createGameCard(card);
            cardElement.classList.add('dealing');
            this.prizeCards.appendChild(cardElement);
            
            // Trigger dealing animation after a short delay
            setTimeout(() => {
                cardElement.classList.add('dealt');
                
                // Flip card face up after it reaches its position
                setTimeout(() => {
                    cardElement.style.transform = 'rotateY(180deg)';
                }, 600);
            }, (i + 7) * 200); // Start after hand is dealt
        }
    }

    /**
     * Create a game card element
     * @param {Object} card - The card object
     * @returns {HTMLElement} Game card element
     */
    createGameCard(card) {
        const cardElement = document.createElement('div');
        cardElement.className = 'game-card';
        cardElement.innerHTML = `
            <div class="front">
                <img src="${card.images.small}" alt="${card.name}">
            </div>
            <div class="back"></div>
        `;
        return cardElement;
    }

    /**
     * Reset the game state
     */
    resetGame() {
        this.clearGameState();
        if (this.gameOverlay) {
            this.gameOverlay.classList.remove('active');
        }
    }

    /**
     * Check if game is currently active
     * @returns {boolean} True if game overlay is active
     */
    isGameActive() {
        return this.gameOverlay && this.gameOverlay.classList.contains('active');
    }

    /**
     * Get the current game state
     * @returns {Object} Current game state
     */
    getGameState() {
        return {
            isActive: this.isGameActive(),
            handSize: this.playerHand ? this.playerHand.children.length : 0,
            prizeCards: this.prizeCards ? this.prizeCards.children.length : 0
        };
    }
} 