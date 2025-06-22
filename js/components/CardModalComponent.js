import { Utils } from '../utils.js';

/**
 * Component responsible for handling card detail modal functionality
 */
export class CardModalComponent {
    constructor() {
        this.modalOverlay = null;
        this.modalContent = null;
        this.createModalOverlay();
    }

    /**
     * Create modal overlay for card details
     */
    createModalOverlay() {
        const modalData = Utils.createModalOverlay();
        this.modalOverlay = modalData.overlay;
        this.modalContent = modalData.content;
    }

    /**
     * Show card details in modal
     * @param {Object} card - The card object
     */
    showCardModal(card) {
        if (!this.modalContent) return;

        const modalHTML = this.createCardModalContent(card);
        this.modalContent.innerHTML = modalHTML;
        this.modalOverlay.classList.add('active');

        // Add close button functionality
        const closeButton = this.modalContent.querySelector('.close-button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.hideModal();
            });
        }
    }

    /**
     * Hide the modal
     */
    hideModal() {
        if (this.modalOverlay) {
            this.modalOverlay.classList.remove('active');
        }
    }

    /**
     * Create modal content for card details
     * @param {Object} card - The card object
     * @returns {string} HTML content for modal
     */
    createCardModalContent(card) {
        const priceData = Utils.getCardPriceData(card);
        
        return `
            <div class="card-modal-content">
                <div class="modal-card-image">
                    <img src="${card.images.large}" alt="${card.name}">
                </div>
                <div class="modal-card-details">
                    <h2>
                        ${card.name}
                        ${card.hp ? `<span class="hp">HP ${card.hp}</span>` : ''}
                    </h2>
                    
                    ${card.subtypes ? `<h3>${card.subtypes.join(', ')}</h3>` : ''}
                    
                    ${card.types ? `<p><strong>Type:</strong> ${card.types.join(', ')}</p>` : ''}
                    ${card.set ? `<p><strong>Set:</strong> ${card.set.name}</p>` : ''}
                    ${card.number ? `<p><strong>Number:</strong> ${card.number}</p>` : ''}
                    ${card.rarity ? `<p><strong>Rarity:</strong> ${card.rarity}</p>` : ''}
                    
                    ${priceData.price ? `<p><strong>Price:</strong> $${priceData.price.toFixed(2)}</p>` : ''}
                    
                    ${this.renderCardDetails(card)}
                </div>
            </div>
        `;
    }

    /**
     * Render additional card details
     * @param {Object} card - The card object
     * @returns {string} HTML for card details
     */
    renderCardDetails(card) {
        let detailsHTML = '';

        // Render abilities
        if (card.abilities && card.abilities.length > 0) {
            detailsHTML += '<div class="abilities-section">';
            detailsHTML += '<h3>Abilities</h3>';
            card.abilities.forEach(ability => {
                detailsHTML += `
                    <div class="ability">
                        <p><strong>${ability.name}:</strong> ${ability.text}</p>
                    </div>
                `;
            });
            detailsHTML += '</div>';
        }

        // Render attacks
        if (card.attacks && card.attacks.length > 0) {
            detailsHTML += '<div class="attacks-section">';
            detailsHTML += '<h3>Attacks</h3>';
            card.attacks.forEach(attack => {
                detailsHTML += `
                    <div class="attack">
                        <p>
                            <strong>${attack.name}</strong>
                            ${attack.convertedEnergyCost ? `<span>(${attack.convertedEnergyCost})</span>` : ''}
                            ${attack.damage ? `<span class="damage">${attack.damage}</span>` : ''}
                        </p>
                        ${attack.text ? `<p class="attack-text">${attack.text}</p>` : ''}
                    </div>
                `;
            });
            detailsHTML += '</div>';
        }

        // Render rules
        if (card.rules && card.rules.length > 0) {
            detailsHTML += '<div class="rules-section">';
            detailsHTML += '<h3>Rules</h3>';
            card.rules.forEach(rule => {
                detailsHTML += `<p class="rule-text">${rule}</p>`;
            });
            detailsHTML += '</div>';
        }

        // Render weaknesses and resistances
        if (card.weaknesses || card.resistances) {
            detailsHTML += '<div class="stats-grid">';
            
            if (card.weaknesses && card.weaknesses.length > 0) {
                detailsHTML += `
                    <div class="pokemon-stats">
                        <h3>Weaknesses</h3>
                        ${Utils.renderWeakRes(card.weaknesses)}
                    </div>
                `;
            }
            
            if (card.resistances && card.resistances.length > 0) {
                detailsHTML += `
                    <div class="pokemon-stats">
                        <h3>Resistances</h3>
                        ${Utils.renderWeakRes(card.resistances)}
                    </div>
                `;
            }
            
            detailsHTML += '</div>';
        }

        return detailsHTML;
    }

    /**
     * Get modal overlay element
     * @returns {HTMLElement} Modal overlay
     */
    getModalOverlay() {
        return this.modalOverlay;
    }

    /**
     * Get modal content element
     * @returns {HTMLElement} Modal content
     */
    getModalContent() {
        return this.modalContent;
    }
} 