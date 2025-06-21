import { DeckBuilder } from './DeckBuilder.js';

/**
 * Main entry point for the DeckBuilder application
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the deck builder
    const deckBuilder = new DeckBuilder();
    
    // Make it globally available for debugging (optional)
    window.deckBuilder = deckBuilder;
    
    console.log('DeckBuilder application initialized successfully');
}); 