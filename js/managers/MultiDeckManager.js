import { Utils } from '../utils.js';

/**
 * Manages multiple deck functionality
 */
export class MultiDeckManager {
    constructor(cardManager, deckBuilder) {
        this.cardManager = cardManager;
        this.deckBuilder = deckBuilder;
        this.multiDecks = [];
        this.editDeckMode = false;
        this.hoveredDeckIdx = null;
        this.deckKeyListener = null;
        
        this.multiDeckUploadInput = null;
        this.multiDeckList = null;
        this.multiDeckTotalPrice = null;
        
        this.initializeElements();
    }

    /**
     * Initialize multi-deck DOM elements
     */
    initializeElements() {
        this.multiDeckUploadInput = document.getElementById('multi-deck-upload');
        this.multiDeckList = document.getElementById('multi-deck-list');
        this.multiDeckTotalPrice = document.getElementById('multi-deck-total-price');
        
        if (this.multiDeckUploadInput) {
            this.setupUploadListener();
        }
    }

    /**
     * Setup file upload listener
     */
    setupUploadListener() {
        this.multiDeckUploadInput.addEventListener('change', (event) => {
            const files = Array.from(event.target.files);
            this.handleFileUpload(files);
        });
    }

    /**
     * Handle file upload for multiple decks
     * @param {Array} files - Array of file objects
     */
    handleFileUpload(files) {
        if (files.length === 0) {
            this.renderMultiDeckList();
            return;
        }

        let loadedCount = 0;
        let totalFiles = files.length;
        let errorMessages = [];

        // Track existing names to avoid duplicates
        const existingNames = new Set(this.multiDecks.map(d => d.name));

        files.forEach((file, idx) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const deck = JSON.parse(e.target.result);
                    if (!Array.isArray(deck)) {
                        throw new Error('Invalid deck format');
                    }
                    
                    // Calculate price
                    const price = deck.reduce((sum, card) => {
                        const priceData = Utils.getCardPriceData(card);
                        return sum + (priceData.price || 0);
                    }, 0);
                    
                    // Ensure unique name
                    let name = file.name;
                    let suffix = 2;
                    while (existingNames.has(name)) {
                        name = file.name.replace(/(\.json)?$/, ` (${suffix})$1`);
                        suffix++;
                    }
                    existingNames.add(name);
                    
                    this.multiDecks.push({
                        name: name,
                        cards: deck,
                        price: price
                    });
                } catch (err) {
                    errorMessages.push(`${file.name}: Invalid file format`);
                } finally {
                    loadedCount++;
                    if (loadedCount === totalFiles) {
                        this.renderMultiDeckList(errorMessages);
                    }
                }
            };
            reader.readAsText(file);
        });
        
        // Clear the file input so the same file can be uploaded again
        this.multiDeckUploadInput.value = '';
    }

    /**
     * Render the multi-deck list
     * @param {Array} errorMessages - Array of error messages to display
     */
    renderMultiDeckList(errorMessages = []) {
        if (!this.multiDeckList || !this.multiDeckTotalPrice) return;
        
        let html = '';
        let totalPrice = 0;
        
        if (this.multiDecks.length > 0) {
            html += '<div class="multi-deck-list-grid">';
            this.multiDecks.forEach((deck, idx) => {
                html += `<div class="multi-deck-box" data-deck-idx="${idx}">`;
                
                // Card preview section
                html += '<div class="deck-cards-preview-container">';
                
                if (deck.cards && deck.cards.length > 0) {
                    if (deck.mainCards && deck.mainCards.length > 0) {
                        // Display multiple main cards
                        deck.mainCards.forEach((cardIdx, mainCardIndex) => {
                            const card = deck.cards[cardIdx];
                            const isMain = mainCardIndex === 0;
                            
                            if (isMain) {
                                html += this.createDeckPreviewHTML(card, false);
                            } else {
                                html += `<div class="deck-card-preview secondary" style="width: 80px; height: 110px; margin-left: 8px; margin-bottom: 0;">
                                    <img src="${card.images && card.images.small ? card.images.small : ''}" alt="${card.name}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px;">
                                </div>`;
                            }
                        });
                    } else {
                        // Fallback to single main card
                        const mainCardIdx = deck.mainCardIdx || 0;
                        html += this.createDeckPreviewHTML(deck.cards[mainCardIdx], false);
                    }
                } else {
                    html += '<div class="deck-card-preview empty">No cards</div>';
                }
                
                html += '</div>';
                
                // Deck info
                html += `<div class="deck-info"><strong>${deck.name}</strong><br>$${deck.price.toFixed(2)}`;
                if (deck.cards && deck.cards.length > 0) {
                    if (deck.mainCards && deck.mainCards.length > 0) {
                        const mainCard = deck.cards[deck.mainCards[0]];
                        html += `<div class="main-card-name">${mainCard.name}</div>`;
                        if (deck.mainCards.length > 1) {
                            const secondaryNames = deck.mainCards.slice(1).map(idx => deck.cards[idx].name).join(', ');
                            html += `<div class="secondary-main-card-names" style="font-size:0.8rem;color:red;margin-top:2px;">${secondaryNames}</div>`;
                        }
                    } else {
                        const mainCardIdx = deck.mainCardIdx || 0;
                        html += `<div class="main-card-name">${deck.cards[mainCardIdx].name}</div>`;
                    }
                }
                html += `</div>`;
                html += `</div>`;
                totalPrice += deck.price;
            });
            html += '</div>';
        } else {
            html = '<em>No decks uploaded yet.</em>';
        }
        
        if (errorMessages.length > 0) {
            html += '<div style="color:red;margin-top:8px;">' + errorMessages.join('<br>') + '</div>';
        }
        
        this.multiDeckList.innerHTML = html;
        
        // Update the price summary
        const deckCount = this.multiDecks.length;
        const deckText = deckCount === 1 ? 'deck' : 'decks';
        this.multiDeckTotalPrice.textContent = `$${totalPrice.toFixed(2)} (${deckCount} ${deckText})`;

        // Setup hover and keyboard interactions
        this.setupDeckBoxHoverAndKey();
    }

    /**
     * Setup hover and keyboard interactions for deck boxes
     */
    setupDeckBoxHoverAndKey() {
        const deckBoxes = this.multiDeckList.querySelectorAll('.multi-deck-box');
        
        deckBoxes.forEach(box => {
            box.addEventListener('mouseenter', () => {
                this.hoveredDeckIdx = parseInt(box.getAttribute('data-deck-idx'));
            });
            box.addEventListener('mouseleave', () => {
                this.hoveredDeckIdx = null;
            });
        });
        
        if (!this.deckKeyListener) {
            this.deckKeyListener = (e) => {
                console.log('Key pressed:', e.key.toLowerCase(), 'Hovered deck index:', this.hoveredDeckIdx);
                
                if (e.key.toLowerCase() === 'i' && this.hoveredDeckIdx !== null) {
                    console.log('I key pressed, prompting for main card selection');
                    this.promptChooseMainCard(this.hoveredDeckIdx);
                } else if (e.key.toLowerCase() === 'e' && this.hoveredDeckIdx !== null) {
                    console.log('E key pressed, handling deck edit');
                    this.handleEditDeck(this.hoveredDeckIdx);
                } else if (e.key.toLowerCase() === 'r' && this.hoveredDeckIdx !== null) {
                    console.log('R key pressed, handling deck removal');
                    this.handleRemoveDeck(this.hoveredDeckIdx);
                }
            };
            document.addEventListener('keydown', this.deckKeyListener);
        }
    }

    /**
     * Handle editing a deck
     * @param {number} deckIdx - Index of the deck to edit
     */
    handleEditDeck(deckIdx) {
        const deck = this.multiDecks[deckIdx];
        if (!deck) {
            console.error('No deck found at index:', deckIdx);
            return;
        }
        
        console.log('Handling edit for deck:', deck.name, 'Current deck size:', this.cardManager.getDeckSize());
        
        if (this.cardManager.getDeckSize() === 0) {
            console.log('Deck is empty, loading uploaded deck automatically');
            this.editDeckMode = true;
            this.switchToUploadedDeck(deckIdx);
        } else {
            console.log('Deck has cards, asking for confirmation');
            const confirmed = window.confirm(`Are you sure you want to edit/switch to deck: ${deck.name}? This will replace your current deck.`);
            if (confirmed) {
                console.log('User confirmed, loading uploaded deck');
                this.editDeckMode = true;
                this.switchToUploadedDeck(deckIdx);
            } else {
                console.log('User cancelled deck loading');
            }
        }
    }

    /**
     * Handle removing a deck
     * @param {number} deckIdx - Index of the deck to remove
     */
    handleRemoveDeck(deckIdx) {
        const deck = this.multiDecks[deckIdx];
        if (!deck) return;
        
        const confirmed = window.confirm(`Are you sure you want to remove deck: ${deck.name}?`);
        if (confirmed) {
            this.multiDecks.splice(deckIdx, 1);
            this.renderMultiDeckList();
            this.hoveredDeckIdx = null;
        }
    }

    /**
     * Switch to an uploaded deck
     * @param {number} deckIdx - Index of the deck to switch to
     */
    switchToUploadedDeck(deckIdx) {
        const deck = this.multiDecks[deckIdx];
        if (!deck || !deck.cards) {
            console.error('Invalid deck or deck has no cards:', deckIdx, deck);
            return;
        }
        
        console.log('Loading deck:', deck.name, 'with', deck.cards.length, 'cards');
        
        this.cardManager.replaceDeck(deck.cards.map(card => ({ ...card })));
        
        console.log('Deck replaced, current deck size:', this.cardManager.getDeckSize());
        
        // Update the deck display to show the new deck in the making deck tab
        if (this.deckBuilder) {
            this.deckBuilder.refreshDisplays();
            this.deckBuilder.deckDisplayManager.resetAllCardStatus();
            console.log('Deck display updated');
        } else {
            console.error('DeckBuilder not available');
        }
    }

    /**
     * Create deck preview HTML
     * @param {Object} card - The card to preview
     * @param {boolean} showName - Whether to show the card name
     * @returns {string} HTML string for deck preview
     */
    createDeckPreviewHTML(card, showName = true) {
        if (!card || !card.images || !card.images.small) {
            return '<div class="deck-card-preview empty">No image</div>';
        }
        
        return `
            <div class="deck-card-preview" title="${card.name}">
                <img src="${card.images.small}" alt="${card.name}">
                ${showName ? `<div class="deck-card-name">${card.name}</div>` : ''}
            </div>
        `;
    }

    /**
     * Prompt user to choose main cards for a deck
     * @param {number} deckIdx - Index of the deck
     */
    promptChooseMainCard(deckIdx) {
        const deck = this.multiDecks[deckIdx];
        if (!deck || !deck.cards || deck.cards.length === 0) return;
        
        // Initialize main cards array if it doesn't exist
        if (!deck.mainCards) {
            deck.mainCards = [deck.mainCardIdx || 0];
        }
        
        this.createMainCardSelectionModal(deck, deckIdx);
    }

    /**
     * Create main card selection modal
     * @param {Object} deck - The deck object
     * @param {number} deckIdx - Index of the deck
     */
    createMainCardSelectionModal(deck, deckIdx) {
        let modal = document.getElementById('main-card-select-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'main-card-select-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            `;
            document.body.appendChild(modal);
        }
        
        const grid = this.createCardSelectionGrid(deck, deckIdx, modal);
        modal.innerHTML = '';
        modal.appendChild(grid);
    }

    /**
     * Create card selection grid
     * @param {Object} deck - The deck object
     * @param {number} deckIdx - Index of the deck
     * @param {HTMLElement} modal - The modal element
     * @returns {HTMLElement} The grid element
     */
    createCardSelectionGrid(deck, deckIdx, modal) {
        const grid = document.createElement('div');
        grid.style.cssText = `
            background: white;
            border-radius: 18px;
            padding: 24px;
            max-width: 90vw;
            max-height: 80vh;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 15px;
        `;
        
        // Create header
        let headerHTML = `<h2 style='text-align:center;margin-bottom:18px;'>Choose Main Cards for <span style='color:#2a3899;'>${deck.name}</span></h2>`;
        
        // Show current main cards if any
        if (deck.mainCards && deck.mainCards.length > 0) {
            headerHTML += this.createCurrentMainCardsDisplay(deck);
        }
        
        headerHTML += `<div style='text-align:center;margin-bottom:15px;color:#666;font-size:0.9rem;'>Click a card to select it. You can have up to 3 main cards. The first card will be the main display, others will be smaller.</div>`;
        
        grid.innerHTML = headerHTML;
        
        // Create cards container with grid layout similar to main deck display
        const cardsContainer = document.createElement('div');
        cardsContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 15px;
            grid-auto-rows: 1fr;
            flex: 1;
        `;
        
        // Group cards by name and count duplicates
        const cardCounts = new Map();
        deck.cards.forEach((card, idx) => {
            const cardKey = card.name + (card.set?.name || '');
            if (!cardCounts.has(cardKey)) {
                cardCounts.set(cardKey, { card, indices: [], count: 0 });
            }
            cardCounts.get(cardKey).indices.push(idx);
            cardCounts.get(cardKey).count++;
        });
        
        // Add card selection elements
        Array.from(cardCounts.values()).forEach(({ card, indices, count }) => {
            const cardDiv = this.createCardSelectionElement(card, indices[0], deck, deckIdx, modal, count, indices);
            cardsContainer.appendChild(cardDiv);
        });
        
        grid.appendChild(cardsContainer);
        
        // Add action buttons
        const buttonContainer = this.createActionButtons(deck, deckIdx, modal);
        grid.appendChild(buttonContainer);
        
        return grid;
    }

    /**
     * Create current main cards display
     * @param {Object} deck - The deck object
     * @returns {string} HTML string for current main cards display
     */
    createCurrentMainCardsDisplay(deck) {
        let html = `<div style='text-align:center;'>`;
        html += `<strong>Current Main Cards:</strong>`;
        html += `</div>`;
        
        deck.mainCards.forEach((cardIdx, idx) => {
            const card = deck.cards[cardIdx];
            const isMain = idx === 0;
            const cardSize = isMain ? '110px' : '80px';
            const cardHeight = isMain ? '150px' : '110px';
            
            html += `
                <div style='display:flex;flex-direction:column;align-items:center;gap:5px;'>
                    <div style='width:${cardSize};height:${cardHeight};background:rgba(255,255,255,0.08);border-radius:10px;border:2px solid ${isMain ? '#2a3899' : '#666'};overflow:hidden;position:relative;'>
                        <img src="${card.images && card.images.small ? card.images.small : ''}" alt="${card.name}" style='width:100%;height:100%;object-fit:contain;'>
                        <div style='position:absolute;bottom:5px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,0.9);padding:2px 6px;border-radius:4px;font-size:0.8rem;font-weight:bold;'>${isMain ? 'Main' : `#${idx + 1}`}</div>
                    </div>
                    <div style='font-size:0.8rem;color:#666;'>${card.name}</div>
                </div>
            `;
        });
        
        return html;
    }

    /**
     * Create card selection element
     * @param {Object} card - The card object
     * @param {number} idx - Card index
     * @param {Object} deck - The deck object
     * @param {number} deckIdx - Deck index
     * @param {HTMLElement} modal - The modal element
     * @param {number} count - Card count
     * @param {Array} indices - Array of card indices
     * @returns {HTMLElement} Card selection element
     */
    createCardSelectionElement(card, idx, deck, deckIdx, modal, count, indices) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.style.cssText = `
            background: var(--glass-bg, rgba(255, 255, 255, 0.1));
            border-radius: 15px;
            padding: 0px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            aspect-ratio: 2.55/3.5;
            display: flex;
            flex-direction: column;
            cursor: pointer;
            backdrop-filter: blur(5px);
            border: 2px solid var(--glass-border, rgba(255, 255, 255, 0.2));
        `;
        
        const isSelected = deck.mainCards && deck.mainCards.includes(idx);
        const selectionIndex = deck.mainCards ? deck.mainCards.indexOf(idx) : -1;
        
        if (isSelected) {
            cardDiv.style.border = '2px solid #2a3899';
            cardDiv.style.background = 'rgba(42, 56, 153, 0.1)';
            cardDiv.style.transform = 'translateY(-5px) scale(1.02)';
            cardDiv.style.boxShadow = '0 8px 16px rgba(42, 56, 153, 0.3)';
        }
        
        // Create image element
        const img = document.createElement('img');
        img.src = card.images && card.images.small ? card.images.small : '';
        img.alt = card.name;
        img.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 0px;
            object-fit: contain;
        `;
        
        // Add count badge
        const countBadge = document.createElement('div');
        countBadge.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 0.9rem;
            z-index: 10;
        `;
        countBadge.textContent = `×${count}`;
        
        // Add selection indicator if selected
        let selectionBadge = '';
        if (isSelected) {
            selectionBadge = `<div style='position:absolute;top:10px;right:10px;background:#2a3899;color:white;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:bold;z-index:10;'>${selectionIndex + 1}</div>`;
        }
        
        cardDiv.innerHTML = selectionBadge;
        cardDiv.insertBefore(img, cardDiv.firstChild);
        cardDiv.appendChild(countBadge);
        
        // Add hover effect
        cardDiv.addEventListener('mouseenter', () => {
            if (!isSelected) {
                cardDiv.style.transform = 'translateY(-5px) scale(1.02)';
                cardDiv.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.3)';
            }
        });
        
        cardDiv.addEventListener('mouseleave', () => {
            if (!isSelected) {
                cardDiv.style.transform = 'translateY(0) scale(1)';
                cardDiv.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
            }
        });
        
        cardDiv.addEventListener('click', () => {
            this.handleCardSelection(card, idx, deck, deckIdx, modal);
        });
        
        return cardDiv;
    }

    /**
     * Handle card selection in modal
     * @param {Object} card - The card object
     * @param {number} idx - Card index
     * @param {Object} deck - The deck object
     * @param {number} deckIdx - Deck index
     * @param {HTMLElement} modal - The modal element
     */
    handleCardSelection(card, idx, deck, deckIdx, modal) {
        if (!deck.mainCards) deck.mainCards = [];
        
        // Check if any instance of this card is already selected
        const cardKey = card.name + (card.set?.name || '');
        const isSelected = deck.mainCards.some(selectedIdx => {
            const selectedCard = deck.cards[selectedIdx];
            const selectedCardKey = selectedCard.name + (selectedCard.set?.name || '');
            return selectedCardKey === cardKey;
        });
        
        if (isSelected) {
            // Remove all instances of this card from selection
            deck.mainCards = deck.mainCards.filter(selectedIdx => {
                const selectedCard = deck.cards[selectedIdx];
                const selectedCardKey = selectedCard.name + (selectedCard.set?.name || '');
                return selectedCardKey !== cardKey;
            });
        } else {
            // Add the first instance of this card to selection (max 3)
            if (deck.mainCards.length < 3) {
                deck.mainCards.push(idx);
            } else {
                alert('You can only select up to 3 main cards. Please remove one first.');
                return;
            }
        }
        
        // Update the modal to reflect changes
        modal.remove();
        this.promptChooseMainCard(deckIdx);
    }

    /**
     * Create action buttons for modal
     * @param {Object} deck - The deck object
     * @param {number} deckIdx - Deck index
     * @param {HTMLElement} modal - The modal element
     * @returns {HTMLElement} Button container
     */
    createActionButtons(deck, deckIdx, modal) {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.gridColumn = '1/-1';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.style.gap = '15px';
        buttonContainer.style.marginTop = '20px';
        
        // Clear selection button
        const clearBtn = this.createButton('Clear Selection', '#f44336', () => {
            deck.mainCards = [];
            modal.remove();
            this.renderMultiDeckList();
        });
        
        // Save button
        const saveBtn = this.createButton('Save Selection', '#4CAF50', () => {
            if (deck.mainCards && deck.mainCards.length > 0) {
                deck.mainCardIdx = deck.mainCards[0];
            }
            modal.remove();
            this.renderMultiDeckList();
        });
        
        // Cancel button
        const cancelBtn = this.createButton('Cancel', '#eee', () => modal.remove(), true);
        
        buttonContainer.appendChild(clearBtn);
        buttonContainer.appendChild(saveBtn);
        buttonContainer.appendChild(cancelBtn);
        
        return buttonContainer;
    }

    /**
     * Create a button element
     * @param {string} text - Button text
     * @param {string} backgroundColor - Background color
     * @param {Function} onClick - Click handler
     * @param {boolean} isCancel - Whether this is a cancel button
     * @returns {HTMLElement} Button element
     */
    createButton(text, backgroundColor, onClick, isCancel = false) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            padding: 10px 20px;
            font-size: 1rem;
            border-radius: 8px;
            background: ${backgroundColor};
            color: ${isCancel ? '#666' : 'white'};
            border: ${isCancel ? '1px solid #aaa' : 'none'};
            cursor: pointer;
        `;
        button.addEventListener('click', onClick);
        return button;
    }

    /**
     * Get all multi-decks
     * @returns {Array} Array of multi-decks
     */
    getMultiDecks() {
        return this.multiDecks;
    }

    /**
     * Get total price of all multi-decks
     * @returns {number} Total price
     */
    getTotalPrice() {
        return this.multiDecks.reduce((sum, deck) => sum + deck.price, 0);
    }
} 