import './App.css';
import Onboard from '@web3-onboard/core';
import metamaskSDK from '@web3-onboard/metamask';
import { useState, useEffect } from 'react';
import { ethers } from "ethers";

import logo from './logo.svg';

// --- CONFIGURATION ---
const INFURA_ID = 'e58130da3dee4d6c9f1ab1df59cbe8aa';
const CONTRACT_ADDRESS = "0x6d8d680794D3400BDeeb450f61180Ff58dd4fb7A";
const SEPOLIA_CHAIN_ID = 11155111;
const ABI = [
  "function time() view returns (uint256)"
];


const chains = [
  {
    id: `0x${SEPOLIA_CHAIN_ID.toString(16)}`, // Sepolia Chain ID in Hex
    token: 'ETH',
    label: 'Sepolia Testnet',
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
// --- END CONFIGURATION ---

function App() {
  const [wallet, setWallet] = useState(null);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0, loading: true });

  const connect = async () => {
    const wallets = await onboard.connectWallet();
    
    if (wallets[0]) {
      setWallet(wallets[0]);
      try {
        const SEPOLIA_CHAIN_ID_HEX = `0x${SEPOLIA_CHAIN_ID.toString(16)}`; 
        await onboard.setChain({ chainId: SEPOLIA_CHAIN_ID_HEX });
      } catch (error) {
        console.error("Failed to switch chain to Sepolia:", error);
      }
    }
  };

  const disconnect = async () => {
    if (wallet) {
      await onboard.disconnectWallet({ label: wallet.label });
      setWallet(null);
      setCountdown({ hours: 0, minutes: 0, seconds: 0, loading: true });
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
    if (!wallet || !window.ethereum) {
        setCountdown({ hours: 0, minutes: 0, seconds: 0, loading: false });
        return;
    }
    
    let intervalId;

    async function loadCountdown() {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

        const startTime = await contract.time();   // blockchain timestamp

        intervalId = setInterval(() => {
          const now = Math.floor(Date.now() / 1000);
          const remainingTime = now - Number(startTime);
          
          const hours = Math.floor(remainingTime / 3600);
          const minutes = Math.floor((remainingTime % 3600) / 60);
          const seconds = remainingTime % 60;

          setCountdown({ 
              hours: hours, 
              minutes: minutes, 
              seconds: seconds, 
              loading: false 
          });
        }, 1000);

      } catch (error) {
        console.error("Error loading countdown:", error);
        setCountdown({ hours: 0, minutes: 0, seconds: 0, loading: false });
      }
    }

    loadCountdown();

    return () => {
        if (intervalId) clearInterval(intervalId);
    };
  }, [wallet]);

  // Helper function for formatting time (e.g., 5 -> 05)
  const formatTime = (time) => String(time).padStart(2, '0');

  return (
    <div className="app-container">
      
      <header className="header">
        <h1 className="title">🚀 Smart Contract Timer Demo</h1>
        <p className="subtitle">Time elapsed since contract deployment on Sepolia</p>
      </header>
      
      <main className="content-area">

        {/* Wallet Status and Connection Card */}
        <section className="card wallet-card">
          {!wallet ? (
            <div className="connect-state">
                <p className="status-text">Wallet is **Disconnected**</p>
                <button className="primary-btn" onClick={connect}>
                    Connect Wallet
                </button>
            </div>
          ) : (
            <div className="connected-state">
                <p className="status-text success">✅ Wallet Connected</p>
                <p className="address-text">
                    **Account:** {wallet.accounts[0].address.substring(0, 6)}...{wallet.accounts[0].address.substring(38)}
                </p>
                <p className="chain-text">
                    **Chain:** Sepolia
                </p>
                <button className="secondary-btn" onClick={disconnect}>
                    Disconnect
                </button>
            </div>
          )}
        </section>

        {/* Countdown Display Card */}
        {wallet && (
            <section className="card countdown-card">
                <h2>Time Elapsed</h2>
                {countdown.loading ? (
                    <p className="loading-text">Loading contract time...</p>
                ) : (
                    <div className="countdown-display">
                        <div className="time-unit">
                            <span className="time-value">{formatTime(countdown.hours)}</span>
                            <span className="time-label">Hours</span>
                        </div>
                        <span className="separator">:</span>
                        <div className="time-unit">
                            <span className="time-value">{formatTime(countdown.minutes)}</span>
                            <span className="time-label">Minutes</span>
                        </div>
                        <span className="separator">:</span>
                        <div className="time-unit">
                            <span className="time-value">{formatTime(countdown.seconds)}</span>
                            <span className="time-label">Seconds</span>
                        </div>
                    </div>
                )}
            </section>
        )}
      </main>

    </div>
  );
}

export default App;