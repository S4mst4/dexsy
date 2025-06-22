import { Utils } from '../utils.js';

/**
 * Manages deck export and import functionality
 */
export class ExportImportManager {
    constructor() {
        this.fileInput = null;
        this.deckDataCallback = null;
        this.initializeFileInput();
    }

    /**
     * Set the callback function to get current deck data
     * @param {Function} callback - Function that returns the current deck
     */
    setDeckData(callback) {
        this.deckDataCallback = callback;
    }

    /**
     * Get the current deck data
     * @returns {Array} Current deck data
     */
    getCurrentDeck() {
        return this.deckDataCallback ? this.deckDataCallback() : [];
    }

    /**
     * Initialize hidden file input for import
     */
    initializeFileInput() {
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = '.json';
        this.fileInput.style.display = 'none';
        document.body.appendChild(this.fileInput);
    }

    /**
     * Show export modal with format options
     */
    showExportModal() {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'export-modal-overlay';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
        `;

        const modalContent = document.createElement('div');
        modalContent.className = 'export-modal-content';
        modalContent.style.cssText = `
            background: white;
            border-radius: 15px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            animation: modalSlideIn 0.3s ease-out;
        `;

        modalContent.innerHTML = `
            <div style="text-align: center; margin-bottom: 25px;">
                <h2 style="margin: 0 0 10px 0; color: #333; font-size: 24px;">💾 Export Deck</h2>
                <p style="margin: 0; color: #666; font-size: 16px;">Choose your export format</p>
            </div>
            
            <div style="display: flex; gap: 15px; margin-bottom: 25px;">
                <button id="qr-export-btn" style="
                    flex: 1;
                    padding: 20px;
                    border: 2px solid #4CAF50;
                    border-radius: 10px;
                    background: #4CAF50;
                    color: white;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                ">
                    <span style="font-size: 24px;">📱</span>
                    <div>
                        <div style="font-weight: bold;">QR Data</div>
                        <div style="font-size: 12px; opacity: 0.9;">Swift Compatible</div>
                    </div>
                </button>
                
                <button id="full-export-btn" style="
                    flex: 1;
                    padding: 20px;
                    border: 2px solid #2196F3;
                    border-radius: 10px;
                    background: #2196F3;
                    color: white;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                ">
                    <span style="font-size: 24px;">📊</span>
                    <div>
                        <div style="font-weight: bold;">Full Data</div>
                        <div style="font-size: 12px; opacity: 0.9;">Complete Info</div>
                    </div>
                </button>
            </div>
            
            <div style="text-align: center;">
                <button id="cancel-export-btn" style="
                    padding: 12px 24px;
                    border: 2px solid #ccc;
                    border-radius: 8px;
                    background: white;
                    color: #666;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">Cancel</button>
            </div>
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        this.addExportModalEventListeners(modalOverlay);
    }

    /**
     * Add event listeners to export modal
     * @param {HTMLElement} modalOverlay - The modal overlay element
     */
    addExportModalEventListeners(modalOverlay) {
        const qrBtn = modalOverlay.querySelector('#qr-export-btn');
        const fullBtn = modalOverlay.querySelector('#full-export-btn');
        const cancelBtn = modalOverlay.querySelector('#cancel-export-btn');

        // Add hover effects
        this.addHoverEffects(qrBtn, '#4CAF50');
        this.addHoverEffects(fullBtn, '#2196F3');
        this.addHoverEffects(cancelBtn, '#f5f5f5', true);

        // Add click handlers
        qrBtn.addEventListener('click', () => {
            this.exportQRData();
            this.closeExportModal(modalOverlay);
        });

        fullBtn.addEventListener('click', () => {
            this.exportFullData();
            this.closeExportModal(modalOverlay);
        });

        cancelBtn.addEventListener('click', () => {
            this.closeExportModal(modalOverlay);
        });

        // Close modal when clicking outside
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                this.closeExportModal(modalOverlay);
            }
        });

        // Close modal with Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeExportModal(modalOverlay);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * Add hover effects to buttons
     * @param {HTMLElement} button - The button element
     * @param {string} color - The color for hover effect
     * @param {boolean} isCancel - Whether this is a cancel button
     */
    addHoverEffects(button, color, isCancel = false) {
        button.addEventListener('mouseenter', () => {
            if (isCancel) {
                button.style.backgroundColor = color;
            } else {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = `0 8px 20px ${color}40`;
            }
        });
        
        button.addEventListener('mouseleave', () => {
            if (isCancel) {
                button.style.backgroundColor = 'white';
            } else {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = 'none';
            }
        });
    }

    /**
     * Close export modal with animation
     * @param {HTMLElement} modalOverlay - The modal overlay element
     */
    closeExportModal(modalOverlay) {
        modalOverlay.style.animation = 'modalSlideOut 0.3s ease-in';
        setTimeout(() => {
            document.body.removeChild(modalOverlay);
        }, 300);
    }

    /**
     * Export deck as QR-compatible data
     */
    exportQRData() {
        const deck = this.getCurrentDeck();
        if (deck.length === 0) {
            alert('No cards in deck to export.');
            return;
        }
        
        const deckName = prompt('Enter a name for your deck:', 'My Pokemon Deck') || 'My Pokemon Deck';
        
        // Convert deck to Swift-compatible format
        const swiftCompatibleCards = deck.map((card, index) => ({
            name: card.name,
            image_url: card.images && card.images.small ? card.images.small : '',
            qrCodeId: `card_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
        }));

        const swiftCompatibleDeck = {
            name: deckName,
            cards: swiftCompatibleCards
        };

        this.downloadJSON(swiftCompatibleDeck, `${deckName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-qr-deck.json`);
        Utils.showNotification(true, `QR Data deck "${deckName}" exported successfully`);
    }

    /**
     * Export deck as full data
     */
    exportFullData() {
        const deck = this.getCurrentDeck();
        if (deck.length === 0) {
            alert('No cards in deck to export.');
            return;
        }
        
        this.downloadJSON(deck, 'pokemon-deck-full.json');
        Utils.showNotification(true, 'Full Data deck exported successfully');
    }

    /**
     * Download JSON data as a file
     * @param {Object} data - The data to download
     * @param {string} filename - The filename
     */
    downloadJSON(data, filename) {
        const deckData = JSON.stringify(data, null, 2);
        const blob = new Blob([deckData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Import deck from file
     * @param {Function} onImport - Callback function when import is successful
     */
    importDeck(onImport) {
        this.fileInput.click();
        
        this.fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedData = JSON.parse(e.target.result);
                        
                        let cardsToImport = [];
                        let deckName = 'Imported Deck';
                        
                        // Check if it's the new Swift-compatible format
                        if (importedData.name && Array.isArray(importedData.cards)) {
                            cardsToImport = importedData.cards;
                            deckName = importedData.name;
                            
                            // Convert Swift format back to internal format if needed
                            cardsToImport = cardsToImport.map(card => {
                                if (card.image_url && !card.images) {
                                    return {
                                        ...card,
                                        images: {
                                            small: card.image_url,
                                            large: card.image_url
                                        }
                                    };
                                }
                                return card;
                            });
                        } else if (Array.isArray(importedData)) {
                            cardsToImport = importedData;
                        } else {
                            throw new Error('Invalid deck format');
                        }
                        
                        onImport(cardsToImport, deckName);
                        Utils.showNotification(true, `Deck "${deckName}" imported successfully`);
                    } catch (error) {
                        Utils.showNotification(false, 'Error importing deck: Invalid file format');
                    }
                };
                reader.readAsText(file);
            }
            
            // Clear the file input so the same file can be uploaded again
            this.fileInput.value = '';
        }, { once: true });
    }

    /**
     * Get the file input element
     * @returns {HTMLElement} The file input element
     */
    getFileInput() {
        return this.fileInput;
    }
} 