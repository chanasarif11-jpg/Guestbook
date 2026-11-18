/**
 * Muhammad Anas - Blockchain Guestbook
 * Configuration File
 *
 * Update DEFAULT_CONTRACT_ADDRESS with your deployed Sepolia contract address.
 */

(function() {
    // Deployed Smart Contract Address on Ethereum Sepolia Testnet
    // Change this to your Sepolia contract address or set it from the web UI
    var DEFAULT_CONTRACT_ADDRESS = "";

    // Sepolia Network Configuration
    var SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111 in hex
    var SEPOLIA_CHAIN_ID_DECIMAL = 11155111;

    var SEPOLIA_NETWORK_PARAMS = {
        chainId: SEPOLIA_CHAIN_ID,
        chainName: "Sepolia Testnet",
        nativeCurrency: {
            name: "Sepolia ETH",
            symbol: "SEP",
            decimals: 18
        },
        rpcUrls: [
            "https://ethereum-sepolia-rpc.publicnode.com",
            "https://1rpc.io/sepolia"
        ],
        blockExplorerUrls: [
            "https://sepolia.etherscan.io"
        ]
    };

    // Smart Contract ABI (Application Binary Interface)
    var CONTRACT_ABI = [
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

    function getActiveContractAddress() {
        try {
            var saved = localStorage.getItem("guestbook_contract_address");
            if (saved && /^0x[a-fA-F0-9]{40}$/.test(saved.trim())) {
                return saved.trim();
            }
        } catch (e) {
            console.warn("localStorage not accessible:", e);
        }
        return DEFAULT_CONTRACT_ADDRESS;
    }

    function setActiveContractAddress(newAddress) {
        if (/^0x[a-fA-F0-9]{40}$/.test(newAddress.trim())) {
            try {
                localStorage.setItem("guestbook_contract_address", newAddress.trim());
            } catch (e) {}
            return true;
        }
        return false;
    }

    // Expose on window object so it works across both file:// and http:// protocols
    window.GUESTBOOK_CONFIG = {
        DEFAULT_CONTRACT_ADDRESS: DEFAULT_CONTRACT_ADDRESS,
        SEPOLIA_CHAIN_ID: SEPOLIA_CHAIN_ID,
        SEPOLIA_CHAIN_ID_DECIMAL: SEPOLIA_CHAIN_ID_DECIMAL,
        SEPOLIA_NETWORK_PARAMS: SEPOLIA_NETWORK_PARAMS,
        CONTRACT_ABI: CONTRACT_ABI,
        getActiveContractAddress: getActiveContractAddress,
        setActiveContractAddress: setActiveContractAddress
    };
})();
