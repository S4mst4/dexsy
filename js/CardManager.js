import { Utils } from './utils.js';

/**
 * Manages card operations including adding, removing, and tracking cards
 */
export class CardManager {
    constructor() {
        this.deck = [];
        this.removedCards = []; // Track removed cards for undo functionality
    }

    /**
     * Add a card to the deck
     * @param {Object} card - The card to add
     */
    addCard(card) {
        this.deck.push(card);
    }

    /**
     * Remove a card from the deck at a specific index
     * @param {number} index - Index of the card to remove
     * @returns {Object} The removed card
     */
    removeCardAtIndex(index) {
        const removedCard = this.deck[index];
        this.removedCards.push(removedCard);
        this.deck.splice(index, 1);
        return removedCard;
    }

    /**
     * Remove the last instance of a specific card
     * @param {Object} card - The card to remove
     * @returns {boolean} True if card was removed, false if not found
     */
    removeLastInstanceOfCard(card) {
        const index = this.deck.findIndex(c => Utils.areCardsEqual(c, card));
        if (index !== -1) {
            this.removeCardAtIndex(index);
            return true;
        }
        return false;
    }

    /**
     * Restore the last removed card (undo functionality)
     * @returns {Object|null} The restored card or null if no cards to restore
     */
    restoreLastRemovedCard() {
        if (this.removedCards.length > 0) {
            const cardToRestore = this.removedCards.pop();
            this.deck.push(cardToRestore);
            return cardToRestore;
        }
        return null;
    }

    /**
     * Get the count of a specific card in the deck
     * @param {Object} card - The card to count
     * @returns {number} Number of instances of the card
     */
    getCardCount(card) {
        return this.deck.filter(c => Utils.areCardsEqual(c, card)).length;
    }

    /**
     * Check if a card is in the deck
     * @param {Object} card - The card to check
     * @returns {boolean} True if card is in deck
     */
    isCardInDeck(card) {
        return this.deck.some(c => Utils.areCardsEqual(c, card));
    }

    /**
     * Clear all cards from the deck
     */
    clearDeck() {
        this.deck = [];
    }

    /**
     * Replace the entire deck with new cards
     * @param {Array} newDeck - Array of cards to replace the current deck
     */
    replaceDeck(newDeck) {
        this.deck = [...newDeck];
    }

    /**
     * Get deck statistics
     * @returns {Object} Object with counts for different card types and total price
     */
    getDeckStats() {
        const stats = {
            total: 0,
            pokemon: 0,
            energy: 0,
            trainer: 0,
            price: 0
        };

        this.deck.forEach(card => {
            stats.total++;
            
            const type = (card.supertype || '').toLowerCase();
            if (type === 'pokémon' || type === 'pokemon') {
                stats.pokemon++;
            } else if (type === 'energy') {
                stats.energy++;
            } else if (type === 'trainer') {
                stats.trainer++;
            }
            
            const priceData = Utils.getCardPriceData(card);
            if (priceData.price) {
                stats.price += priceData.price;
            }
        });

        return stats;
    }

    /**
     * Sort the deck according to standard Pokémon TCG rules
     */
    sortDeck() {
        const typeOrder = {
            'pokémon': 1,
            'pokemon': 1,
            'trainer': 2,
            'energy': 3
        };

        const pokemonTypeOrder = {
            'grass': 1, 'water': 2, 'fire': 3, 'lightning': 4,
            'colorless': 5, 'darkness': 6, 'metal': 7, 'dragon': 8, 'psychic': 9
        };

        const trainerSubtypeOrder = {
            'supporter': 1, 'item': 2, 'pokemon tool': 3, 'stadium': 4
        };

        const stageOrder = {
            'stage 2': 1, 'stage 1': 2, 'basic': 3
        };

        this.deck.sort((a, b) => {
            const typeA = (a.supertype || '').toLowerCase();
            const typeB = (b.supertype || '').toLowerCase();
            
            const orderA = typeOrder[typeA] || 999;
            const orderB = typeOrder[typeB] || 999;
            
            if (orderA !== orderB) return orderA - orderB;

            // Sort Pokémon by type and stage
            if (typeA === 'pokémon' || typeA === 'pokemon') {
                const pokemonTypeA = (a.types && a.types[0] || '').toLowerCase();
                const pokemonTypeB = (b.types && b.types[0] || '').toLowerCase();
                
                const pokemonOrderA = pokemonTypeOrder[pokemonTypeA] || 999;
                const pokemonOrderB = pokemonTypeOrder[pokemonTypeB] || 999;

                if (pokemonOrderA !== pokemonOrderB) {
                    return pokemonOrderA - pokemonOrderB;
                }

                const stageA = (a.subtypes && a.subtypes.find(s => s.toLowerCase().includes('stage')) || 'basic').toLowerCase();
                const stageB = (b.subtypes && b.subtypes.find(s => s.toLowerCase().includes('stage')) || 'basic').toLowerCase();
                
                const stageOrderA = stageOrder[stageA] || 999;
                const stageOrderB = stageOrder[stageB] || 999;

                if (stageOrderA !== stageOrderB) {
                    return stageOrderA - stageOrderB;
                }
            }

            // Sort Trainers by subtype
            if (typeA === 'trainer') {
                const trainerSubtypeA = (a.subtypes && a.subtypes[0] || '').toLowerCase();
                const trainerSubtypeB = (b.subtypes && b.subtypes[0] || '').toLowerCase();
                
                const trainerOrderA = trainerSubtypeOrder[trainerSubtypeA] || 999;
                const trainerOrderB = trainerSubtypeOrder[trainerSubtypeB] || 999;

                if (trainerOrderA !== trainerOrderB) {
                    return trainerOrderA - trainerOrderB;
                }
            }

            // Sort Energy by type
            if (typeA === 'energy') {
                const energyTypeA = (a.subtypes && a.subtypes.includes('Basic') ? a.name.split(' ')[0] : '').toLowerCase();
                const energyTypeB = (b.subtypes && b.subtypes.includes('Basic') ? b.name.split(' ')[0] : '').toLowerCase();
                
                const energyOrderA = pokemonTypeOrder[energyTypeA] || 999;
                const energyOrderB = pokemonTypeOrder[energyTypeB] || 999;

                if (energyOrderA !== energyOrderB) {
                    return energyOrderA - energyOrderB;
                }
            }
            
            // Sort by name within same type/subtype/stage
            return a.name.localeCompare(b.name);
        });
    }

    /**
     * Get the number of removed cards available for undo
     * @returns {number} Number of cards that can be restored
     */
    getRemovedCardsCount() {
        return this.removedCards.length;
    }

    /**
     * Get the current deck size
     * @returns {number} Number of cards in the deck
     */
    getDeckSize() {
        return this.deck.length;
    }

    /**
     * Check if deck meets minimum size requirement for gameplay
     * @returns {boolean} True if deck has at least 40 cards
     */
    isDeckPlayable() {
        return this.deck.length >= 40;
    }
} 