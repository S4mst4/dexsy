class DeckBuilder {
    constructor() {
        this.deck = [];
        this.removedCards = [];  // Track removed cards for undo
        this.showPrices = true; // Initialize price visibility state
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
        this.lastPriceSort = '';
        
        // Add initial search for Base Set
        this.initialBaseSetSearch();

        // Initialize sort button visibility
        this.updateSortButtonVisibility();
    }

    initializeElements() {
        this.searchInput = document.getElementById('search-input');
        this.searchInput.placeholder = '🔍 Search by name, #set-id, @set-name, $subtype';
        this.searchButton = document.getElementById('search-button');
        this.searchResults = document.getElementById('search-results');
        this.deckDisplay = document.getElementById('deck-display');
        this.counters = {
            total: document.getElementById('total-count'),
            pokemon: document.getElementById('pokemon-count'),
            energy: document.getElementById('energy-count'),
            trainer: document.getElementById('trainer-count'),
            price: document.getElementById('price-count')
        };
        
        // Add datalist for set suggestions
        this.createSetSuggestions();

        // Initialize selectors
        this.trainerSubtypeSelector = document.getElementById('trainer-subtype-selector');
        this.pokemonTypeSelector = document.getElementById('pokemon-type-selector');
        this.pokemonStageSelector = document.getElementById('pokemon-stage-selector');
        this.priceSortSelector = document.getElementById('price-sort-selector');
        this.priceToggle = document.getElementById('price-toggle'); // Get the toggle switch
    }

    setupEventListeners() {
        this.searchButton.addEventListener('click', () => this.searchCards());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.searchInput.value.trim()) {
                this.searchCards();
            }
        });
        
        // Add card type selector change listener
        const cardTypeSelector = document.getElementById('card-type-selector');
        cardTypeSelector.addEventListener('change', () => {
            const selectedType = cardTypeSelector.value;
            this.trainerSubtypeSelector.style.display = selectedType === 'trainer' ? 'block' : 'none';
            this.pokemonTypeSelector.style.display = selectedType === 'pokemon' ? 'block' : 'none';
            this.pokemonStageSelector.style.display = selectedType === 'pokemon' ? 'block' : 'none';
        });
        
        // Add price sort selector change listener
        this.priceSortSelector.addEventListener('change', () => {
            if (this.searchResults.children.length > 0) {
                this.sortAndDisplayResults();
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

        // Add sort button listener
        const sortBtn = document.getElementById('sortBtn');
        if (sortBtn) {
            sortBtn.addEventListener('click', () => this.sortDeck());
        }

        // Add listener for the price toggle switch
        this.priceToggle.addEventListener('change', () => {
            this.showPrices = this.priceToggle.checked;
            this.updatePriceVisibility(); // Update visibility when toggled
        });
    }

    // Add new method to build search query
    buildSearchQuery(query) {
        let searchQuery = '';
        
        // Get selected card type
        const cardTypeSelector = document.getElementById('card-type-selector');
        const selectedType = cardTypeSelector ? cardTypeSelector.value : '';
        
        // Get selected trainer subtype if applicable
        const selectedTrainerSubtype = selectedType === 'trainer' && this.trainerSubtypeSelector ? 
            this.trainerSubtypeSelector.value : '';
            
        // Get selected Pokémon type if applicable
        const selectedPokemonType = selectedType === 'pokemon' && this.pokemonTypeSelector ? 
            this.pokemonTypeSelector.value : '';
            
        // Get selected Pokémon stage if applicable
        const selectedPokemonStage = selectedType === 'pokemon' && this.pokemonStageSelector ? 
            this.pokemonStageSelector.value : '';
        
        // Check for rarity prefixes
        if (query.startsWith('$V') && !query.includes('$VMAX') && !query.includes('$VSTAR')) {
            // V cards (excluding VMAX and VSTAR)
            return `(name:"*-V" OR name:"* V" OR name:" V " OR subtypes:"V" OR name:" V") -name:"VMAX" -name:"VSTAR"`;
        } 
        else if (query.startsWith('$GX')) {
            // GX cards
            return `(name:"*-GX" OR name:"* GX" OR name:" GX " OR subtypes:"GX")`;
        } 
        else if (query.startsWith('$EX')) {
            // EX cards
            return `(name:"*-EX" OR name:"* EX" OR name:" EX " OR subtypes:"EX")`;
        } 
        else if (query.startsWith('$VSTAR')) {
            // VSTAR cards
            return `(name:"*VSTAR*" OR subtypes:"VSTAR")`;
        } 
        else if (query.startsWith('$VMAX')) {
            // VMAX cards
            return `(name:"*VMAX*" OR subtypes:"VMAX")`;
        } 
        else if (query.startsWith('$Prism')) {
            // Prism Star cards
            return `(name:"*♢*" OR name:"* Prism Star" OR subtypes:"Prism Star")`;
        } 
        else if (query.startsWith('$ACESPEC')) {
            // ACE SPEC cards
            return `(name:"*ACE SPEC*" OR subtypes:"ACE SPEC" OR rarity:"ACE SPEC")`;
        }
        // If query starts with #, it's a set ID search
        else if (query.startsWith('#')) {
            const setQuery = query.substring(1); // Remove the # prefix
            // Check if it's a set number search (e.g. "#swsh1-1", "#base1-4")
            if (setQuery.match(/^[a-zA-Z0-9]+-\d+$/)) {
                searchQuery = `number:"${setQuery.split('-')[1]}" set.id:"${setQuery.split('-')[0]}"`;
            }
            // Check if it's a set ID without card number (e.g. "#sv1", "#swsh1")
            else {
                searchQuery = `set.id:"${setQuery}"`;
            }
        }
        // If query starts with @, it's a set name/series search
        else if (query.startsWith('@')) {
            const setQuery = query.substring(1); // Remove the @ prefix
            searchQuery = `(set.name:"*${setQuery}*" OR set.series:"*${setQuery}*")`;
        }
        // Default to searching by card name
        else {
            searchQuery = `name:"*${query}*"`;
        }
        
        // Add supertype filter if a type is selected
        if (selectedType) {
            const supertypeQuery = selectedType === 'pokemon' ? 'supertype:"Pokémon"' : 
                                 selectedType === 'trainer' ? 'supertype:"Trainer"' : 
                                 selectedType === 'energy' ? 'supertype:"Energy"' : '';
            
            if (supertypeQuery) {
                searchQuery = searchQuery ? `${searchQuery} AND ${supertypeQuery}` : supertypeQuery;
            }

            // Add trainer subtype filter if applicable
            if (selectedType === 'trainer' && selectedTrainerSubtype) {
                const subtypeQuery = `subtypes:"${selectedTrainerSubtype}"`;
                searchQuery = searchQuery ? `${searchQuery} AND ${subtypeQuery}` : subtypeQuery;
            }
            
            // Add Pokémon type filter if applicable
            if (selectedType === 'pokemon' && selectedPokemonType) {
                const typeQuery = `types:"${selectedPokemonType}"`;
                searchQuery = searchQuery ? `${searchQuery} AND ${typeQuery}` : typeQuery;
            }
            
            // Add Pokémon stage filter if applicable
            if (selectedType === 'pokemon' && selectedPokemonStage) {
                let stageQuery = '';
                if (selectedPokemonStage === 'V') {
                    stageQuery = `(name:"*-V" OR name:"* V" OR name:" V " OR subtypes:"V" OR name:" V") -name:"VMAX" -name:"VSTAR"`;
                } else if (selectedPokemonStage === 'VSTAR') {
                    stageQuery = `(name:"*VSTAR*" OR subtypes:"VSTAR")`;
                } else if (selectedPokemonStage === 'VMAX') {
                    stageQuery = `(name:"*VMAX*" OR subtypes:"VMAX")`;
                } else if (selectedPokemonStage === 'EX') {
                    stageQuery = `(name:"*-EX" OR name:"* EX" OR name:" EX " OR subtypes:"EX")`;
                } else if (selectedPokemonStage === 'GX') {
                    stageQuery = `(name:"*-GX" OR name:"* GX" OR name:" GX " OR subtypes:"GX")`;
                } else {
                    stageQuery = `subtypes:"${selectedPokemonStage}"`;
                }
                searchQuery = searchQuery ? `${searchQuery} AND ${stageQuery}` : stageQuery;
            }
        }
        
        return searchQuery;
    }

    async searchCards() {
        const query = this.searchInput.value.trim();
        
        // Require a query
        if (!query) return;

        // Reset pagination when starting a new search
        this.currentPage = 1;
        this.hasMoreResults = true;
        this.lastSearchQuery = query;
        this.lastPriceSort = this.priceSortSelector.value;
        this.searchResults.innerHTML = '';
        
        // Add loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = '<div class="spinner"></div><p>Searching for cards...</p>';
        loadingIndicator.style.display = 'flex';
        this.searchResults.appendChild(loadingIndicator);

        try {
            this.isLoading = true;
            const searchQuery = this.buildSearchQuery(query);

            const response = await fetch(
                `https://api.pokemontcg.io/v2/cards?q=${searchQuery}&page=${this.currentPage}&pageSize=20`
            );
            const data = await response.json();
            
            // Check if we have more results
            this.hasMoreResults = data.data.length === 20;
            
            this.displaySearchResults(data.data, false);
        } catch (error) {
            console.error('Error searching cards:', error);
            this.searchResults.innerHTML = '<div class="error-message">An error occurred while searching for cards. Please try again.</div>';
        } finally {
            this.isLoading = false;
        }
    }

    async loadMoreCards() {
        if (this.isLoading || !this.hasMoreResults) return;

        try {
            this.isLoading = true;
            this.currentPage++;

            const searchQuery = this.buildSearchQuery(this.lastSearchQuery);

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

    sortAndDisplayResults() {
        const cards = Array.from(this.searchResults.children)
            .filter(el => el.classList.contains('card'))
            .map(cardEl => ({
                element: cardEl,
                price: parseFloat(cardEl.dataset.price) || 0
            }));

        const sortOrder = this.priceSortSelector.value;
        if (sortOrder === 'low') {
            cards.sort((a, b) => a.price - b.price);
        } else if (sortOrder === 'high') {
            cards.sort((a, b) => b.price - a.price);
        }

        // Clear and re-add cards in sorted order
        const nonCardElements = Array.from(this.searchResults.children)
            .filter(el => !el.classList.contains('card'));
        
        this.searchResults.innerHTML = '';
        nonCardElements.forEach(el => this.searchResults.appendChild(el));
        cards.forEach(({ element }) => this.searchResults.appendChild(element));
    }

    displaySearchResults(cards, append = false) {
        if (!append) {
            this.searchResults.innerHTML = '';
        }

        cards.forEach(card => {
            const cardElement = this.createCardElement(card);
            this.searchResults.appendChild(cardElement);
        });

        // Sort results if price sort is active
        if (this.priceSortSelector.value) {
            this.sortAndDisplayResults();
        }
    }

    createCardElement(card, count = 1) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        
        // Get price data
        const priceData = this.getCardPriceData(card);
        const price = priceData.price || 0;
        cardElement.dataset.price = price;
        
        // Create image element with card back as placeholder
        const img = document.createElement('img');
        img.src = card.images.small;
        img.alt = card.name;

        // Add count badge
        const countBadge = document.createElement('div');
        countBadge.className = 'card-count';
        countBadge.textContent = `×${count}`;

        // Add price information
        let priceHTML = '';
        if (priceData.price) {
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
            ${priceHTML}
        `;

        cardElement.innerHTML = buttonsHTML;
        cardElement.insertBefore(img, cardElement.firstChild);
        cardElement.appendChild(countBadge);

        // Add click handler for card zoom
        cardElement.addEventListener('click', (e) => {
            // Ensure click isn't on a button
            if (!e.target.closest('.card-button')) {
                this.showCardModal(card); // Pass the whole card object
            }
        });

        // Add click handler for decrease button
        const decreaseButton = cardElement.querySelector('.decrease-button');
        decreaseButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.decreaseCardQuantity(card);
        });

        // Add click handler for increase button
        const increaseButton = cardElement.querySelector('.increase-button');
        increaseButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.increaseCardQuantity(card);
        });

        // Add click handler for TCGPlayer button
        const tcgPlayerButton = cardElement.querySelector('.tcgplayer-button');
        tcgPlayerButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openTCGPlayer(card);
        });

        return cardElement;
    }

    addCardToDeck(card) {
        this.deck.push(card);
        this.updateDeckDisplay();
        this.updateCounters();
        this.updateSortButtonVisibility();
    }

    // Add new method to increase card quantity
    increaseCardQuantity(card) {
        this.deck.push(card);
        this.updateDeckDisplay();
        this.updateCounters();
    }

    // Add new method to decrease card quantity
    decreaseCardQuantity(card) {
        // Find the last instance of this card in the deck
        const index = this.deck.findIndex(c => 
            c.name === card.name && 
            c.number === card.number && 
            c.set.id === card.set.id
        );
        
        if (index !== -1) {
            this.removeCardFromDeck(index);
            
            // After removing, check if any instances of this card remain in deck
            const isStillInDeck = this.deck.some(c => 
                c.name === card.name && 
                c.number === card.number && 
                c.set.id === card.set.id
            );
            
            // Update status boxes in search results if this card is visible there
            this.updateCardStatusInSearchResults(card, isStillInDeck);
        }
    }
    
    // New method to update card status in search results
    updateCardStatusInSearchResults(card, isInDeck) {
        // Find all matching cards in the search results
        const searchResultCards = this.searchResults.querySelectorAll('.card');
        
        searchResultCards.forEach(cardElement => {
            // Get the card img element to check its alt text (which contains the card name)
            const imgElement = cardElement.querySelector('img');
            if (!imgElement) return;
            
            // First do a quick name check to filter most non-matching cards
            if (imgElement.alt !== card.name) return;
            
            // Find status box
            const statusBox = cardElement.querySelector('.status-box');
            if (!statusBox) return;
            
            // We need to do more than a name check - card might have multiple printings
            // For now, assume the name match is sufficient as we can't easily get the set/number from DOM
            // This can be improved if needed by storing data attributes
            
            if (isInDeck) {
                // Count how many of this card are in the deck
                const cardCount = this.deck.filter(c => 
                    c.name === card.name && 
                    c.number === card.number && 
                    c.set.id === card.set.id
                ).length;
                
                statusBox.classList.remove('not-in-deck');
                statusBox.classList.add('in-deck');
                
                // Add or update count indicator
                let countIndicator = statusBox.querySelector('.card-count-indicator');
                if (!countIndicator) {
                    countIndicator = document.createElement('span');
                    countIndicator.className = 'card-count-indicator';
                    statusBox.appendChild(countIndicator);
                }
                countIndicator.textContent = cardCount;
                statusBox.innerHTML = `✔<span class="card-count-indicator">${cardCount}</span>`;
            } else {
                statusBox.classList.remove('in-deck');
                statusBox.classList.add('not-in-deck');
                statusBox.textContent = '❌';
            }
        });
    }
    
    removeCardFromDeck(index) {
        // Store the removed card for undo
        const removedCard = this.deck[index];
        this.removedCards.push(removedCard);
        
        // Remove only the card at the specified index
        this.deck.splice(index, 1);
        
        this.updateDeckDisplay();
        this.updateCounters();
        
        // Show undo button if we have removed cards
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
            undoBtn.style.display = this.removedCards.length > 0 ? 'block' : 'none';
        }
    }

    // Enhanced helper method to get card price and rarity data
    getCardPriceData(card) {
        let priceData = { 
            price: null,
            category: null,
            updatedAt: null
        };
        
        if (card.tcgplayer && card.tcgplayer.prices) {
            // Get the first available price category (normal, holofoil, etc.)
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

    updateDeckDisplay() {
        this.deckDisplay.innerHTML = '';
        
        // Create a map to count duplicate cards and track their first occurrence
        const cardCounts = new Map();
        const firstOccurrence = new Map();
        
        // First pass: count cards and record first occurrence
        this.deck.forEach((card, index) => {
            const cardKey = `${card.name}-${card.number}-${card.set.id}`;
            cardCounts.set(cardKey, (cardCounts.get(cardKey) || 0) + 1);
            if (!firstOccurrence.has(cardKey)) {
                firstOccurrence.set(cardKey, { card, index });
            }
        });

        // Sort by the original order of first appearance
        const sortedCards = Array.from(firstOccurrence.entries())
            .sort((a, b) => a[1].index - b[1].index);

        // Display cards in their original order
        sortedCards.forEach(([cardKey, { card }]) => {
            const count = cardCounts.get(cardKey);
            const cardElement = this.createCardElement(card, count);
            this.deckDisplay.appendChild(cardElement);
        });

        this.updateSortButtonVisibility();
        this.updatePriceVisibility(); // Ensure prices are shown/hidden correctly on initial load/update
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
            
            // Add price if available
            const priceData = this.getCardPriceData(card);
            if (priceData.price) {
                acc.price += priceData.price;
            }
            
            return acc;
        }, { total: 0, pokemon: 0, energy: 0, trainer: 0, price: 0 });

        // Update count displays
        for (const key of ['total', 'pokemon', 'energy', 'trainer']) {
            this.counters[key].textContent = counts[key];
        }
        
        // Format and update price display
        this.counters.price.textContent = '$' + counts.price.toFixed(2);

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

    // Helper to render energy cost symbols (replace with actual symbols/images later if needed)
    renderEnergyCost(cost) {
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
            const color = typeColors[type] || '#A8A878'; // Default to colorless if type not found
            return `<span class="energy-symbol" style="background-color: ${color}">${type.charAt(0)}</span>`;
        }).join('');
    }

    // Helper to render weaknesses/resistances
    renderWeakRes(items) {
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
            const color = typeColors[item.type] || '#A8A878'; // Default to colorless if type not found
            return `<span class="energy-symbol" style="background-color: ${color}">${item.type.charAt(0)}</span> ${item.value}`;
        }).join(', ');
    }

    showCardModal(card) {
        // Clear previous content
        this.modalContent.innerHTML = '';

        // Create main container for modal content
        const modalDiv = document.createElement('div');
        modalDiv.className = 'card-modal-content';

        // Card Image
        const img = document.createElement('img');
        img.src = card.images.large || card.images.small;
        img.alt = card.name;
        img.className = 'modal-card-image';
        modalDiv.appendChild(img);

        // Details Container
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'modal-card-details';

        // Basic Info
        detailsDiv.innerHTML += `<h2>${card.name} ${card.hp ? '<span class="hp">HP ' + card.hp + '</span>' : ''}</h2>`;
        detailsDiv.innerHTML += `<p><strong>Set:</strong> ${card.set.name} #${card.number}</p>`;
        if (card.rarity) {
          detailsDiv.innerHTML += `<p><strong>Rarity:</strong> ${card.rarity}</p>`;
        }

        // Attacks (if Pokémon)
        if (card.attacks && card.attacks.length > 0) {
            detailsDiv.innerHTML += `<h3>Attacks</h3>`;
            card.attacks.forEach(attack => {
                detailsDiv.innerHTML += `
                    <div class="attack-detail">
                        <p><strong>${attack.name}</strong> ${this.renderEnergyCost(attack.cost)} ${attack.damage ? '<span class="damage">' + attack.damage + '</span>' : ''}</p>
                        ${attack.text ? '<p class="attack-text">' + attack.text + '</p>' : ''}
                    </div>
                `;
            });
        }
        
        // Abilities (if any)
        if (card.abilities && card.abilities.length > 0) {
            detailsDiv.innerHTML += `<h3>Abilities</h3>`;
            card.abilities.forEach(ability => {
                detailsDiv.innerHTML += `
                    <div class="ability-detail">
                        <p><strong>${ability.name}</strong> (${ability.type})</p>
                        <p class="ability-text">${ability.text}</p>
                    </div>
                `;
            });
        }

        // Rules (if any)
        if (card.rules && card.rules.length > 0) {
            detailsDiv.innerHTML += `<h3>Rules</h3>`;
            card.rules.forEach(rule => {
                 detailsDiv.innerHTML += `<p class="rule-text">${rule}</p>`;
            });
        }

        // Weakness, Resistance, Retreat Cost (if Pokémon)
        if (card.supertype?.toLowerCase() === 'pokemon') {
             detailsDiv.innerHTML += `<div class="stats-grid pokemon-stats">
                <p><strong>Weakness:</strong> ${this.renderWeakRes(card.weaknesses)}</p>
                <p><strong>Resistance:</strong> ${this.renderWeakRes(card.resistances)}</p>
                <p><strong>Retreat Cost:</strong> ${this.renderEnergyCost(card.retreatCost)}</p>
             </div>`;
        }

        modalDiv.appendChild(detailsDiv);
        this.modalContent.appendChild(modalDiv);

        // Show the modal
        this.modalOverlay.classList.add('active');
    }

    setupExportImport() {
        // Create hidden file input for import
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        // Create notification element for import status
        const importNotification = document.createElement('div');
        importNotification.className = 'import-notification';
        importNotification.style.position = 'fixed';
        importNotification.style.top = '20px';
        importNotification.style.right = '20px';
        importNotification.style.padding = '10px 15px';
        importNotification.style.borderRadius = '5px';
        importNotification.style.fontWeight = 'bold';
        importNotification.style.display = 'none';
        importNotification.style.zIndex = '1000';
        importNotification.style.transition = 'opacity 0.5s ease-in-out';
        document.body.appendChild(importNotification);

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

        // Show import status notification
        const showImportNotification = (success, message) => {
            importNotification.textContent = success ? '✓ ' + message : '✗ ' + message;
            importNotification.style.backgroundColor = success ? '#4CAF50' : '#F44336';
            importNotification.style.color = 'white';
            importNotification.style.display = 'block';
            importNotification.style.opacity = '1';
            
            // Hide the notification after 3 seconds
            setTimeout(() => {
                importNotification.style.opacity = '0';
                setTimeout(() => {
                    importNotification.style.display = 'none';
                }, 500);
            }, 3000);
        };

        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedDeck = JSON.parse(e.target.result);
                        
                        // Validate the imported data
                        if (!Array.isArray(importedDeck)) {
                            throw new Error('Invalid deck format');
                        }
                        
                        this.deck = importedDeck;
                        this.updateDeckDisplay();
                        this.updateCounters();
                        this.updateSortButtonVisibility();
                        
                        // Show success notification
                        showImportNotification(true, 'Deck imported successfully');
                    } catch (error) {
                        // Show error notification
                        showImportNotification(false, 'Error importing deck: Invalid file format');
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
            
            // Update status indicators in search results
            this.updateCardStatusInSearchResults(cardToRestore, true);
            
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
                // Add set ID suggestion with # prefix (without -1)
                const idOption = document.createElement('option');
                idOption.value = `#${set.id}`;
                idOption.label = `${set.name} (${set.series}) - ID Search`;
                datalist.appendChild(idOption);
                
                // Add set name suggestion with @ prefix
                const nameOption = document.createElement('option');
                nameOption.value = `@${set.name}`;
                nameOption.label = `${set.series} Series - Name Search`;
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

    // Add new method for initial Base Set search
    initialBaseSetSearch() {
        // Fetch sets from the Pokémon TCG API
        fetch('https://api.pokemontcg.io/v2/sets')
            .then(response => response.json())
            .then(data => {
                // Sort sets by release date (newest first)
                const sortedSets = data.data.sort((a, b) => 
                    new Date(b.releaseDate) - new Date(a.releaseDate)
                );
                
                // Get the newest set
                const newestSet = sortedSets[0];
                
                // Set the search input value to the newest set's ID
                this.searchInput.value = `#${newestSet.id}`;
                
                // Trigger the search
                this.searchCards();
            })
            .catch(error => {
                console.error('Error fetching newest set:', error);
                // Fallback to Base Set if there's an error
                this.searchInput.value = "#base1";
                this.searchCards();
            });
    }

    // Add new method for sorting the deck
    sortDeck() {
        // Define sort order for supertypes
        const typeOrder = {
            'pokémon': 1,
            'pokemon': 1,  // Handle both forms of spelling
            'trainer': 2,
            'energy': 3
        };

        // Define sort order for Pokémon types
        const pokemonTypeOrder = {
            'grass': 1,
            'water': 2,
            'fire': 3,
            'lightning': 4,
            'colorless': 5,
            'darkness': 6,
            'metal': 7,
            'dragon': 8,
            'psychic': 9
        };

        // Define sort order for Trainer subtypes
        const trainerSubtypeOrder = {
            'supporter': 1,
            'item': 2,
            'pokemon tool': 3,
            'stadium': 4
        };

        // Define sort order for Pokemon stages
        const stageOrder = {
            'stage 2': 1,
            'stage 1': 2,
            'basic': 3
        };

        // Sort the deck array
        this.deck.sort((a, b) => {
            const typeA = (a.supertype || '').toLowerCase();
            const typeB = (b.supertype || '').toLowerCase();
            
            // Get order values (default to highest number if type not found)
            const orderA = typeOrder[typeA] || 999;
            const orderB = typeOrder[typeB] || 999;
            
            // Sort by supertype order first
            if (orderA !== orderB) {
                return orderA - orderB;
            }

            // If both are Pokémon, sort by type and stage
            if (typeA === 'pokémon' || typeA === 'pokemon') {
                const pokemonTypeA = (a.types && a.types[0] || '').toLowerCase();
                const pokemonTypeB = (b.types && b.types[0] || '').toLowerCase();
                
                const pokemonOrderA = pokemonTypeOrder[pokemonTypeA] || 999;
                const pokemonOrderB = pokemonTypeOrder[pokemonTypeB] || 999;

                if (pokemonOrderA !== pokemonOrderB) {
                    return pokemonOrderA - pokemonOrderB;
                }

                // Within same type, sort by stage
                const stageA = (a.subtypes && a.subtypes.find(s => s.toLowerCase().includes('stage')) || 'basic').toLowerCase();
                const stageB = (b.subtypes && b.subtypes.find(s => s.toLowerCase().includes('stage')) || 'basic').toLowerCase();
                
                const stageOrderA = stageOrder[stageA] || 999;
                const stageOrderB = stageOrder[stageB] || 999;

                if (stageOrderA !== stageOrderB) {
                    return stageOrderA - stageOrderB;
                }
            }

            // If both are Trainers, sort by subtype
            if (typeA === 'trainer') {
                const trainerSubtypeA = (a.subtypes && a.subtypes[0] || '').toLowerCase();
                const trainerSubtypeB = (b.subtypes && b.subtypes[0] || '').toLowerCase();
                
                const trainerOrderA = trainerSubtypeOrder[trainerSubtypeA] || 999;
                const trainerOrderB = trainerSubtypeOrder[trainerSubtypeB] || 999;

                if (trainerOrderA !== trainerOrderB) {
                    return trainerOrderA - trainerOrderB;
                }
            }

            // If both are Energy, sort by type (using same order as Pokemon types)
            if (typeA === 'energy') {
                const energyTypeA = (a.subtypes && a.subtypes.includes('Basic') ? a.name.split(' ')[0] : '').toLowerCase();
                const energyTypeB = (b.subtypes && b.subtypes.includes('Basic') ? b.name.split(' ')[0] : '').toLowerCase();
                
                const energyOrderA = pokemonTypeOrder[energyTypeA] || 999;
                const energyOrderB = pokemonTypeOrder[energyTypeB] || 999;

                if (energyOrderA !== energyOrderB) {
                    return energyOrderA - energyOrderB;
                }
            }
            
            // Within same type/subtype/stage, sort by name
            return a.name.localeCompare(b.name);
        });

        // Update the display
        this.updateDeckDisplay();
    }

    // Add new method to handle sort button visibility
    updateSortButtonVisibility() {
        const sortBtn = document.getElementById('sortBtn');
        if (sortBtn) {
            sortBtn.style.display = this.deck.length > 0 ? 'block' : 'none';
        }
    }

    // Add new method to handle opening TCGPlayer
    openTCGPlayer(card) {
        // Construct the TCGPlayer search URL using just name and set
        const searchQuery = encodeURIComponent(`${card.name} ${card.set.name}`);
        const tcgPlayerUrl = `https://www.tcgplayer.com/search/pokemon/${card.set.name.toLowerCase()}?q=${searchQuery}&productLineName=pokemon`;
        window.open(tcgPlayerUrl, '_blank');
    }

    resetAllCardStatus() {
        // Find all status boxes in search results and reset them to ❌
        const statusBoxes = this.searchResults.querySelectorAll('.status-box');
        statusBoxes.forEach(statusBox => {
            statusBox.classList.remove('in-deck');
            statusBox.classList.add('not-in-deck');
            statusBox.innerHTML = '❌';
        });
    }

    // New method to toggle price visibility in the deck display
    updatePriceVisibility() {
        const cardElements = this.deckDisplay.querySelectorAll('.card');
        cardElements.forEach(cardElement => {
            const priceBadge = cardElement.querySelector('.price-badge');
            if (priceBadge) {
                priceBadge.style.display = this.showPrices ? 'block' : 'none';
            }
        });
    }
}

// Initialize the deck builder when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const deckBuilder = new DeckBuilder();
    
    document.getElementById('clearBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your deck? This action cannot be undone.')) {
            // Store the cards being removed
            const removedCards = [...deckBuilder.deck];
            
            // Clear the deck
            deckBuilder.deck = [];
            deckBuilder.updateDeckDisplay();
            deckBuilder.updateCounters();
            deckBuilder.updateSortButtonVisibility();
            
            // Update all card status indicators in search results
            deckBuilder.resetAllCardStatus();
        }
    });
}); 