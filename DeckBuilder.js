class DeckBuilder {
    constructor() {
        this.deck = [];
        this.removedCards = [];  // Track removed cards for undo
        this.initializeElements();
        this.setupEventListeners();
        
        // Add modal overlay to the document
        this.createModalOverlay();

        // Add export/import buttons to event listeners
        this.setupExportImport();

        // Set default card back URL
        this.cardBackUrl = 'https://images.pokemontcg.io/cardback.png';

        this.initializeGameElements();

        // Add pagination tracking
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMoreResults = true;
        this.lastSearchQuery = '';
    }

    initializeElements() {
        this.searchInput = document.getElementById('search-input');
        this.searchInput.placeholder = '🔍 Search by name, set (sv1 or Scarlet & Violet), or card number (sv1-1)';
        this.searchButton = document.getElementById('search-button');
        this.searchResults = document.getElementById('search-results');
        this.deckDisplay = document.getElementById('deck-display');
        this.counters = {
            total: document.getElementById('total-count'),
            pokemon: document.getElementById('pokemon-count'),
            energy: document.getElementById('energy-count'),
            trainer: document.getElementById('trainer-count')
        };
        
        // Add datalist for set suggestions
        this.createSetSuggestions();
    }

    setupEventListeners() {
        this.searchButton.addEventListener('click', () => this.searchCards());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.searchInput.value.trim()) {
                this.searchCards();
            }
        });
        
        // Add undo button listener
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undoCardRemoval());
        }

        // Add scroll event listener for infinite scrolling
        window.addEventListener('scroll', () => {
            if (this.isLoading || !this.hasMoreResults) return;

            const scrollPosition = window.innerHeight + window.scrollY;
            const scrollThreshold = document.documentElement.scrollHeight - 200;

            if (scrollPosition >= scrollThreshold) {
                this.loadMoreCards();
            }
        });
    }

    async searchCards() {
        const query = this.searchInput.value.trim();
        if (!query) return;

        // Reset pagination when starting a new search
        this.currentPage = 1;
        this.hasMoreResults = true;
        this.lastSearchQuery = query;
        this.searchResults.innerHTML = '';

        try {
            this.isLoading = true;
            
            // Build the search query
            let searchQuery;
            
            // Check if it's a set number search (e.g. "swsh1-1", "base1-4")
            if (query.match(/^[a-zA-Z0-9]+-\d+$/)) {
                searchQuery = `number:"${query.split('-')[1]}" set.id:"${query.split('-')[0]}"`;
            }
            // Check if it's a set ID without card number (e.g. "sv1", "swsh1")
            else if (query.match(/^[a-zA-Z0-9]+$/)) {
                searchQuery = `set.id:"${query}"`;
            }
            // Check if it looks like a set name or series name
            else {
                // Make the search more flexible by using contains
                searchQuery = `(set.name:"*${query}*" OR set.series:"*${query}*")`;
            }

            const response = await fetch(
                `https://api.pokemontcg.io/v2/cards?q=${searchQuery}&page=${this.currentPage}&pageSize=20`
            );
            const data = await response.json();
            
            // Check if we have more results
            this.hasMoreResults = data.data.length === 20;
            
            this.displaySearchResults(data.data, false);
        } catch (error) {
            console.error('Error searching cards:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async loadMoreCards() {
        if (this.isLoading || !this.hasMoreResults) return;

        try {
            this.isLoading = true;
            this.currentPage++;

            const query = this.lastSearchQuery;
            let searchQuery;
            
            if (query.match(/^[a-zA-Z0-9]+-\d+$/)) {
                searchQuery = `number:"${query.split('-')[1]}" set.id:"${query.split('-')[0]}"`;
            }
            else if (query.match(/^[a-zA-Z0-9]+$/)) {
                searchQuery = `set.id:"${query}"`;
            }
            else {
                searchQuery = `(set.name:"*${query}*" OR set.series:"*${query}*")`;
            }

            const response = await fetch(
                `https://api.pokemontcg.io/v2/cards?q=${searchQuery}&page=${this.currentPage}&pageSize=20`
            );
            const data = await response.json();

            this.hasMoreResults = data.data.length === 20;
            this.displaySearchResults(data.data, true);
        } catch (error) {
            console.error('Error loading more cards:', error);
        } finally {
            this.isLoading = false;
        }
    }

    displaySearchResults(cards, append = false) {
        // Remove any existing loading indicator before adding new cards
        const existingLoadingIndicator = this.searchResults.querySelector('.loading-indicator');
        if (existingLoadingIndicator) {
            existingLoadingIndicator.remove();
        }

        if (!append) {
            this.searchResults.innerHTML = '';
        }

        cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            
            // Create image element with card back as placeholder
            const img = document.createElement('img');
            img.src = this.cardBackUrl;  // Show card back while loading
            img.alt = card.name;

            // Load the actual card image
            const actualImage = new Image();
            actualImage.onload = () => {
                img.src = actualImage.src;
            };
            actualImage.src = card.images.small;

            // Add button for adding to deck
            const buttonsHTML = `
                <div class="card-buttons">
                    <button class="card-button">✅</button>
                </div>
            `;
            
            cardElement.innerHTML = buttonsHTML;
            cardElement.insertBefore(img, cardElement.firstChild);

            // Add click handler for card zoom
            cardElement.addEventListener('click', (e) => {
                if (!e.target.classList.contains('card-button')) {
                    this.showCardModal(card.images.large || card.images.small);
                }
            });

            // Add click handler for add button
            const addButton = cardElement.querySelector('.card-button');
            addButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.addCardToDeck(card);
            });

            this.searchResults.appendChild(cardElement);
        });
    }

    addCardToDeck(card) {
        this.deck.push(card);
        this.updateDeckDisplay();
        this.updateCounters();
    }

    updateDeckDisplay() {
        this.deckDisplay.innerHTML = '';
        this.deck.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';

            const img = document.createElement('img');
            img.src = card.images.small;
            img.alt = card.name;

            // Add button for removing from deck
            const buttonsHTML = `
                <div class="card-buttons">
                    <button class="card-button">❌</button>
                </div>
            `;

            cardElement.innerHTML = buttonsHTML;
            cardElement.insertBefore(img, cardElement.firstChild);

            // Add click handler for card zoom
            cardElement.addEventListener('click', (e) => {
                if (!e.target.classList.contains('card-button')) {
                    this.showCardModal(card.images.large || card.images.small);
                }
            });

            // Add click handler for remove button
            const removeButton = cardElement.querySelector('.card-button');
            removeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeCardFromDeck(index);
            });

            this.deckDisplay.appendChild(cardElement);
        });
    }

    updateCounters() {
        const counts = this.deck.reduce((acc, card) => {
            acc.total++;
            // Convert supertype to lowercase and handle possible undefined/null cases
            const type = (card.supertype || '').toLowerCase();
            if (type === 'pokémon' || type === 'pokemon') {
                acc.pokemon++;
            } else if (type === 'energy') {
                acc.energy++;
            } else if (type === 'trainer') {
                acc.trainer++;
            }
            return acc;
        }, { total: 0, pokemon: 0, energy: 0, trainer: 0 });

        Object.keys(this.counters).forEach(key => {
            this.counters[key].textContent = counts[key];
        });

        // Show/hide game start button based on deck size
        if (this.deck.length >= 40) {
            this.gameStartButton.classList.add('visible');
        } else {
            this.gameStartButton.classList.remove('visible');
        }
    }

    createModalOverlay() {
        this.modalOverlay = document.createElement('div');
        this.modalOverlay.className = 'modal-overlay';
        this.modalContent = document.createElement('div');
        this.modalContent.className = 'modal-content';
        this.modalOverlay.appendChild(this.modalContent);
        document.body.appendChild(this.modalOverlay);

        // Close modal when clicking outside the image
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) {
                this.modalOverlay.classList.remove('active');
            }
        });
    }

    removeCardFromDeck(index) {
        const removedCard = this.deck.splice(index, 1)[0];
        this.removedCards.push(removedCard);  // Store removed card
        this.updateDeckDisplay();
        this.updateCounters();
        
        // Show undo button if we have removed cards
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
            undoBtn.style.display = this.removedCards.length > 0 ? 'block' : 'none';
        }
    }

    showCardModal(imageUrl) {
        this.modalContent.innerHTML = `<img src="${imageUrl}" alt="Card preview">`;
        this.modalOverlay.classList.add('active');
    }

    setupExportImport() {
        // Create hidden file input for import
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        document.getElementById('exportBtn').addEventListener('click', () => {
            const deckData = JSON.stringify(this.deck, null, 2);
            const blob = new Blob([deckData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pokemon-deck.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });

        document.getElementById('importBtn').addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedDeck = JSON.parse(e.target.result);
                        this.deck = importedDeck;
                        this.updateDeckDisplay();
                        this.updateCounters();
                    } catch (error) {
                        alert('Error importing deck: Invalid file format');
                    }
                };
                reader.readAsText(file);
            }
        });

        // Clear button is already working correctly
    }

    initializeGameElements() {
        this.gameStartButton = document.getElementById('gameStartButton');
        this.gameOverlay = document.getElementById('gameOverlay');
        this.playerHand = document.getElementById('playerHand');
        this.prizeCards = document.getElementById('prizeCards');
        
        this.gameStartButton.addEventListener('click', () => this.startGameSimulation());
        this.gameOverlay.addEventListener('click', (e) => {
            if (e.target === this.gameOverlay) {
                this.gameOverlay.classList.remove('active');
            }
        });
    }

    startGameSimulation() {
        // Shuffle the deck
        this.shuffleDeck();
        
        // Clear previous game state
        this.playerHand.innerHTML = '';
        this.prizeCards.innerHTML = '';
        this.gameOverlay.classList.add('active');
        
        // Deal cards with animation after shuffle animation completes
        setTimeout(() => {
            this.dealHand();
            this.dealPrizeCards();
        }, 500);
    }

    shuffleDeck() {
        this.gameStartButton.querySelector('.stacked-cards').classList.add('shuffle-animation');
        
        // Fisher-Yates shuffle
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
        
        setTimeout(() => {
            this.gameStartButton.querySelector('.stacked-cards').classList.remove('shuffle-animation');
        }, 500);
    }

    dealHand() {
        const handSize = 7;
        const fanAngleSpread = 45;
        const startAngle = -fanAngleSpread / 2;
        const angleStep = fanAngleSpread / (handSize - 1);
        const radius = 750;

        for (let i = 0; i < handSize; i++) {
            const card = this.deck[i];
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

    dealPrizeCards() {
        for (let i = 0; i < 6; i++) {
            const card = this.deck[i + 7];
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

    // Add new method for undo functionality
    undoCardRemoval() {
        if (this.removedCards.length > 0) {
            const cardToRestore = this.removedCards.pop();
            this.deck.push(cardToRestore);
            this.updateDeckDisplay();
            this.updateCounters();
            
            // Hide undo button if no more cards to restore
            const undoBtn = document.getElementById('undoBtn');
            if (undoBtn && this.removedCards.length === 0) {
                undoBtn.style.display = 'none';
            }
        }
    }

    async createSetSuggestions() {
        try {
            // Fetch sets from the Pokémon TCG API instead of local file
            const response = await fetch('https://api.pokemontcg.io/v2/sets');
            const data = await response.json();
            
            // Sort sets by release date (newest first)
            const sortedSets = data.data.sort((a, b) => 
                new Date(b.releaseDate) - new Date(a.releaseDate)
            );
            
            // Create datalist element
            const datalist = document.createElement('datalist');
            datalist.id = 'set-suggestions';
            
            // Add suggestions for both set IDs and names
            sortedSets.forEach(set => {
                // Add set ID suggestion
                const idOption = document.createElement('option');
                idOption.value = `${set.id}-1`;
                idOption.label = `${set.name} (${set.series})`;
                datalist.appendChild(idOption);
                
                // Add set name suggestion
                const nameOption = document.createElement('option');
                nameOption.value = set.name;
                nameOption.label = `${set.series} Series`;
                datalist.appendChild(nameOption);
            });
            
            // Add datalist to document
            document.body.appendChild(datalist);
            
            // Connect datalist to search input
            this.searchInput.setAttribute('list', 'set-suggestions');
            
        } catch (error) {
            console.error('Error loading set suggestions:', error);
        }
    }
}

// Initialize the deck builder when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const deckBuilder = new DeckBuilder();
    
    document.getElementById('clearBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your deck? This action cannot be undone.')) {
            deckBuilder.deck = [];
            deckBuilder.updateDeckDisplay();
            deckBuilder.updateCounters();
        }
    });
}); 