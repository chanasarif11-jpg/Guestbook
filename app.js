/**
 * Muhammad Anas - Blockchain Guestbook
 * Main Application Logic (Web3.js + MetaMask)
 */

import {
    DEFAULT_CONTRACT_ADDRESS,
    SEPOLIA_CHAIN_ID,
    SEPOLIA_CHAIN_ID_DECIMAL,
    SEPOLIA_NETWORK_PARAMS,
    CONTRACT_ABI,
    getActiveContractAddress,
    setActiveContractAddress
} from './config.js';

// Application State
let web3Instance = null;
let guestbookContract = null;
let currentAccount = null;
let currentChainId = null;
let activeContractAddress = getActiveContractAddress();
let isSubmitting = false;

// DOM Elements
const connectWalletBtn = document.getElementById('connectWalletBtn');
const connectWalletText = document.getElementById('connectWalletText');
const networkBadge = document.getElementById('networkBadge');
const networkName = document.getElementById('networkName');
const networkWarning = document.getElementById('networkWarning');
const switchNetworkBtn = document.getElementById('switchNetworkBtn');
const navContractAddr = document.getElementById('navContractAddr');
const footerContractLink = document.getElementById('footerContractLink');

// Stats Elements
const statTotalMessages = document.getElementById('statTotalMessages');
const statNetwork = document.getElementById('statNetwork');
const statContractStatus = document.getElementById('statContractStatus');
const statContractMeta = document.getElementById('statContractMeta');

// Form Elements
const guestbookForm = document.getElementById('guestbookForm');
const visitorNameInput = document.getElementById('visitorNameInput');
const messageInput = document.getElementById('messageInput');
const nameCounter = document.getElementById('nameCounter');
const charCounter = document.getElementById('charCounter');
const nameError = document.getElementById('nameError');
const messageError = document.getElementById('messageError');
const submitBtn = document.getElementById('submitBtn');
const submitBtnText = document.getElementById('submitBtnText');
const btnSpinner = document.getElementById('btnSpinner');
const walletPrompt = document.getElementById('walletPrompt');

// Transaction Card Elements
const txInfoCard = document.getElementById('txInfoCard');
const txStatusBadge = document.getElementById('txStatusBadge');
const txStatusMessage = document.getElementById('txStatusMessage');
const txTime = document.getElementById('txTime');
const txHashRow = document.getElementById('txHashRow');
const txHashText = document.getElementById('txHashText');
const copyTxHashBtn = document.getElementById('copyTxHashBtn');
const etherscanTxLink = document.getElementById('etherscanTxLink');

// Messages Wall Elements
const messagesContainer = document.getElementById('messagesContainer');
const messagesCountBadge = document.getElementById('messagesCountBadge');
const refreshBtn = document.getElementById('refreshBtn');
const refreshIcon = document.getElementById('refreshIcon');
const emptyState = document.getElementById('emptyState');

// Contract Settings Modal
const contractModal = document.getElementById('contractModal');
const openContractModalBtn = document.getElementById('openContractModalBtn');
const closeContractModalBtn = document.getElementById('closeContractModalBtn');
const cancelContractModalBtn = document.getElementById('cancelContractModalBtn');
const saveContractModalBtn = document.getElementById('saveContractModalBtn');
const resetContractBtn = document.getElementById('resetContractBtn');
const customContractInput = document.getElementById('customContractInput');
const defaultContractDisplay = document.getElementById('defaultContractDisplay');
const contractModalError = document.getElementById('contractModalError');

// Toast Container
const toastContainer = document.getElementById('toastContainer');

// ============================================================================
// Initialization
// ============================================================================

window.addEventListener('DOMContentLoaded', async () => {
    updateContractAddressUI();
    setupEventListeners();
    await initWeb3Provider();
    await refreshMessagesWall();
});

/**
 * Initialize Web3 provider:
 * 1. If MetaMask (window.ethereum) is available, wrap it.
 * 2. If not, fallback to public Sepolia RPC for read-only view.
 */
async function initWeb3Provider() {
    if (typeof window.ethereum !== 'undefined') {
        web3Instance = new Web3(window.ethereum);
        
        // Check already connected accounts
        try {
            const accounts = await web3Instance.eth.getAccounts();
            if (accounts && accounts.length > 0) {
                handleAccountsChanged(accounts);
            } else {
                updateWalletUI(null);
            }

            const chainId = await web3Instance.eth.getChainId();
            handleChainChanged(chainId);

            // Setup MetaMask event listeners
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', (newChainId) => {
                // MetaMask recommends reloading the page on chain change, or handle dynamically:
                handleChainChanged(newChainId);
                refreshMessagesWall();
            });
        } catch (err) {
            console.warn('Error querying MetaMask initial state:', err);
            updateWalletUI(null);
        }
    } else {
        // Fallback to public Sepolia RPC for reading data without MetaMask
        console.log('MetaMask not detected, using public Sepolia RPC for read-only access.');
        const fallbackRpc = SEPOLIA_NETWORK_PARAMS.rpcUrls[0];
        web3Instance = new Web3(new Web3.providers.HttpProvider(fallbackRpc));
        updateWalletUI(null);
        setNetworkStatus('Sepolia (Public Read-Only)', true);
    }

    instantiateContract();
}

/**
 * Instantiate the Guestbook smart contract with Web3
 */
function instantiateContract() {
    if (!web3Instance) return;

    try {
        guestbookContract = new web3Instance.eth.Contract(CONTRACT_ABI, activeContractAddress);
        statContractStatus.textContent = 'Active';
        statContractStatus.className = 'stat-value text-emerald';
        statContractMeta.textContent = formatTruncated(activeContractAddress);
    } catch (err) {
        console.error('Error instantiating contract:', err);
        statContractStatus.textContent = 'Config Error';
        statContractStatus.className = 'stat-value text-rose';
        statContractMeta.textContent = 'Invalid address';
    }
}

// ============================================================================
// Wallet & Network Handling
// ============================================================================

async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        showToast('MetaMask Required', 'Please install MetaMask extension to submit messages.', 'error');
        window.open('https://metamask.io/download/', '_blank');
        return;
    }

    try {
        connectWalletBtn.disabled = true;
        connectWalletText.textContent = 'Connecting...';

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        handleAccountsChanged(accounts);

        // Verify or switch network to Sepolia
        const chainId = await web3Instance.eth.getChainId();
        if (Number(chainId) !== SEPOLIA_CHAIN_ID_DECIMAL) {
            await promptSwitchToSepolia();
        } else {
            showToast('Wallet Connected', `Connected as ${formatTruncated(accounts[0])}`, 'success');
        }

        await refreshMessagesWall();
    } catch (err) {
        console.error('User rejected or error connecting wallet:', err);
        if (err.code === 4001) {
            showToast('Connection Cancelled', 'You rejected the MetaMask connection request.', 'info');
        } else {
            showToast('Connection Error', err.message || 'Failed to connect wallet.', 'error');
        }
    } finally {
        connectWalletBtn.disabled = false;
    }
}

function handleAccountsChanged(accounts) {
    if (!accounts || accounts.length === 0) {
        currentAccount = null;
        updateWalletUI(null);
    } else {
        currentAccount = accounts[0];
        updateWalletUI(currentAccount);
    }
    updateSubmitButtonState();
}

function handleChainChanged(chainId) {
    currentChainId = typeof chainId === 'string' ? parseInt(chainId, 16) : Number(chainId);
    const isSepolia = currentChainId === SEPOLIA_CHAIN_ID_DECIMAL;

    if (isSepolia) {
        setNetworkStatus('Sepolia Testnet', true);
        networkWarning.style.display = 'none';
        statNetwork.textContent = 'Sepolia';
        statNetwork.className = 'stat-value text-indigo';
    } else {
        setNetworkStatus(`Wrong Network (${currentChainId})`, false);
        networkWarning.style.display = 'flex';
        statNetwork.textContent = 'Wrong Net';
        statNetwork.className = 'stat-value text-rose';
    }
    updateSubmitButtonState();
}

function setNetworkStatus(name, isValid) {
    networkName.textContent = name;
    if (isValid) {
        networkBadge.className = 'badge badge-network';
        networkBadge.onclick = null;
    } else {
        networkBadge.className = 'badge badge-network wrong-network';
        networkBadge.onclick = promptSwitchToSepolia;
    }
}

async function promptSwitchToSepolia() {
    if (!window.ethereum) return;
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SEPOLIA_CHAIN_ID }]
        });
        showToast('Network Switched', 'Switched to Ethereum Sepolia Testnet.', 'success');
    } catch (switchError) {
        // Error code 4902 indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [SEPOLIA_NETWORK_PARAMS]
                });
                showToast('Network Added', 'Sepolia Testnet added and selected.', 'success');
            } catch (addError) {
                console.error('Failed to add Sepolia network:', addError);
                showToast('Network Error', 'Failed to add Sepolia to MetaMask.', 'error');
            }
        } else {
            console.error('Failed to switch network:', switchError);
            showToast('Switch Error', switchError.message, 'error');
        }
    }
}

function updateWalletUI(account) {
    if (account) {
        connectWalletBtn.classList.add('connected');
        connectWalletText.textContent = formatTruncated(account);
        connectWalletBtn.title = `Connected: ${account} (Click to switch account)`;
        walletPrompt.style.display = 'none';
    } else {
        connectWalletBtn.classList.remove('connected');
        connectWalletText.textContent = 'Connect MetaMask';
        connectWalletBtn.title = 'Connect with MetaMask wallet';
        walletPrompt.style.display = 'flex';
    }
    updateSubmitButtonState();
}

function updateSubmitButtonState() {
    const isReady = currentAccount && (currentChainId === SEPOLIA_CHAIN_ID_DECIMAL || currentChainId === null);
    
    if (!currentAccount) {
        submitBtn.disabled = true;
        submitBtnText.textContent = 'Connect Wallet to Sign';
    } else if (currentChainId && currentChainId !== SEPOLIA_CHAIN_ID_DECIMAL) {
        submitBtn.disabled = true;
        submitBtnText.textContent = 'Switch to Sepolia First';
    } else if (isSubmitting) {
        submitBtn.disabled = true;
        submitBtnText.textContent = 'Confirming in MetaMask...';
    } else {
        submitBtn.disabled = false;
        submitBtnText.textContent = 'Sign Guestbook (.send())';
    }
}

// ============================================================================
// Message Submission (.send() - Write Operation)
// ============================================================================

guestbookForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentAccount) {
        await connectWallet();
        return;
    }

    if (currentChainId && currentChainId !== SEPOLIA_CHAIN_ID_DECIMAL) {
        await promptSwitchToSepolia();
        return;
    }

    const visitorName = visitorNameInput.value.trim();
    const message = messageInput.value.trim();

    // Validation
    let hasError = false;
    nameError.textContent = '';
    messageError.textContent = '';
    visitorNameInput.classList.remove('is-invalid');
    messageInput.classList.remove('is-invalid');

    if (!visitorName) {
        nameError.textContent = 'Visitor name is required.';
        visitorNameInput.classList.add('is-invalid');
        hasError = true;
    }

    if (!message) {
        messageError.textContent = 'Message is required.';
        messageInput.classList.add('is-invalid');
        hasError = true;
    } else if (message.length > 200) {
        messageError.textContent = `Message exceeds 200 characters (Current: ${message.length}).`;
        messageInput.classList.add('is-invalid');
        hasError = true;
    }

    if (hasError) return;

    if (!guestbookContract) {
        showToast('Error', 'Smart contract instance is not ready.', 'error');
        return;
    }

    try {
        isSubmitting = true;
        btnSpinner.style.display = 'inline-block';
        updateSubmitButtonState();

        // Reveal Transaction Status Card
        showTxStatusCard('pending', 'Waiting for signature in MetaMask...');

        // Execute smart contract write call: .send()
        console.log(`Submitting message via .send() from ${currentAccount}...`);

        let txHashCaptured = null;

        const receipt = await guestbookContract.methods
            .addMessage(visitorName, message)
            .send({ from: currentAccount })
            .on('transactionHash', (hash) => {
                txHashCaptured = hash;
                console.log('Transaction Broadcasted:', hash);
                updateTxCardBroadcast(hash);
                showToast('Transaction Sent', 'Transaction broadcasted to Sepolia! Mining block...', 'info');
            })
            .on('receipt', (rcpt) => {
                console.log('Transaction Receipt:', rcpt);
            });

        const finalTxHash = receipt.transactionHash || txHashCaptured;
        
        // Submission Success
        showTxStatusCard('success', 'Message confirmed and permanently recorded on Ethereum Sepolia!', finalTxHash);
        showToast('Success!', 'Your message has been added to the guestbook!', 'success');

        // Clear Form inputs
        visitorNameInput.value = '';
        messageInput.value = '';
        updateCounters();

        // Requirement 6: Automatically refresh the message list after submission
        await refreshMessagesWall();

    } catch (err) {
        console.error('Error submitting message via .send():', err);
        
        if (err.code === 4001) {
            showTxStatusCard('error', 'Transaction rejected by user in MetaMask.');
            showToast('Transaction Rejected', 'You rejected the transaction in MetaMask.', 'info');
        } else {
            const errorMsg = err.message || 'Transaction failed on blockchain.';
            showTxStatusCard('error', `Submission failed: ${errorMsg}`);
            showToast('Submission Failed', errorMsg, 'error');
        }
    } finally {
        isSubmitting = false;
        btnSpinner.style.display = 'none';
        updateSubmitButtonState();
    }
});

// ============================================================================
// Message Retrieval (.call() - Read Operation)
// ============================================================================

async function refreshMessagesWall() {
    if (!guestbookContract) {
        instantiateContract();
        if (!guestbookContract) return;
    }

    refreshIcon.classList.add('spin-once');
    setTimeout(() => refreshIcon.classList.remove('spin-once'), 600);

    try {
        // Requirement 7: Use .call() for total message count
        const totalCountRaw = await guestbookContract.methods.getTotalMessages().call();
        const totalCount = Number(totalCountRaw);

        // Update Counters (Requirement 5)
        statTotalMessages.textContent = totalCount;
        messagesCountBadge.textContent = totalCount;

        if (totalCount === 0) {
            messagesContainer.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        // Requirement 4: Retrieve all messages and display the latest messages first
        // We loop from totalCount - 1 down to 0
        const messagePromises = [];
        for (let i = totalCount - 1; i >= 0; i--) {
            messagePromises.push(
                guestbookContract.methods.getMessage(i).call().then(res => ({
                    index: i,
                    visitorName: res[0] ?? res.visitorName,
                    message: res[1] ?? res.message,
                    sender: res[2] ?? res.sender,
                    timestamp: Number(res[3] ?? res.timestamp)
                }))
            );
        }

        const messages = await Promise.all(messagePromises);
        renderMessages(messages);

    } catch (err) {
        console.error('Error reading messages via .call():', err);
        messagesContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3>Unable to Read Messages</h3>
                <p style="margin-top: 8px;">Ensure contract address <code>${formatTruncated(activeContractAddress)}</code> is deployed on Sepolia.</p>
                <button class="btn btn-secondary btn-sm" style="margin-top: 14px;" onclick="window.location.reload()">Retry</button>
            </div>
        `;
    }
}

/**
 * Render messages in the wall container
 */
function renderMessages(messages) {
    messagesContainer.innerHTML = '';

    messages.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'message-entry';

        const avatarColor = getAddressColor(item.sender);
        const initials = getInitials(item.visitorName);
        const formattedDate = formatTimestamp(item.timestamp);
        const relativeTime = getRelativeTime(item.timestamp);
        const etherscanAddressUrl = `https://sepolia.etherscan.io/address/${item.sender}`;

        card.innerHTML = `
            <div class="message-meta-top">
                <div class="visitor-info">
                    <div class="visitor-avatar" style="background: ${avatarColor};">
                        ${escapeHtml(initials)}
                    </div>
                    <div class="visitor-name-group">
                        <span class="visitor-name">${escapeHtml(item.visitorName)}</span>
                        <span class="message-badge-index">Entry #${item.index + 1}</span>
                    </div>
                </div>
                <div class="message-time" title="${formattedDate}">
                    ${relativeTime}
                </div>
            </div>

            <div class="message-body">${escapeHtml(item.message)}</div>

            <div class="message-meta-bottom">
                <a href="${etherscanAddressUrl}" target="_blank" rel="noopener noreferrer" class="sender-address" title="View sender address on Sepolia Etherscan">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
                        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
                        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
                    </svg>
                    <span>${formatTruncated(item.sender)}</span>
                    <span>↗</span>
                </a>
                <span class="exact-date">${formattedDate}</span>
            </div>
        `;

        messagesContainer.appendChild(card);
    });
}

// ============================================================================
// Transaction Card Helpers
// ============================================================================

function showTxStatusCard(status, message, txHash = null) {
    txInfoCard.style.display = 'block';
    txTime.textContent = 'Just now';
    txStatusMessage.textContent = message;

    if (status === 'pending') {
        txStatusBadge.className = 'tx-status-badge';
        txStatusBadge.textContent = 'Pending';
        txHashRow.style.display = 'none';
    } else if (status === 'success') {
        txStatusBadge.className = 'tx-status-badge success';
        txStatusBadge.textContent = 'Confirmed';
        if (txHash) {
            updateTxCardBroadcast(txHash);
        }
    } else if (status === 'error') {
        txStatusBadge.className = 'tx-status-badge error';
        txStatusBadge.textContent = 'Failed';
        txHashRow.style.display = 'none';
    }
}

function updateTxCardBroadcast(txHash) {
    txHashRow.style.display = 'flex';
    txHashText.textContent = txHash;
    etherscanTxLink.href = `https://sepolia.etherscan.io/tx/${txHash}`;
    
    copyTxHashBtn.onclick = () => {
        navigator.clipboard.writeText(txHash);
        showToast('Copied', 'Transaction hash copied to clipboard!', 'info');
    };
}

// ============================================================================
// Form Validation & Counter Helpers
// ============================================================================

visitorNameInput.addEventListener('input', () => {
    nameCounter.textContent = `${visitorNameInput.value.length} / 50`;
    if (visitorNameInput.value.trim().length > 0) {
        nameError.textContent = '';
        visitorNameInput.classList.remove('is-invalid');
    }
});

messageInput.addEventListener('input', updateCounters);

function updateCounters() {
    const len = messageInput.value.length;
    charCounter.textContent = `${len} / 200`;

    if (len >= 200) {
        charCounter.className = 'char-counter counter-limit';
    } else if (len >= 170) {
        charCounter.className = 'char-counter counter-warning';
    } else {
        charCounter.className = 'char-counter';
    }

    if (messageInput.value.trim().length > 0) {
        messageError.textContent = '';
        messageInput.classList.remove('is-invalid');
    }
}

// ============================================================================
// Contract Address Modal
// ============================================================================

function updateContractAddressUI() {
    navContractAddr.textContent = formatTruncated(activeContractAddress);
    defaultContractDisplay.textContent = DEFAULT_CONTRACT_ADDRESS;
    customContractInput.value = activeContractAddress;
    footerContractLink.href = `https://sepolia.etherscan.io/address/${activeContractAddress}`;
    if (statContractMeta) {
        statContractMeta.textContent = formatTruncated(activeContractAddress);
    }
}

openContractModalBtn.addEventListener('click', () => {
    customContractInput.value = activeContractAddress;
    contractModalError.textContent = '';
    contractModal.style.display = 'flex';
});

closeContractModalBtn.addEventListener('click', () => {
    contractModal.style.display = 'none';
});

cancelContractModalBtn.addEventListener('click', () => {
    contractModal.style.display = 'none';
});

resetContractBtn.addEventListener('click', () => {
    customContractInput.value = DEFAULT_CONTRACT_ADDRESS;
    contractModalError.textContent = '';
});

saveContractModalBtn.addEventListener('click', async () => {
    const entered = customContractInput.value.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(entered)) {
        contractModalError.textContent = 'Please enter a valid 42-character Ethereum address (starting with 0x).';
        return;
    }

    setActiveContractAddress(entered);
    activeContractAddress = entered;
    updateContractAddressUI();
    instantiateContract();
    contractModal.style.display = 'none';
    showToast('Contract Updated', `Active contract updated to ${formatTruncated(entered)}`, 'success');
    await refreshMessagesWall();
});

// Close modal when clicking on backdrop
contractModal.addEventListener('click', (e) => {
    if (e.target === contractModal) {
        contractModal.style.display = 'none';
    }
});

// ============================================================================
// Event Listeners
// ============================================================================

function setupEventListeners() {
    connectWalletBtn.addEventListener('click', connectWallet);
    switchNetworkBtn.addEventListener('click', promptSwitchToSepolia);
    refreshBtn.addEventListener('click', refreshMessagesWall);
}

// ============================================================================
// UI & Formatting Utilities
// ============================================================================

function formatTruncated(addr) {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
}

function formatTimestamp(epochSeconds) {
    if (!epochSeconds) return 'Unknown date';
    const date = new Date(epochSeconds * 1000);
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getRelativeTime(epochSeconds) {
    if (!epochSeconds) return '';
    const now = Math.floor(Date.now() / 1000);
    const diff = Math.max(0, now - epochSeconds);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / 604800)}w ago`;
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAddressColor(address) {
    if (!address) return '#6366f1';
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
        hash = address.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue1 = Math.abs(hash % 360);
    const hue2 = (hue1 + 40) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 75%, 55%), hsl(${hue2}, 85%, 45%))`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Toast Notification System
 */
function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(title)}</div>
            <div class="toast-msg">${escapeHtml(message)}</div>
        </div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px) scale(0.95)';
        setTimeout(() => toast.remove(), 300);
    }, 4500);
}
