import { DeckBuilderManager } from './managers/DeckBuilderManager.js';

/**
 * Main entry point for the DeckBuilder application
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the deck builder manager
    const deckBuilder = new DeckBuilderManager();
    
    // Make it globally available for debugging and component access
    window.deckBuilder = deckBuilder;
    
    console.log('DeckBuilder application initialized successfully');
}); 