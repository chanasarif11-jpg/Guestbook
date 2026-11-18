/**
 * Muhammad Anas - Blockchain Guestbook
 * Configuration File
 *
 * Update DEFAULT_CONTRACT_ADDRESS with your deployed Sepolia contract address.
 * You can also change the address directly from the website UI settings.
 */

// Deployed Smart Contract Address on Ethereum Sepolia Testnet
// (Update this if you deploy a new contract or enter it in the web interface)
export const DEFAULT_CONTRACT_ADDRESS = "0xd9145CCE52D386f254917e481eB44e9943F39138";

// Sepolia Network Configuration
export const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111 in hex
export const SEPOLIA_CHAIN_ID_DECIMAL = 11155111;

export const SEPOLIA_NETWORK_PARAMS = {
    chainId: SEPOLIA_CHAIN_ID,
    chainName: "Sepolia Testnet",
    nativeCurrency: {
        name: "Sepolia ETH",
        symbol: "SEP",
        decimals: 18
    },
    rpcUrls: [
        "https://rpc.sepolia.org",
        "https://ethereum-sepolia-rpc.publicnode.com",
        "https://rpc2.sepolia.org"
    ],
    blockExplorerUrls: [
        "https://sepolia.etherscan.io"
    ]
};

// Smart Contract ABI (Application Binary Interface)
export const CONTRACT_ABI = [
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_visitorName",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_message",
                "type": "string"
            }
        ],
        "name": "addMessage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_index",
                "type": "uint256"
            }
        ],
        "name": "getMessage",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
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
    }
];

// Helper to get active contract address (localStorage overrides default if set)
export function getActiveContractAddress() {
    const saved = localStorage.getItem("guestbook_contract_address");
    if (saved && /^0x[a-fA-F0-9]{40}$/.test(saved.trim())) {
        return saved.trim();
    }
    return DEFAULT_CONTRACT_ADDRESS;
}

export function setActiveContractAddress(newAddress) {
    if (/^0x[a-fA-F0-9]{40}$/.test(newAddress.trim())) {
        localStorage.setItem("guestbook_contract_address", newAddress.trim());
        return true;
    }
    return false;
}
