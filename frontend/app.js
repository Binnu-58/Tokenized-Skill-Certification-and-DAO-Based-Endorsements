// SkillDAO Frontend Application
class SkillDAO {
    constructor() {
        // Contract configuration
        this.contractAddress = "0xc37AE2323BA365C18c16225C5b5522DD9B0A64B2";
        this.contractABI = [
            // Add your actual contract ABI here
            // For demo purposes, using standard ERC721 + custom functions
            {
                "inputs": [
                    {"internalType": "string", "name": "skillName", "type": "string"},
                    {"internalType": "uint256", "name": "level", "type": "uint256"},
                    {"internalType": "string", "name": "description", "type": "string"}
                ],
                "name": "createCertification",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"internalType": "uint256", "name": "certificationId", "type": "uint256"},
                    {"internalType": "string", "name": "message", "type": "string"}
                ],
                "name": "endorseSkill",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "uint256", "name": "certificationId", "type": "uint256"}],
                "name": "getCertification",
                "outputs": [
                    {"internalType": "address", "name": "owner", "type": "address"},
                    {"internalType": "string", "name": "skillName", "type": "string"},
                    {"internalType": "uint256", "name": "level", "type": "uint256"},
                    {"internalType": "string", "name": "description", "type": "string"},
                    {"internalType": "uint256", "name": "endorsements", "type": "uint256"},
                    {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "totalSupply",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            }
        ];

        // Web3 instances
        this.web3 = null;
        this.contract = null;
        this.account = null;

        // Initialize the application
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.checkWalletConnection();
        this.updateStats();
        this.loadRecentActivity();
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Wallet connection
        document.getElementById('connectWallet').addEventListener('click', () => this.connectWallet());

        // Form submissions
        document.getElementById('certifyForm').addEventListener('submit', (e) => this.handleCertifySubmit(e));
        document.getElementById('endorseForm').addEventListener('submit', (e) => this.handleEndorseSubmit(e));
        document.getElementById('verifyForm').addEventListener('submit', (e) => this.handleVerifySubmit(e));

        // Smooth scrolling for navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    // Wallet Connection Functions
    async connectWallet() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                // Request account access
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });

                this.web3 = new Web3(window.ethereum);
                this.account = accounts[0];
                
                // Initialize contract
                this.contract = new this.web3.eth.Contract(this.contractABI, this.contractAddress);

                // Update UI
                this.updateWalletUI();
                this.updateBalance();
                
                // Listen for account changes
                window.ethereum.on('accountsChanged', (accounts) => {
                    if (accounts.length === 0) {
                        this.disconnectWallet();
                    } else {
                        this.account = accounts[0];
                        this.updateWalletUI();
                        this.updateBalance();
                    }
                });

                this.showNotification('Wallet connected successfully!', 'success');
            } else {
                this.showNotification('Please install MetaMask to use this application', 'error');
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
            this.showNotification('Failed to connect wallet', 'error');
        }
    }

    async checkWalletConnection() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({
                    method: 'eth_accounts'
                });

                if (accounts.length > 0) {
                    this.web3 = new Web3(window.ethereum);
                    this.account = accounts[0];
                    this.contract = new this.web3.eth.Contract(this.contractABI, this.contractAddress);
                    this.updateWalletUI();
                    this.updateBalance();
                }
            } catch (error) {
                console.error('Error checking wallet connection:', error);
            }
        }
    }

    disconnectWallet() {
        this.web3 = null;
        this.contract = null;
        this.account = null;
        this.updateWalletUI();
    }

    updateWalletUI() {
        const connectBtn = document.getElementById('connectWallet');
        const walletStatus = document.getElementById('walletStatus');
        const connectedAddress = document.getElementById('connectedAddress');

        if (this.account) {
            connectBtn.innerHTML = '<i class="fas fa-check"></i> Connected';
            connectBtn.style.background = 'linear-gradient(45deg, #2ecc71, #27ae60)';
            
            walletStatus.classList.remove('hidden');
            connectedAddress.textContent = `${this.account.substring(0, 6)}...${this.account.substring(38)}`;
        } else {
            connectBtn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
            connectBtn.style.background = 'linear-gradient(45deg, #64ffda, #00bcd4)';
            
            walletStatus.classList.add('hidden');
        }
    }

    async updateBalance() {
        if (this.web3 && this.account) {
            try {
                const balance = await this.web3.eth.getBalance(this.account);
                const ethBalance = this.web3.utils.fromWei(balance, 'ether');
                document.getElementById('ethBalance').textContent = `${parseFloat(ethBalance).toFixed(4)} ETH`;
            } catch (error) {
                console.error('Error fetching balance:', error);
            }
        }
    }

    // Form Handlers
    async handleCertifySubmit(e) {
        e.preventDefault();
        
        if (!this.account) {
            this.showNotification('Please connect your wallet first', 'error');
            return;
        }

        const skillName = document.getElementById('skillName').value;
        const skillLevel = document.getElementById('skillLevel').value;
        const description = document.getElementById('description').value;

        if (!skillName || !skillLevel || !description) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        try {
            this.showLoading(true);

            // Estimate gas
            const gasEstimate = await this.contract.methods
                .createCertification(skillName, skillLevel, description)
                .estimateGas({ from: this.account });

            // Send transaction
            const result = await this.contract.methods
                .createCertification(skillName, skillLevel, description)
                .send({
                    from: this.account,
                    gas: Math.floor(gasEstimate * 1.2)
                });

            this.showNotification('Certification created successfully!', 'success');
            
            // Reset form
            document.getElementById('certifyForm').reset();
            
            // Update stats and activity
            this.updateStats();
            this.addActivityItem('certification', `New certification: ${skillName}`, 'now');

        } catch (error) {
            console.error('Error creating certification:', error);
            this.showNotification('Failed to create certification', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleEndorseSubmit(e) {
        e.preventDefault();
        
        if (!this.account) {
            this.showNotification('Please connect your wallet first', 'error');
            return;
        }

        const certificationId = document.getElementById('certificationId').value;
        const endorsementMessage = document.getElementById('endorsementMessage').value;

        if (!certificationId || !endorsementMessage) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        try {
            this.showLoading(true);

            // Estimate gas
            const gasEstimate = await this.contract.methods
                .endorseSkill(certificationId, endorsementMessage)
                .estimateGas({ from: this.account });

            // Send transaction
            const result = await this.contract.methods
                .endorseSkill(certificationId, endorsementMessage)
                .send({
                    from: this.account,
                    gas: Math.floor(gasEstimate * 1.2)
                });

            this.showNotification('Endorsement submitted successfully!', 'success');
            
            // Reset form
            document.getElementById('endorseForm').reset();
            
            // Update stats and activity
            this.updateStats();
            this.addActivityItem('endorsement', `Endorsed certification #${certificationId}`, 'now');

        } catch (error) {
            console.error('Error endorsing skill:', error);
            this.showNotification('Failed to endorse skill', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleVerifySubmit(e) {
        e.preventDefault();
        
        const verifyId = document.getElementById('verifyId').value;
        
        if (!verifyId) {
            this.showNotification('Please enter a certification ID or address', 'error');
            return;
        }

        try {
            this.showLoading(true);

            let certificationData;
            
            // Check if input is a number (certification ID) or address
            if (/^\d+$/.test(verifyId)) {
                // It's a certification ID
                certificationData = await this.contract.methods.getCertification(verifyId).call();
                this.displayCertificationDetails(verifyId, certificationData);
            } else if (/^0x[a-fA-F0-9]{40}$/.test(verifyId)) {
                // It's an Ethereum address - get all certifications for this address
                this.showNotification('Address lookup feature coming soon!', 'info');
            } else {
                this.showNotification('Invalid certification ID or address format', 'error');
                return;
            }

        } catch (error) {
            console.error('Error verifying certification:', error);
            this.showNotification('Certification not found or invalid', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    displayCertificationDetails(certificationId, data) {
        const resultDiv = document.getElementById('verificationResult');
        const detailsDiv = document.getElementById('certificationDetails');
        
        const levelNames = ['', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];
        const timestamp = new Date(data.timestamp * 1000).toLocaleDateString();
        
        detailsDiv.innerHTML = `
            <div class="cert-detail">
                <strong>Certification ID:</strong> #${certificationId}
            </div>
            <div class="cert-detail">
                <strong>Owner:</strong> ${data.owner}
            </div>
            <div class="cert-detail">
                <strong>Skill:</strong> ${data.skillName}
            </div>
            <div class="cert-detail">
                <strong>Level:</strong> ${levelNames[data.level] || 'Unknown'}
            </div>
            <div class="cert-detail">
                <strong>Description:</strong> ${data.description}
            </div>
            <div class="cert-detail">
                <strong>Endorsements:</strong> ${data.endorsements}
            </div>
            <div class="cert-detail">
                <strong>Created:</strong> ${timestamp}
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    }

    // Stats and Activity Functions
    async updateStats() {
        try {
            if (this.contract) {
                const totalCertifications = await this.contract.methods.totalSupply().call();
                document.getElementById('totalCertifications').textContent = totalCertifications;
                
                // For demo purposes, using mock data for other stats
                document.getElementById('totalEndorsements').textContent = Math.floor(totalCertifications * 2.3);
                document.getElementById('totalValidators').textContent = Math.floor(totalCertifications * 0.7);
            }
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    loadRecentActivity() {
        const activityFeed = document.getElementById('activityFeed');
        
        // Demo activity data
        const activities = [
            {
                type: 'certification',
                title: 'Smart Contract Development Certified',
                description: 'Advanced level certification created',
                time: '2 hours ago',
                icon: 'fas fa-certificate'
            },
            {
                type: 'endorsement',
                title: 'Python Programming Endorsed',
                description: 'Received endorsement from community member',
                time: '4 hours ago',
                icon: 'fas fa-thumbs-up'
            },
            {
                type: 'certification',
                title: 'React Development Certified',
                description: 'Intermediate level certification created',
                time: '1 day ago',
                icon: 'fas fa-certificate'
            },
            {
                type: 'endorsement',
                title: 'Blockchain Architecture Endorsed',
                description: 'Received multiple endorsements',
                time: '2 days ago',
                icon: 'fas fa-heart'
            }
        ];

        activityFeed.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <h4>${activity.title}</h4>
                    <p>${activity.description}</p>
                </div>
                <div class="activity-time">${activity.time}</div>
            </div>
        `).join('');
    }

    addActivityItem(type, title, time) {
        const activityFeed = document.getElementById('activityFeed');
        const iconMap = {
            certification: 'fas fa-certificate',
            endorsement: 'fas fa-thumbs-up'
        };

        const newActivity = `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${iconMap[type]}"></i>
                </div>
                <div class="activity-content">
                    <h4>${title}</h4>
                    <p>Your recent activity</p>
                </div>
                <div class="activity-time">${time}</div>
            </div>
        `;

        activityFeed.insertAdjacentHTML('afterbegin', newActivity);
    }

    // UI Helper Functions
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const icon = notification.querySelector('.notification-icon');
        const messageSpan = notification.querySelector('.notification-message');

        // Set icon based on type
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };

        icon.className = `notification-icon ${iconMap[type]}`;
        messageSpan.textContent = message;
        
        // Set notification type
        notification.className = `notification ${type}`;
        
        // Show notification
        notification.classList.add('show');
        
        // Hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }

    // Utility Functions
    formatAddress(address) {
        return `${address.substring(0, 6)}...${address.substring(38)}`;
    }

    formatTimestamp(timestamp) {
        return new Date(timestamp * 1000).toLocaleDateString();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const skillDAO = new SkillDAO();
});

// Add some additional CSS for certification details
const additionalStyles = `
<style>
.cert-detail {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.cert-detail:last-child {
    border-bottom: none;
}

.cert-detail strong {
    color: #64ffda;
    min-width: 120px;
}
</style>
`;

// Inject additional styles
document.head.insertAdjacentHTML('beforeend', additionalStyles);s
