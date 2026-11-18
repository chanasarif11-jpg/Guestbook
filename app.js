// Smart Contract Configuration
const CONTRACT_ADDRESS = "0x133607EB04474eB1e57c1316C4f1a1B4992168b6"; // Replace with your Sepolia deployment address
const CONTRACT_ABI = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "message",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "NewMessage",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "getAllMessages",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "sender",
						"type": "address"
					},
					{
						"internalType": "string",
						"name": "name",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "message",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					}
				],
				"internalType": "struct Guestbook.Message[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTotalMessages",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "messages",
		"outputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "message",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_message",
				"type": "string"
			}
		],
		"name": "signGuestbook",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

let provider;
let signer;
let contract;
let userAddress = null;
let currentLoadedMessages = [];
let isDemoActive = false;

// DOM Elements
const connectWalletBtn = document.getElementById("connectWalletBtn");
const guestbookForm = document.getElementById("guestbookForm");
const visitorNameInput = document.getElementById("visitorName");
const visitorMessageInput = document.getElementById("visitorMessage");
const charCountSpan = document.getElementById("charCount");
const charBarFill = document.getElementById("charBarFill");
const submitBtn = document.getElementById("submitBtn");
const messageCountSpan = document.getElementById("messageCount");
const messagesContainer = document.getElementById("messagesContainer");
const notificationArea = document.getElementById("notificationArea");
const refreshBtn = document.getElementById("refreshBtn");
const loadingSpinner = document.getElementById("loadingSpinner");
const searchInput = document.getElementById("searchInput");
const previewDemoBtn = document.getElementById("previewDemoBtn");
const feedStatusPill = document.getElementById("feedStatusPill");

// -----------------------------------------------------------------------------
// 1. Theme Management System
// -----------------------------------------------------------------------------
function initTheme() {
    const savedTheme = localStorage.getItem("chainguest_theme") || "cyber";
    setTheme(savedTheme);

    const themeButtons = document.querySelectorAll("[data-set-theme]");
    themeButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const theme = btn.getAttribute("data-set-theme");
            setTheme(theme);
        });
    });
}

function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("chainguest_theme", theme);

    // Update active class on buttons
    document.querySelectorAll("[data-set-theme]").forEach(btn => {
        if (btn.getAttribute("data-set-theme") === theme) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

initTheme();

// -----------------------------------------------------------------------------
// 2. Character Counter & Progress Bar
// -----------------------------------------------------------------------------
visitorMessageInput.addEventListener("input", (e) => {
    const len = e.target.value.length;
    charCountSpan.textContent = len;
    
    if (charBarFill) {
        const percent = Math.min((len / 200) * 100, 100);
        charBarFill.style.width = `${percent}%`;
        
        if (percent > 90) {
            charBarFill.style.backgroundColor = "var(--error-border)";
        } else if (percent > 75) {
            charBarFill.style.backgroundColor = "var(--accent-secondary)";
        } else {
            charBarFill.style.backgroundColor = "var(--accent)";
        }
    }
});

// -----------------------------------------------------------------------------
// 3. Connect MetaMask Wallet
// -----------------------------------------------------------------------------
connectWalletBtn.addEventListener("click", async () => {
    if (typeof window.ethereum !== "undefined") {
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            userAddress = await signer.getAddress();
            
            contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

            // Update UI state with connected pill styling
            const shortAddr = `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
            connectWalletBtn.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #10b981;"></i> <span>${shortAddr}</span>`;
            connectWalletBtn.style.background = "var(--badge-bg)";
            connectWalletBtn.style.border = "1px solid var(--badge-border)";
            connectWalletBtn.style.color = "var(--text-main)";
            submitBtn.disabled = false;

            showNotification("MetaMask Wallet connected successfully to Ethereum Sepolia!", "success");
            loadGuestbookData();
        } catch (error) {
            console.error(error);
            showNotification("Wallet connection rejected or failed: " + (error.message || ""), "error");
        }
    } else {
        showNotification("MetaMask extension is not detected. Please install MetaMask to interact with this DApp.", "error");
        alert("Please install MetaMask to interact with this DApp!");
    }
});

// -----------------------------------------------------------------------------
// 4. Refresh Button Action
// -----------------------------------------------------------------------------
refreshBtn.addEventListener("click", () => {
    refreshBtn.classList.add("fa-spin");
    setTimeout(() => refreshBtn.classList.remove("fa-spin"), 1000);

    if (contract) {
        loadGuestbookData();
    } else if (isDemoActive) {
        renderMessages(sampleMessages);
        showNotification("Sample ledger refreshed.", "success");
    } else {
        showNotification("Please connect your MetaMask wallet first or toggle sample ledger entries.", "error");
    }
});

// -----------------------------------------------------------------------------
// 5. Submit Form Handler (.send() write operation)
// -----------------------------------------------------------------------------
guestbookForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = visitorNameInput.value.trim();
    const message = visitorMessageInput.value.trim();

    if (!name || !message) {
        showNotification("Please fill in both name and message fields.", "error");
        return;
    }

    if (message.length > 200) {
        showNotification("Message cannot exceed 200 characters.", "error");
        return;
    }

    // Check if contract is deployed or valid
    if (!contract || CONTRACT_ADDRESS === "YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE") {
        if (!signer) {
            showNotification("Please connect your MetaMask wallet before signing.", "error");
            return;
        }
        showNotification("Contract address not configured in app.js yet. Please update CONTRACT_ADDRESS with your deployed Sepolia contract.", "error");
        return;
    }

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Confirming in MetaMask...`;
        showNotification("Please confirm the transaction in your MetaMask popup window.", "success");

        const tx = await contract.signGuestbook(name, message);
        
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Mining on Ethereum...`;
        showNotification(`Transaction submitted! Hash: ${tx.hash.substring(0, 10)}... Waiting for block confirmation.`, "success");

        const receipt = await tx.wait();

        showNotification(`
            <strong>Transaction Confirmed!</strong> Message etched permanently onto Sepolia.<br>
            <a href="https://sepolia.etherscan.io/tx/${receipt.transactionHash}" target="_blank">
                <i class="fa-solid fa-external-link-alt"></i> View on Sepolia Etherscan (${receipt.transactionHash.substring(0, 12)}...)
            </a>
        `, "success", 10000);

        // Clear Form & Reload Feed
        visitorNameInput.value = "";
        visitorMessageInput.value = "";
        charCountSpan.textContent = "0";
        if (charBarFill) charBarFill.style.width = "0%";
        loadGuestbookData();

    } catch (error) {
        console.error(error);
        showNotification(`Transaction failed: ${error.reason || error.message}`, "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit to Blockchain`;
    }
});

// -----------------------------------------------------------------------------
// 6. Load Data Function (.call() read operations)
// -----------------------------------------------------------------------------
async function loadGuestbookData() {
    if (!contract) return;
    
    try {
        loadingSpinner.classList.remove("hidden");
        
        // Fetch total count & all messages
        const totalCount = await contract.getTotalMessages();
        messageCountSpan.textContent = totalCount.toString();

        const messages = await contract.getAllMessages();
        currentLoadedMessages = messages;
        
        renderMessages(messages);
        if (feedStatusPill) feedStatusPill.textContent = `${totalCount.toString()} On-Chain`;
    } catch (error) {
        console.error("Error loading guestbook data:", error);
        showNotification("Error loading guestbook data from contract: " + (error.reason || error.message), "error");
    } finally {
        loadingSpinner.classList.add("hidden");
    }
}

// -----------------------------------------------------------------------------
// 7. Render Messages to DOM (Latest First with Rich UI Cards)
// -----------------------------------------------------------------------------
function renderMessages(messages) {
    if (!messages || messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon-wrap">
                    <i class="fa-solid fa-folder-open"></i>
                </div>
                <p>No messages recorded yet on the blockchain ledger. Be the first to sign!</p>
            </div>
        `;
        return;
    }

    messagesContainer.innerHTML = "";
    
    // Reverse array to show latest messages first
    const reversedMessages = [...messages].reverse();

    reversedMessages.forEach((msg, idx) => {
        const timestampMs = typeof msg.timestamp.toNumber === "function" 
            ? msg.timestamp.toNumber() * 1000 
            : Number(msg.timestamp) * 1000;
        
        const dateObj = new Date(timestampMs);
        const formattedDate = dateObj.toLocaleDateString(undefined, { 
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
        });
        
        const shortAddr = `${msg.sender.substring(0, 6)}...${msg.sender.substring(38)}`;
        const avatarGradient = getAvatarGradient(msg.name || "A");
        const initial = (msg.name && msg.name.trim().length > 0) ? msg.name.trim().charAt(0).toUpperCase() : "0x";

        const msgCard = document.createElement("div");
        msgCard.className = "msg-item";
        msgCard.setAttribute("data-author", (msg.name || "").toLowerCase());
        msgCard.setAttribute("data-sender", (msg.sender || "").toLowerCase());
        msgCard.setAttribute("data-message", (msg.message || "").toLowerCase());

        msgCard.innerHTML = `
            <div class="msg-header-row">
                <div class="msg-author-group">
                    <div class="author-avatar" style="background: ${avatarGradient};">${escapeHtml(initial)}</div>
                    <span class="msg-author">${escapeHtml(msg.name)} <span class="author-verified-tag"><i class="fa-solid fa-certificate"></i> Verified</span></span>
                </div>
                <span class="msg-time"><i class="fa-regular fa-clock"></i> ${formattedDate}</span>
            </div>
            <div class="msg-body">"${escapeHtml(msg.message)}"</div>
            <div class="msg-footer-row">
                <div class="msg-sender-info">
                    <i class="fa-solid fa-wallet"></i>
                    <span>Sender:</span>
                    <code>${shortAddr}</code>
                    <button type="button" class="copy-btn" title="Copy full address" onclick="copyAddressToClipboard('${msg.sender}')">
                        <i class="fa-regular fa-copy"></i>
                    </button>
                </div>
                <a href="https://sepolia.etherscan.io/address/${msg.sender}" target="_blank" rel="noopener noreferrer">
                    Sepolia Explorer <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
            </div>
        `;
        messagesContainer.appendChild(msgCard);
    });
}

// -----------------------------------------------------------------------------
// 8. Search & Filter Ledger
// -----------------------------------------------------------------------------
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        const cards = messagesContainer.querySelectorAll(".msg-item");
        
        cards.forEach(card => {
            const author = card.getAttribute("data-author") || "";
            const sender = card.getAttribute("data-sender") || "";
            const text = card.getAttribute("data-message") || "";
            
            if (author.includes(query) || sender.includes(query) || text.includes(query)) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }
        });
    });
}

// -----------------------------------------------------------------------------
// 9. Interactive Sample Ledger for Instant Review / Demo
// -----------------------------------------------------------------------------
const sampleMessages = [
    {
        sender: "0x71C679313824b42b47D7Ddf520443900996D894D",
        name: "Mohib Ul Hassan",
        message: "Excited to test the decentralized guestbook! Smart contracts on Sepolia are fast and secure. 🚀",
        timestamp: Math.floor(Date.now() / 1000) - 300
    },
    {
        sender: "0x3A54B98E2F3a1b023F0B9C9B4d11B3e75C418c39",
        name: "Satoshi Nakamoto",
        message: "Trust the math, not the middleman. Decentralization is the cornerstone of cryptography.",
        timestamp: Math.floor(Date.now() / 1000) - 3600
    },
    {
        sender: "0x98b8A4Fe3659Db8fDb55A6a297bcfA61dE3524E1",
        name: "Elena Rostova",
        message: "Permanent inscription verified on block #5421908. Beautiful UI and seamless Web3 UX!",
        timestamp: Math.floor(Date.now() / 1000) - 14400
    }
];

if (previewDemoBtn) {
    previewDemoBtn.addEventListener("click", () => {
        isDemoActive = !isDemoActive;
        if (isDemoActive) {
            currentLoadedMessages = sampleMessages;
            messageCountSpan.textContent = sampleMessages.length.toString();
            renderMessages(sampleMessages);
            previewDemoBtn.innerHTML = `<i class="fa-solid fa-xmark"></i> Clear Sample Entries`;
            if (feedStatusPill) feedStatusPill.textContent = "Demo Ledger (3)";
            showNotification("Showing sample on-chain entries for UI demonstration.", "success");
        } else {
            currentLoadedMessages = [];
            messageCountSpan.textContent = "0";
            renderMessages([]);
            previewDemoBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Toggle Sample Ledger Entries`;
            if (feedStatusPill) feedStatusPill.textContent = "Live Blocks";
            showNotification("Sample entries cleared.", "success");
        }
    });
}

// -----------------------------------------------------------------------------
// 10. Helper Utilities: Notifications, Clipboard, Avatars, XSS Escaping
// -----------------------------------------------------------------------------
let notificationTimeout = null;

function showNotification(msg, type = "success", duration = 6000) {
    if (!notificationArea) return;
    
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }

    notificationArea.className = type;
    
    const icon = type === "success" 
        ? '<i class="fa-solid fa-circle-check"></i>' 
        : '<i class="fa-solid fa-triangle-exclamation"></i>';

    notificationArea.innerHTML = `
        <div style="display:flex; align-items:flex-start; gap:0.6rem;">
            <span style="font-size: 1.1rem; margin-top: 1px;">${icon}</span>
            <div style="flex: 1;">${msg}</div>
        </div>
    `;
    
    notificationArea.classList.remove("hidden");

    notificationTimeout = setTimeout(() => {
        notificationArea.classList.add("hidden");
    }, duration);
}

function copyAddressToClipboard(address) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(address).then(() => {
            showNotification(`Copied address <code style="font-family:monospace;">${address.substring(0,8)}...</code> to clipboard!`, "success", 2500);
        }).catch(err => {
            console.error("Clipboard copy error:", err);
        });
    } else {
        const textarea = document.createElement("textarea");
        textarea.value = address;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        showNotification(`Copied address to clipboard!`, "success", 2500);
    }
}

// Generate pleasing consistent gradient avatar per name
function getAvatarGradient(name) {
    const gradients = [
        "linear-gradient(135deg, #6366f1, #06b6d4)",
        "linear-gradient(135deg, #ec4899, #8b5cf6)",
        "linear-gradient(135deg, #10b981, #059669)",
        "linear-gradient(135deg, #f59e0b, #d97706)",
        "linear-gradient(135deg, #3b82f6, #1d4ed8)",
        "linear-gradient(135deg, #f43f5e, #be123c)"
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
}

// Helper to prevent XSS injection in messages
function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
