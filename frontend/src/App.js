import './App.css';
import Onboard from '@web3-onboard/core';
import metamaskSDK from '@web3-onboard/metamask';
import { useState, useEffect } from 'react';
import { ethers } from "ethers";

import logo from './logo.svg';

const INFURA_ID = 'e58130da3dee4d6c9f1ab1df59cbe8aa';

const chains = [
  {
    id: 11155111,
    token: 'ETH',
    label: 'Sepolia',
    rpcUrl: `https://sepolia.infura.io/v3/${INFURA_ID}`
  }
];

const metamaskSDKWallet = metamaskSDK({
  options: {
    extensionOnly: false,
    dappMetadata: { name: 'Demo Web3Onboard' }
  }
});

const onboard = Onboard({
  wallets: [metamaskSDKWallet],
  chains,
  appMetadata: {
    name: 'Web3-Onboard Demo',
    icon: logo,
    description: 'Web3-Onboard Demo Application',
    recommendedInjectedWallets: [
      { name: 'MetaMask', url: 'https://metamask.io' }
    ]
  },
  connect: { autoConnectLastWallet: true }
});

function App() {
  const [wallet, setWallet] = useState(null);
  const [countdown, setCountdown] = useState(null);

  const contractAddress = "0x1ea134c88fa565c2A8EB13dAa0fE5A7d5e625362";
  const abi = [
    "function time() view returns (uint256)"
  ];

  const connect = async () => {
    const wallets = await onboard.connectWallet();
    
    if (wallets[0]) {
      setWallet(wallets[0]);
      try {
        const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7'; 
        await onboard.setChain({ chainId: SEPOLIA_CHAIN_ID_HEX });
      } catch (error) {
        console.error("Failed to switch chain to Sepolia:", error);
      }
    }
  };

  // Subscribe to wallet state
  useEffect(() => {
    const subscription = onboard.state.select('wallets').subscribe((wallets) => {
      setWallet(wallets[0] || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Start countdown when wallet connects
  useEffect(() => {
    if (!wallet) return;

    async function loadCountdown() {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, abi, provider);

        const startTime = await contract.time();   // blockchain timestamp

        const duration = 300; // countdown duration (1 hour)
        const endTime = Number(startTime) + duration;

        const interval = setInterval(() => {
          const now = Math.floor(Date.now() / 1000);
          const remaining = endTime - now;

          if (remaining <= 0) {
            setCountdown("TIME IS UP!");
            clearInterval(interval);
            return;
          }

          const hours = Math.floor(remaining / 3600);
          const minutes = Math.floor((remaining % 3600) / 60);
          const seconds = remaining % 60;

          setCountdown(`${hours}h ${minutes}m ${seconds}s`);
        }, 1000);

      } catch (error) {
        console.error("Error loading countdown:", error);
      }
    }

    loadCountdown();
  }, [wallet]);

  return (
    <div className="app-container">
      
      <div className="header">
        <h1>Smart Contract Demo</h1>
        <p className="subtitle">Deploy & interact with a simple blockchain contract</p>
      </div>

      {!wallet ? (
        <button className="primary-btn" onClick={connect}>
          Connect Wallet
        </button>
      ) : (
        <div className="card">
          <p className="wallet-status">✔ Wallet Connected</p>
        </div>
      )}

      {/* Countdown Display */}
      {wallet && (
        <div className="card">
          <h2>Countdown Timer</h2>
          <p style={{ fontSize: "24px", fontWeight: "bold" }}>
            {countdown || "Loading..."}
          </p>
        </div>
      )}

    </div>
  );
}

export default App;
