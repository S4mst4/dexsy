# DeckBuilder Refactoring Guide

## Overview

The original `DeckBuilder.js` file (1,886 lines) has been refactored into a modular architecture with separate, focused modules. This improves maintainability, testability, and code organization.

## New File Structure

```
js/
├── main.js                 # Entry point
├── DeckBuilder.js          # Main orchestrator class
├── utils.js               # Utility functions
├── CardManager.js         # Card operations management
├── SearchManager.js       # Search functionality
├── DeckDisplayManager.js  # UI display management
├── ExportImportManager.js # Export/import functionality
├── GameManager.js         # Game simulation
└── MultiDeckManager.js    # Multiple deck management
```

## Module Breakdown

### 1. `utils.js` - Utility Functions
**Purpose**: Shared utility functions used across multiple modules.

**Key Functions**:
- `getCardPriceData(card)` - Extract price information from card data
- `renderEnergyCost(cost)` - Render energy cost symbols
- `renderWeakRes(items)` - Render weakness/resistance display
- `createCardKey(card)` - Create unique card identifier
- `areCardsEqual(card1, card2)` - Compare two cards
- `showNotification(success, message)` - Display notifications
- `createModalOverlay()` - Create modal overlay elements
- `shuffleArray(array)` - Fisher-Yates shuffle algorithm

**Benefits**:
- Eliminates code duplication
- Centralizes common functionality
- Makes testing easier
- Improves maintainability

### 2. `CardManager.js` - Card Operations
**Purpose**: Manages all card-related operations and deck state.

**Key Methods**:
- `addCard(card)` - Add card to deck
- `removeCardAtIndex(index)` - Remove card at specific index
- `removeLastInstanceOfCard(card)` - Remove last instance of a card
- `restoreLastRemovedCard()` - Undo functionality
- `getCardCount(card)` - Get count of specific card
- `isCardInDeck(card)` - Check if card is in deck
- `getDeckStats()` - Get deck statistics
- `sortDeck()` - Sort deck by TCG rules
- `isDeckPlayable()` - Check if deck meets minimum requirements

**Benefits**:
- Separates data logic from UI logic
- Makes card operations testable
- Provides clean interface for card management
- Centralizes deck state management

### 3. `SearchManager.js` - Search Functionality
**Purpose**: Handles all search-related operations and API calls.

**Key Methods**:
- `buildSearchQuery(query, filters)` - Build API search queries
- `searchCards(query, filters, append)` - Search for cards
- `loadMoreCards(filters)` - Load more cards for infinite scrolling
- `getNewestSet()` - Get newest set from API
- `getAllSets()` - Get all sets for suggestions
- `sortResultsByPrice(cards, sortOrder)` - Sort search results

**Benefits**:
- Isolates API logic
- Makes search functionality reusable
- Improves error handling
- Centralizes search state management

### 4. `DeckDisplayManager.js` - UI Display Management
**Purpose**: Manages all deck display and UI updates.

**Key Methods**:
- `createCardElement(card, count, options)` - Create card display elements
- `updateDeckDisplay()` - Update deck display
- `updateCounters()` - Update deck counters
- `showCardModal(card)` - Show card details modal
- `updateCardStatusInSearchResults(card, isInDeck)` - Update card status
- `setPriceVisibility(show)` - Toggle price visibility

**Benefits**:
- Separates UI logic from business logic
- Makes UI updates consistent
- Provides reusable card element creation
- Centralizes display state management

### 5. `ExportImportManager.js` - Export/Import Functionality
**Purpose**: Handles deck export and import operations.

**Key Methods**:
- `showExportModal()` - Show export options modal
- `exportQRData(deck)` - Export as QR-compatible format
- `exportFullData(deck)` - Export as full data format
- `importDeck(onImport)` - Import deck from file
- `downloadJSON(data, filename)` - Download JSON file

**Benefits**:
- Isolates file I/O operations
- Makes export/import functionality reusable
- Improves error handling
- Provides clean interface for file operations

### 6. `GameManager.js` - Game Simulation
**Purpose**: Manages game simulation functionality.

**Key Methods**:
- `startGameSimulation()` - Start game simulation
- `shuffleDeck()` - Shuffle deck with animation
- `dealHand()` - Deal cards to player hand
- `dealPrizeCards()` - Deal prize cards
- `createGameCard(card)` - Create game card elements
- `resetGame()` - Reset game state

**Benefits**:
- Isolates game logic
- Makes game functionality testable
- Provides clean interface for game operations
- Centralizes game state management

### 7. `MultiDeckManager.js` - Multiple Deck Management
**Purpose**: Manages multiple deck functionality.

**Key Methods**:
- `handleFileUpload(files)` - Handle multiple deck uploads
- `renderMultiDeckList(errorMessages)` - Render deck list
- `promptChooseMainCard(deckIdx)` - Choose main cards for deck
- `switchToUploadedDeck(deckIdx)` - Switch to uploaded deck
- `handleEditDeck(deckIdx)` - Handle deck editing
- `handleRemoveDeck(deckIdx)` - Handle deck removal

**Benefits**:
- Isolates multi-deck logic
- Makes multi-deck functionality testable
- Provides clean interface for multi-deck operations
- Centralizes multi-deck state management

### 8. `DeckBuilder.js` - Main Orchestrator
**Purpose**: Main class that orchestrates all modules and provides the application interface.

**Key Responsibilities**:
- Initialize all managers
- Setup event listeners
- Coordinate between modules
- Provide public interface
- Handle module communication

**Benefits**:
- Provides clean application interface
- Coordinates module interactions
- Centralizes application initialization
- Makes the application structure clear

### 9. `main.js` - Entry Point
**Purpose**: Simple entry point that initializes the application.

**Benefits**:
- Clean separation of concerns
- Easy to modify initialization
- Clear entry point
- Enables debugging access

## Key Improvements

### 1. **Separation of Concerns**
Each module has a single, well-defined responsibility:
- `CardManager` handles card data
- `SearchManager` handles search operations
- `DeckDisplayManager` handles UI updates
- etc.

### 2. **Reduced Code Duplication**
Common functionality is now in `utils.js`:
- Price data extraction
- Energy cost rendering
- Modal creation
- Array shuffling

### 3. **Improved Testability**
Each module can be tested independently:
- Mock dependencies easily
- Test specific functionality
- Isolate bugs
- Write unit tests

### 4. **Better Error Handling**
Centralized error handling in each module:
- API errors in `SearchManager`
- File errors in `ExportImportManager`
- UI errors in `DeckDisplayManager`

### 5. **Enhanced Maintainability**
- Smaller, focused files
- Clear module boundaries
- Consistent naming conventions
- Comprehensive documentation

### 6. **Improved Performance**
- Lazy loading of modules
- Reduced memory footprint
- Better code splitting
- Optimized imports

## Migration Guide

### For Developers

1. **Update HTML**: Change script tag to use modules:
   ```html
   <!-- Old -->
   <script src="DeckBuilder.js"></script>
   
   <!-- New -->
   <script type="module" src="js/main.js"></script>
   ```

2. **Access Managers**: Use the main DeckBuilder instance:
   ```javascript
   // Access any manager
   const cardManager = deckBuilder.getCardManager();
   const searchManager = deckBuilder.getSearchManager();
   ```

3. **Extend Functionality**: Add new methods to appropriate managers:
   ```javascript
   // Add to CardManager for card operations
   // Add to SearchManager for search operations
   // Add to DeckDisplayManager for UI operations
   ```

### For Testing

1. **Unit Tests**: Test each module independently:
   ```javascript
   import { CardManager } from './CardManager.js';
   import { SearchManager } from './SearchManager.js';
   ```

2. **Integration Tests**: Test module interactions:
   ```javascript
   import { DeckBuilder } from './DeckBuilder.js';
   ```

3. **Mock Dependencies**: Mock external dependencies:
   ```javascript
   // Mock API calls in SearchManager
   // Mock DOM elements in DeckDisplayManager
   ```

## Benefits Summary

1. **Maintainability**: Easier to find and fix bugs
2. **Testability**: Each module can be tested independently
3. **Reusability**: Modules can be reused in other projects
4. **Scalability**: Easy to add new features
5. **Performance**: Better code splitting and loading
6. **Debugging**: Easier to isolate issues
7. **Documentation**: Clear module responsibilities
8. **Team Development**: Multiple developers can work on different modules

## Future Enhancements

1. **TypeScript**: Add type safety
2. **State Management**: Add centralized state management
3. **Event System**: Add custom event system
4. **Plugin System**: Add plugin architecture
5. **Caching**: Add intelligent caching
6. **Offline Support**: Add service worker support

This refactoring provides a solid foundation for future development while maintaining all existing functionality. 