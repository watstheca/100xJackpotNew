import React, { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import JackpotGameABI from './abi/JackpotGame.json';
import Token100xABI from './abi/Token100x.json';
import BondingCurveABI from './abi/BondingCurve.json';

const App = () => {
  // State variables
  const [nextJackpotValue, setNextJackpotValue] = useState('0');
  const [guessCost, setGuessCost] = useState('0');
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [jackpotContract, setJackpotContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [bondingCurveContract, setBondingCurveContract] = useState(null);
  const [hintsLoaded, setHintsLoaded] = useState({});
  const [currentGuess, setCurrentGuess] = useState('');
  const [jackpotValue, setJackpotValue] = useState('0');
  const [liquidityValue, setLiquidityValue] = useState('0');
  const [tokenPrice, setTokenPrice] = useState('0');
  const [numTokens, setNumTokens] = useState('1');
  const [totalSupply, setTotalSupply] = useState('0');
  const [buySellMode, setBuySellMode] = useState('buy');
  const [hintCost, setHintCost] = useState('0');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [uniquePlayers, setUniquePlayers] = useState(0);
  const [totalWinners, setTotalWinners] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [purchasedHints, setPurchasedHints] = useState([]);
  
  const JACKPOT_ADDRESS = process.env.REACT_APP_JACKPOT_ADDRESS || '0x1bCb1B4474b636874E1C35B0CC32ADb408bb43e0';
  const TOKEN_ADDRESS = process.env.REACT_APP_TOKEN_ADDRESS || '0x0755fb9917419a08c90a0Fd245F119202844ec3D';
  const BONDING_CURVE_ADDRESS = process.env.REACT_APP_BONDING_CURVE_ADDRESS || '0x2ECA93adD34C533008b947B2Ed02e4974122D525';

  // Format address for display
  const formatAddress = (address) => {
    if (!address || address === '0x0000000000000000000000000000000000000000') return 'None';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Format large numbers properly
  const formatTokenAmount = (amount) => {
    if (!amount || amount === '0') return '0';
    
    try {
      // Convert from base units to tokens (6 decimals)
      const amountStr = amount.toString(); // Ensure we have a string
      const amountBN = new Web3.utils.BN(amountStr);
      const tokenAmount = amountBN.div(new Web3.utils.BN(10 ** 6));
      const parsedAmount = parseFloat(tokenAmount.toString());

      // Format for very large numbers
      if (parsedAmount >= 1_000_000_000) {
        const billionsAmount = parsedAmount / 1_000_000_000;
        return `${billionsAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}B`;
      } else if (parsedAmount >= 1_000_000) {
        const millionsAmount = parsedAmount / 1_000_000;
        return `${millionsAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}M`;
      } else if (parsedAmount >= 1_000) {
        const thousandsAmount = parsedAmount / 1_000;
        return `${thousandsAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}k`;
      } else {
        return parsedAmount.toLocaleString(undefined, {maximumFractionDigits: 6});
      }
    } catch (error) {
      console.error('Error formatting token amount:', error, 'Input:', amount);
      return '0';
    }
  };
// Add this function to fetch hint content from the API
const getHintContent = useCallback(async (hintIndex, userAddress) => {
  try {
    console.log('Fetching hint:', { hintIndex, userAddress }); // Added detailed logging
    
    const response = await fetch(`/.netlify/functions/getHint?hintIndex=${hintIndex}&userAddress=${userAddress}`);
    
    console.log('Response status:', response.status); // Added response status logging
    
    if (response.ok) {
      const data = await response.json();
      console.log('Hint data:', data); // Added data logging
      return data.hintContent;
    } else {
      const error = await response.text(); // Changed to .text() to capture more error details
      console.error("Error fetching hint. Response:", error);
      return "Error retrieving hint";
    }
  } catch (error) {
    console.error("Network error fetching hint:", error);
    return "Unable to connect to hint server";
  }
}, []);

// Updated loadPurchasedHints function
const loadPurchasedHints = useCallback(async () => {
  if (!jackpotContract || !accounts[0]) {
    console.log('Skipping hint load: No contract or account');
    return;
  }

  try {
    console.log('Loading purchased hints for account:', accounts[0]);
    
    const hintTotal = parseInt(await jackpotContract.methods.hintCount().call());
    console.log('Total hints available:', hintTotal);

    let purchased = [];
    let hintsData = {}; // Store hints

    // Concurrent hint access checks
    const hintAccessPromises = Array.from({ length: hintTotal }, async (_, i) => {
      try {
        const hasAccess = await jackpotContract.methods.hasAccessToHint(accounts[0], i).call();
        if (hasAccess) {
          const hint = await getHintContent(i, accounts[0]);
          hintsData[i] = hint;
          return i;
        }
        return null;
      } catch (error) {
        console.error(`Error checking access for hint ${i}:`, error);
        return null;
      }
    });

    const hintAccess = await Promise.all(hintAccessPromises);
    purchased = hintAccess.filter(index => index !== null);

    console.log('Purchased hint indices:', purchased);
    console.log('Hints data:', hintsData);

    setPurchasedHints(purchased);
    
    // Store hints for UI rendering
    setHintsLoaded(prevHints => ({ ...prevHints, ...hintsData }));
  } catch (error) {
    console.error("Comprehensive error loading purchased hints:", error);
  }
}, [jackpotContract, accounts, getHintContent]);


  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadContractData = useCallback(async (web3, jackpot, token, bondingCurve, account) => {
    try {
      setIsLoading(true);
      
      // Use functional update to avoid direct dependency on statusMessage
      setStatusMessage(prevMessage => {
        const isImportantMessage = 
          prevMessage.includes('CONGRATULATIONS') || 
          prevMessage.includes('correct') ||
          prevMessage.includes('incorrect');
        
        return isImportantMessage ? prevMessage : 'Loading contract data...';
      });
    
      // Existing contract data loading logic
      const [
        tokenBalance,
        tokenSupply,
        jackpotValue,
        nextJackpotValue,
        guessCost,
        hintCost,
        totalWinners,
        uniquePlayers
      ] = await Promise.all([
        token.methods.balanceOf(account).call(),
        token.methods.totalSupply().call(),
        jackpot.methods.jackpotAmount().call(),
        jackpot.methods.nextJackpotAmount().call(),
        jackpot.methods.guessCost().call(),
        jackpot.methods.hintCost().call(),
        jackpot.methods.totalWinners().call(),
        jackpot.methods.uniquePlayers().call()
      ]);
  
      // Existing state updates
      setTokenBalance(tokenBalance);
      setTotalSupply(tokenSupply);
      setJackpotValue(web3.utils.fromWei(jackpotValue, 'ether'));
      setNextJackpotValue(web3.utils.fromWei(nextJackpotValue, 'ether'));
      
      setGuessCost((window.BigInt(guessCost) / window.BigInt(10 ** 6)).toString());
      setHintCost((window.BigInt(hintCost) / window.BigInt(10 ** 6)).toString());
      
      setTotalWinners(totalWinners);
      setUniquePlayers(uniquePlayers);
  
      // Optional bonding curve data
      try {
        const poolInfo = await bondingCurve.methods.getPoolInfo().call();
        setLiquidityValue(web3.utils.fromWei(poolInfo.actualS, 'ether'));
        const currentPriceWei = await bondingCurve.methods.getCurrentPrice().call();
        setTokenPrice(web3.utils.fromWei(currentPriceWei, 'ether'));
      } catch (err) {
        console.warn("Bonding curve data fetch failed:", err);
      }
  
      // Reset status message if not an important message
      setStatusMessage(prevMessage => {
        const isImportantMessage = 
          prevMessage.includes('CONGRATULATIONS') || 
          prevMessage.includes('correct') ||
          prevMessage.includes('incorrect');
        
        return isImportantMessage ? prevMessage : '';
      });
  
    } catch (error) {
      console.error("Contract data loading error:", error);
      setStatusMessage('Error loading data. Check connection.');
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array

  const buyTokens = async () => {
    if (!bondingCurveContract || !web3 || !accounts[0] || !numTokens) {
      setStatusMessage('Please connect wallet and enter token amount');
      return;
    }
    
    // Convert input to base units (directly use the input)
    const numTokensBaseUnits = Math.floor(parseFloat(numTokens));
    
    try {
      setIsLoading(true);
      setStatusMessage('Calculating token price...');
      
      // Calculate buy price from the contract
      const costWei = await bondingCurveContract.methods.calculateBuyPrice(numTokensBaseUnits).call();
      
      // Log for debugging
      console.log('Num Tokens (Base Units):', numTokensBaseUnits);
      console.log('Cost (Wei):', costWei);
      console.log('Cost (Ether):', web3.utils.fromWei(costWei, 'ether'));
      
      setStatusMessage(`Buying tokens... Please confirm in MetaMask (${web3.utils.fromWei(costWei, 'ether')} S)`);
      
      await bondingCurveContract.methods.buy(numTokensBaseUnits).send({
        from: accounts[0],
        value: costWei
      });
      
      setStatusMessage('Tokens purchased successfully!');
      
      // Reload contract data
      await loadContractData(web3, jackpotContract, tokenContract, bondingCurveContract, accounts[0]);
      setIsLoading(false);
    } catch (error) {
      console.error("Error buying tokens:", error);
      setStatusMessage('Error buying tokens. Please try again.');
      setIsLoading(false);
    }
  };

  const sellTokens = async () => {
    if (!bondingCurveContract || !web3 || !accounts[0] || !numTokens) {
      setStatusMessage('Please connect wallet and enter token amount');
      return;
    }
    
    // Convert input to base units (directly use the input)
    const numTokensBaseUnits = Math.floor(parseFloat(numTokens));
    
    try {
      setIsLoading(true);
      setStatusMessage('Preparing to sell tokens...');
      
      // Check if token is approved
      const allowance = await tokenContract.methods.allowance(accounts[0], BONDING_CURVE_ADDRESS).call();
  
      // Calculate sell price
      const sellPriceWei = await bondingCurveContract.methods.calculateSellPrice(numTokensBaseUnits).call();
      
      console.log('Num Tokens (Base Units):', numTokensBaseUnits);
      console.log('Sell Price (Wei):', sellPriceWei);
      console.log('Sell Price (Ether):', web3.utils.fromWei(sellPriceWei, 'ether'));
      
      // Check if token is approved for the correct amount
      if (parseInt(allowance) < parseInt(web3.utils.toWei(numTokens, 'ether'))) {
        // Approve tokens
        setStatusMessage('Approving tokens for sale... Please confirm in MetaMask');
        await tokenContract.methods.approve(BONDING_CURVE_ADDRESS, web3.utils.toWei(numTokens, 'ether')).send({
          from: accounts[0]
        });
      }
      
      setStatusMessage(`Selling tokens... Please confirm in MetaMask (${web3.utils.fromWei(sellPriceWei, 'ether')} S)`);
      
      await bondingCurveContract.methods.sell(numTokensBaseUnits).send({
        from: accounts[0]
      });
      
      setStatusMessage('Tokens sold successfully!');
      
      // Reload contract data
      await loadContractData(web3, jackpotContract, tokenContract, bondingCurveContract, accounts[0]);
      setIsLoading(false);
    } catch (error) {
      console.error("Error selling tokens:", error);
      setStatusMessage('Error selling tokens. Please try again.');
      setIsLoading(false);
    }
  };

  const getHint = async () => {
    if (!jackpotContract || !web3 || !accounts[0]) {
      setStatusMessage('Please connect wallet first');
      return;
    }
    
    try {
      setIsLoading(true);
      setStatusMessage('Preparing to get hint...');
      
      // Check if token is approved
      const allowance = await tokenContract.methods.allowance(accounts[0], JACKPOT_ADDRESS).call();
      const hintCostWei = await jackpotContract.methods.hintCost().call();
      
      if (parseInt(allowance) < parseInt(hintCostWei)) {
        setStatusMessage('Approving tokens for hint... Please confirm in MetaMask');
        await tokenContract.methods.approve(JACKPOT_ADDRESS, hintCostWei).send({
          from: accounts[0]
        });
      }
      
      setStatusMessage('Purchasing hint... Please confirm in MetaMask');
      
      // Request hint - this records the purchase on-chain
      await jackpotContract.methods.requestHint().send({
        from: accounts[0]
      });
      
      // Get the latest hint index
      const hintIndex = parseInt(await jackpotContract.methods.hintCount().call()) - 1;
      
      // Verify purchase was recorded
      const hasAccess = await jackpotContract.methods.hasAccessToHint(accounts[0], hintIndex).call();
      
      if (hasAccess) {
        // Fetch hint from API
        const hint = await getHintContent(hintIndex, accounts[0]);
        
        // Cache in localStorage for offline access
        if (hint && !hint.startsWith("Error") && !hint.startsWith("Unable")) {
          localStorage.setItem(`hint_${accounts[0]}_${hintIndex}`, hint);
        }
        
        // Update purchased hints
        setPurchasedHints(prev => [...prev, hintIndex]);
        setStatusMessage('Hint purchased successfully!');
      } else {
        setStatusMessage('Error verifying hint purchase. Please try again.');
      }
      
      // Reload token balance
      const tokenBalanceWei = await tokenContract.methods.balanceOf(accounts[0]).call();
      setTokenBalance(tokenBalanceWei);
      setIsLoading(false);
    } catch (error) {
      console.error("Error getting hint:", error);
      setStatusMessage('Error getting hint. Please try again.');
      setIsLoading(false);
    }
  };


  const makeGuess = async () => {
    if (!jackpotContract || !web3 || !accounts[0] || !currentGuess) {
      setStatusMessage('Please connect your wallet and enter a guess');
      return;
    }
    
    try {
      setIsLoading(true);
      setStatusMessage('Preparing to make a guess...');
      
      // First approve the tokens
      const guessCostWei = await jackpotContract.methods.guessCost().call();
      
      setStatusMessage('Approving tokens for guess... Please confirm in MetaMask');
      await tokenContract.methods.approve(JACKPOT_ADDRESS, guessCostWei).send({
        from: accounts[0]
      });
      
      setStatusMessage('Submitting guess... Please confirm in MetaMask');
      
      // Submit the guess
      const tx = await jackpotContract.methods.singleStepGuess(currentGuess).send({
        from: accounts[0]
      });
      
      console.log("Transaction result:", tx);
      
      // Check if there are any events indicating success
      let isWinner = false;
      
      // Look for any GuessRevealed events
      if (tx.events) {
        const events = Object.values(tx.events);
        for (const event of events) {
          console.log("Event found:", event.event, event.returnValues);
          
          if (event.event === "JackpotWon") {
            isWinner = true;
            break;
          }
          
          if (event.event === "GuessRevealed" && event.returnValues && event.returnValues.won === true) {
            isWinner = true;
            break;
          }
        }
      }
      
      // Set the appropriate message
      const resultMessage = isWinner
        ? '🎉 CONGRATULATIONS! Your guess was correct! You won the jackpot! 🎉'
        : 'Sorry, your guess was incorrect. Try again!';
      
      setStatusMessage(resultMessage);
      setIsLoading(false);
      
      // Keep the message for 15 seconds before refreshing data
      setTimeout(async () => {
        if (setStatusMessage) { // Check if component is still mounted
          await loadContractData(web3, jackpotContract, tokenContract, bondingCurveContract, accounts[0]);
          // Keep the message even after loading data
          setStatusMessage(resultMessage);
        }
      }, 15000);
      
    } catch (error) {
      console.error("Error making guess:", error);
      setStatusMessage('Error submitting guess. Please try again.');
      setIsLoading(false);
    }
  };

// Updated renderHintHistory function
const renderHintHistory = () => {
  if (purchasedHints.length === 0) return null;

  return (
    <div className="hint-history">
      <h3>Your Purchased Hints</h3>
      <ul>
        {purchasedHints.map(index => (
          <li key={index} className="hint-item">
            <span className="hint-number">Hint #{index + 1}:</span> 
            {hintsLoaded?.[index] || "Loading..."}
          </li>
        ))}
      </ul>
    </div>
  );
};


useEffect(() => {
  const initWeb3 = async () => {
    if (window.ethereum) {
      try {
        setStatusMessage('Connecting to blockchain...');
        
        // Request account access with timeout
        const accounts = await Promise.race([
          window.ethereum.request({ method: 'eth_requestAccounts' }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 10000)
          )
        ]);

        if (accounts.length === 0) {
          setStatusMessage('Please connect your wallet');
          return;
        }

        const web3Instance = new Web3(window.ethereum);
        
        // Initialize contracts with minimal information first
        const jackpotInstance = new web3Instance.eth.Contract(JackpotGameABI.abi, JACKPOT_ADDRESS);
        const tokenInstance = new web3Instance.eth.Contract(Token100xABI.abi, TOKEN_ADDRESS);
        const bondingCurveInstance = new web3Instance.eth.Contract(BondingCurveABI.abi, BONDING_CURVE_ADDRESS);
        
        // Set initial state
        setWeb3(web3Instance);
        setAccounts(accounts);
        setJackpotContract(jackpotInstance);
        setTokenContract(tokenInstance);
        setBondingCurveContract(bondingCurveInstance);

        // Load contract data
        await loadContractData(web3Instance, jackpotInstance, tokenInstance, bondingCurveInstance, accounts[0]);
      } catch (error) {
        console.error("Web3 initialization error:", error);
        setStatusMessage(`Connection failed: ${error.message}`);
      }
    } else {
      setStatusMessage('Please install a Web3 wallet like MetaMask');
    }
  };
  
  initWeb3();
}, [JACKPOT_ADDRESS, TOKEN_ADDRESS, BONDING_CURVE_ADDRESS, loadContractData]);

  useEffect(() => {
    if (currentGuess && jackpotContract && web3 && accounts[0]) {
      
    }
  }, [currentGuess, jackpotContract, web3, accounts]);

  useEffect(() => {
    if (jackpotContract && accounts.length > 0) {
      loadPurchasedHints();
    }
  }, [jackpotContract, accounts, loadPurchasedHints]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="title">100X Jackpot Game</h1>
        <p className="connected-wallet">Connected: {accounts.length > 0 ? formatAddress(accounts[0]) : 'Not connected'}</p>
        {statusMessage && <p className="status-message">{statusMessage}</p>}
      </header>
      
      <main className="app-main">
        <section className="game-section">
          <h2 className="section-title">Jackpot Game</h2>
          <div className="jackpot-info">
            <p className="info-item">Current Jackpot: {jackpotValue} S</p>
            <p className="info-item">Next Jackpot: {nextJackpotValue} S</p>
            <p className="info-item">Guess Cost: {guessCost} 100x</p>
            <p className="info-item">Hint Cost: {hintCost} 100x</p>
            <p className="info-item">Unique Players: {uniquePlayers}</p>
            <p className="info-item">Total Winners: {totalWinners}</p>
          </div>
          
          <div className="game-controls">
            <input 
              type="text" 
              className="guess-input"
              placeholder="Enter your guess" 
              value={currentGuess} 
              onChange={(e) => setCurrentGuess(e.target.value)}
            />
            <p className="guess-chance">Type your guess carefully, letter case matters!</p>
            <button 
              className="action-button make-guess-button" 
              onClick={makeGuess}
              disabled={isLoading}
            >
              Make Guess
            </button>
          </div>
          
          <div className="hint-section">
            <button 
              className="action-button hint-button" 
              onClick={getHint}
              disabled={isLoading}
            >
              Buy Hint
            </button>
            {renderHintHistory()}
          </div>
        </section>
        
        <section className="token-section">
          <h2 className="section-title">100X Token</h2>
          <div className="token-info">
            <p className="info-item">Your Balance: {formatTokenAmount(tokenBalance)} 100X</p>
            <p className="info-item">Total Supply: {formatTokenAmount(totalSupply)} 100X</p>
            <p className="info-item">Current Price: {tokenPrice} S</p>
            <p className="info-item">Liquidity Pool: {liquidityValue} S</p>
          </div>
          
          <div className="token-controls">
            <div className="mode-toggle">
              <button 
                className={`toggle-button ${buySellMode === 'buy' ? 'active' : ''}`}
                onClick={() => setBuySellMode('buy')}
              >
                Buy
              </button>
              <button 
                className={`toggle-button ${buySellMode === 'sell' ? 'active' : ''}`}
                onClick={() => setBuySellMode('sell')}
              >
                Sell
              </button>
            </div>
            
            <input 
              type="number" 
              className="token-amount-input"
              min="0" 
              step="1" 
              placeholder="Amount of tokens" 
              value={numTokens} 
              onChange={(e) => setNumTokens(e.target.value)}
            />
            
            {buySellMode === 'buy' ? (
              <button 
                className="action-button buy-button" 
                onClick={buyTokens}
                disabled={isLoading}
              >
                Buy Tokens
              </button>
            ) : (
              <button 
                className="action-button sell-button" 
                onClick={sellTokens}
                disabled={isLoading}
              >
                Sell Tokens
              </button>
            )}
          </div>
        </section>
        
       
      </main>
      
      <footer className="app-footer">
        <p>DeFAI Hackathon Project - Sonic Chain - 2025</p>
      </footer>
    </div>
  );
};

export default App;