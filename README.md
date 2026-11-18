# ⛓️ Muhammad Anas — Blockchain Guestbook DApp

An interactive, decentralized guestbook DApp deployed on the **Ethereum Sepolia Testnet** with seamless MetaMask integration, smart contract write calls (`.send()`), and read calls (`.call()`).

---

## 🌟 Student & Project Details

- **Student Name:** Muhammad Anas
- **Project Name:** Blockchain Guestbook DApp
- **Network:** Ethereum Sepolia Testnet (Chain ID: `11155111` / `0xaa36a7`)
- **Target Netlify URL:** `https://muhammad-anas-blockchain-guestbook.netlify.app`
- **Smart Contract Language:** Solidity `^0.8.20`
- **Frontend Tech Stack:** HTML5, CSS3 (Modern Glassmorphism), JavaScript (ES6+ Modules), Web3.js

---

## 📋 Functional Requirements Implementation Checklist

| # | Requirement | Implementation Details | Status |
|---|---|---|---|
| **1** | **Homepage** | Clean, responsive modern Web3 UI with title, description, stats bar, submission form, and live message wall. | ✅ Completed |
| **2** | **MetaMask Integration** | "Connect MetaMask" button, automatic Sepolia network detection, one-click network switching, and live account tracking. | ✅ Completed |
| **3** | **Message Submission** | Inputs for Visitor Name & Message, trim validation, strict max 200 character counter with visual warnings, smart contract submission requiring MetaMask confirmation, and loading / success / error toast notifications. | ✅ Completed |
| **4** | **Message Display** | All messages fetched from the blockchain, formatted with visitor name, message body, sender wallet address, submission timestamp (exact + relative time), sorted with latest messages first (`total - 1` down to `0`). | ✅ Completed |
| **5** | **Message Counter** | Total messages counter displayed prominently in the hero section and guestbook header, retrieved live via `getTotalMessages().call()`, updated automatically upon new submission. | ✅ Completed |
| **6** | **Transaction Information** | Displays transaction hash upon broadcast and confirmation, clickable link to view on Sepolia Etherscan (`https://sepolia.etherscan.io/tx/{hash}`), and automatic message list refresh. | ✅ Completed |
| **7** | **Blockchain Interaction** | Strictly uses `.send({ from: account })` for `addMessage` (write operation) and `.call()` for `getTotalMessages` and `getMessage(index)` (read operation). | ✅ Completed |
| **8** | **Netlify Publishing** | Built as a production-ready static web app with `netlify.toml` ready for deployment at `muhammad-anas-blockchain-guestbook.netlify.app`. | ✅ Completed |

---

## 🏗️ Project Architecture

```
Muhammad-Anas-Blockchain-Guestbook/
├── index.html              # Main responsive semantic UI
├── styles.css              # Cyber-clean glassmorphic Web3 styles
├── app.js                  # Core Web3 & MetaMask interaction logic (.send() & .call())
├── config.js               # Contract ABI, Sepolia chain parameters, and address config
├── Guestbook.sol           # Solidity Smart Contract
├── netlify.toml            # Netlify deployment headers & configuration
├── lib/
│   └── web3.min.js         # Offline/bundled Web3.js library
├── artifacts/              # Remix compilation artifacts
└── README.md               # Complete documentation
```

---

## 🚀 How to Run Locally

Because the frontend uses modern ES6 JavaScript modules (`import/export`), it should be served via a local web server (not `file://`):

### Option A: Using Python (Recommended)
Open PowerShell or Terminal in this folder and run:
```bash
python -m http.server 3000
```
Then open your browser at:
```
http://localhost:3000
```

### Option B: Using VS Code Live Server
1. Open the project folder in VS Code.
2. Right-click `index.html` and select **"Open with Live Server"**.

---

## ⚙️ Setting Your Sepolia Contract Address

You can configure your deployed contract address in **two easy ways**:

1. **Directly in the Web UI (No code editing needed):**
   - Click the **"Contract: 0x..."** badge in the top navigation bar.
   - Enter your deployed Sepolia contract address.
   - Click **"Save & Reload"**. The address is persisted in your browser's `localStorage`.
2. **In the Code:**
   - Open `config.js`.
   - Update `DEFAULT_CONTRACT_ADDRESS`:
     ```javascript
     export const DEFAULT_CONTRACT_ADDRESS = "YOUR_SEPOLIA_CONTRACT_ADDRESS_HERE";
     ```

---

## 🌐 Publishing to Netlify (Step-by-Step)

### Method 1: Netlify Drop (Fastest — 30 Seconds, No CLI required)
1. Go to **[https://app.netlify.com/drop](https://app.netlify.com/drop)** in your web browser.
2. Sign in or create a free Netlify account.
3. Drag and drop the `Muhammad-Anas-Blockchain-Guestbook` folder into the upload box on Netlify.
4. Netlify will deploy your site in seconds and provide a random URL (e.g. `dazzling-site-123.netlify.app`).
5. **Rename site to match the naming requirement:**
   - Go to **Site Configuration** > **General** > **Site details**.
   - Click **Change site name**.
   - Enter: `muhammad-anas-blockchain-guestbook`
   - Click **Save**.
   - Your live site is now: **`https://muhammad-anas-blockchain-guestbook.netlify.app`**!

### Method 2: Deploy via GitHub & Netlify
1. Create a new repository on [GitHub](https://github.com).
2. Commit and push the project files:
   ```bash
   git add .
   git commit -m "Initial commit: Muhammad Anas Blockchain Guestbook DApp"
   git remote add origin https://github.com/YOUR_USERNAME/muhammad-anas-blockchain-guestbook.git
   git push -u origin main
   ```
3. Go to [Netlify Dashboard](https://app.netlify.com) > **Add new site** > **Import an existing project** > **GitHub**.
4. Select your repository.
5. In the site settings:
   - Site name: `muhammad-anas-blockchain-guestbook`
   - Publish directory: `.`
6. Click **Deploy**.

---

## 🧪 Smart Contract Specification

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BlockchainGuestbook {
    struct Message {
        string visitorName;
        string message;
        address sender;
        uint256 timestamp;
    }

    Message[] private messages;

    function addMessage(string memory _visitorName, string memory _message) public;
    function getMessage(uint256 _index) public view returns (string memory, string memory, address, uint256);
    function getTotalMessages() public view returns (uint256);
}
```

- **Write Function:** `addMessage(string _visitorName, string _message)`
  - Submits visitor name & message up to 200 characters.
  - Automatically records `msg.sender` and `block.timestamp`.
  - Called via `contract.methods.addMessage(...).send({ from: account })`.
- **Read Functions:**
  - `getTotalMessages()` returns the count of messages stored.
  - `getMessage(uint256 _index)` returns `(visitorName, message, sender, timestamp)`.
  - Both called via `.call()`.
