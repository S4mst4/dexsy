# 📕 Dexsy: Pokémon™ Fantasy Deck Builder

A web application for building and managing custom card decks. Create, edit, and organize your card collections with an intuitive interface.

## Getting Started

1. Clone the repository
2. Open `index.html` in your browser
3. Start building your deck by:
   - Adding new cards using the "Add Card" button
   - Managing your deck with the deck controls

## Features

- Search for cards by name, set ID, set name, or subtype
- Advanced filtering by card type, Pokémon type, stage, and trainer subtype
- Zoom, view details, or add to deck
- Manage deck with undo functionality
- Real-time deck statistics and price tracking
- Export decks in Swift-compatible JSON format
- Import saved decks (supports both old and new formats)
- Simulate starting hand and prize cards on decks with 40+ cards
- Multi-deck upload and management
- Price visibility toggle
- Open decks directly in Table (table.c0di.com) for online play

## Export/Import Features

### Export
- Click the 💾 (Save) button to export your deck
- Choose between two export formats:
  - **QR Data (Swift compatible)**: Simplified format with unique QR code IDs
  - **Full Data**: Complete card data with all original fields
- QR Data format:
  ```json
  {
    "name": "My Pokemon Deck",
    "cards": [
      {
        "name": "Pikachu",
        "image_url": "https://images.pokemontcg.io/base1/58.png",
        "qrCodeId": "card_1703123456789_0_a1b2c3d4e"
      }
    ]
  }
  ```
- Compatible with Swift `Card` and `Deck` structures
- Generates unique QR code IDs for each card

### Import
- Click the 📂 (Import) button to import a deck
- Supports both old format (array of cards) and new Swift-compatible format
- Automatically converts between formats as needed

## Table Integration

### Open in Table
- Click the 🎮 (Table) button to open your deck directly in [Table](https://table.c0di.com)
- Your deck will be automatically loaded and ready for online play
- Supports decks with up to 60 cards (standard Pokémon TCG deck size)
- For very large decks, a warning will appear if the URL might be too long for some browsers
- Uses the official Table deck sharing format for seamless integration

### How it Works
1. Your deck is converted to Table's required format
2. The deck data is encoded and added to the Table URL
3. Table automatically decodes and loads your deck on arrival
4. You can immediately start playing with your custom deck

## Technologies Used

- HTML5
- CSS3 for responsive styling
- Vanilla JavaScript for functionality
- JSON files for data persistence
- Pokémon TCG API for card data

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License. 

## Disclaimer
Dexsy was built with ❤️ by a fan like you. We are not affiliated with, endorsed, sponsored, or specifically approved by Nintendo, The Pokémon™ Company, or any of their affiliates.