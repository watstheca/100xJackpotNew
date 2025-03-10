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
  
  const [currentGuess, setCurrentGuess] = useState('');
  const [guessChance, setGuessChance] = useState('0');
  const [jackpotValue, setJackpotValue] = useState('0');
  const [hintValue, setHintValue] = useState('');
  const [liquidityValue, setLiquidityValue] = useState('0');
  const [tokenPrice, setTokenPrice] = useState('0');
  const [numTokens, setNumTokens] = useState('1');
  const [totalSupply, setTotalSupply] = useState('0');
  const [buySellMode, setBuySellMode] = useState('buy');
  const [hintCost, setHintCost] = useState('0');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [splits, setSplits] = useState([0, 0, 0, 0]);
  const [uniquePlayers, setUniquePlayers] = useState(0);
  const [totalWinners, setTotalWinners] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [purchasedHints, setPurchasedHints] = useState([]);
  
  const JACKPOT_ADDRESS = process.env.REACT_APP_JACKPOT_ADDRESS || '0x1bCb1B4474b636874E1C35B0CC32ADb408bb43e0';
  const TOKEN_ADDRESS = process.env.REACT_APP_TOKEN_ADDRESS || '0x0755fb9917419a08c90a0Fd245F119202844ec3D';
  const BONDING_CURVE_ADDRESS = process.env.REACT_APP_BONDING_CURVE_ADDRESS || '0x2ECA93adD34C533008b947B2Ed02e4974122D525';

  // Predefined hints (stored off-chain)
  const HINTS = [
    "The secret is related to the Sonic blockchain.",
    "The secret word is 'Sonic4Lyfe'.",
    "The secret has 11 characters in total.",
    "The secret includes both letters and a number."
  ];

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

  // Load purchased hints from blockchain access rights
  const loadPurchasedHints = useCallback(async () => {
    if (!jackpotContract || !accounts[0]) return;
    
    try {
      const hintTotal = parseInt(await jackpotContract.methods.hintCount().call());
      let purchased = [];
      
      // Check each hint
      for (let i = 0; i < hintTotal; i++) {
        try {
          const hasAccess = await jackpotContract.methods.hasAccessToHint(accounts[0], i).call();
          if (hasAccess) {
            purchased.push(i);
            
            // If this is the most recent hint, display it
            if (i === hintTotal - 1) {
              setHintValue(HINTS[i] || "Hint content not available for this index");
            }
          }
        } catch (err) {
          console.error(`Error checking hint access for hint ${i}:`, err);
        }
      }
      
      setPurchasedHints(purchased);
    } catch (error) {
      console.error("Error loading purchased hints:", error);
    }
  }, [jackpotContract, accounts]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadContractData = useCallback(async (web3, jackpot, token, bondingCurve, account) => {
    try {
      setIsLoading(true);
      setStatusMessage('Loading contract data...');

      // Load token data
      const tokenBalanceWei = await token.methods.balanceOf(account).call();
      setTokenBalance(tokenBalanceWei);
    
      const tokenSupplyWei = await token.methods.totalSupply().call();
      setTotalSupply(tokenSupplyWei);
      
      // Load bonding curve data
      try {
        const poolInfo = await bondingCurve.methods.getPoolInfo().call();
        const liquidityValueEth = web3.utils.fromWei(poolInfo.actualS, 'ether');
        setLiquidityValue(liquidityValueEth);

        const currentPriceWei = await bondingCurve.methods.getCurrentPrice().call();
        const currentPriceEth = web3.utils.fromWei(currentPriceWei, 'ether');
        setTokenPrice(currentPriceEth);
      } catch (err) {
        console.error("Error loading bonding curve data:", err);
        setLiquidityValue("N/A");
        setTokenPrice("N/A");
      }
      
      // Load jackpot data
      try {
        const jackpotValueWei = await jackpot.methods.jackpotAmount().call();
        const jackpotValueS = web3.utils.fromWei(jackpotValueWei, 'ether');
        
        // Load existing next jackpot amount
        const existingNextJackpotValueWei = await jackpot.methods.nextJackpotAmount().call();
        const existingNextJackpotValueS = web3.utils.fromWei(existingNextJackpotValueWei, 'ether');
        
        // Calculate 90% current jackpot
        const currentJackpotS = parseFloat(jackpotValueS) * 0.9;
        
        // Add 10% of current jackpot to existing next jackpot
        const additionalNextJackpotS = parseFloat(jackpotValueS) * 0.1;
        const totalNextJackpotS = parseFloat(existingNextJackpotValueS) + additionalNextJackpotS;
        
        // Custom formatting logic
        const formatJackpot = (value) => {
          if (value >= 1) {
            return Math.round(value).toString();
          } else {
            return value.toFixed(2);
          }
        };
        
        setJackpotValue(formatJackpot(currentJackpotS));
        setNextJackpotValue(formatJackpot(totalNextJackpotS));
      } catch (err) {
        console.error("Error loading jackpot data:", err);
        setJackpotValue("N/A");
        setNextJackpotValue("N/A");
      }
  
      // Costs
      try {
        const guessCostWei = await jackpot.methods.guessCost().call();
        const guessCostTokens = (window.BigInt(guessCostWei) / window.BigInt(10 ** 6)).toString();
        setGuessCost(guessCostTokens);

        const hintCostWei = await jackpot.methods.hintCost().call();
        const hintCostTokens = (window.BigInt(hintCostWei) / window.BigInt(10 ** 6)).toString();
        setHintCost(hintCostTokens);
      } catch (err) {
        console.error("Error loading cost data:", err);
        setGuessCost("N/A");
        setHintCost("N/A");
      }
      
      // Stats
      try {
        const totalWinnerCount = await jackpot.methods.totalWinners().call();
        setTotalWinners(totalWinnerCount);
        
        const uniquePlayerCount = await jackpot.methods.uniquePlayers().call();
        setUniquePlayers(uniquePlayerCount);
      } catch (err) {
        console.error("Error loading stats:", err);
      }
      
      // Load user's purchased hints
      await loadPurchasedHints();
      
      setIsLoading(false);
      setStatusMessage('');
    } catch (error) {
      console.error("Error loading contract data:", error);
      setStatusMessage('Error loading data. Please check your connection.');
      setIsLoading(false);
    }
  }, [loadPurchasedHints]);

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
        // Approve tokens
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
        // Get the hint from our off-chain storage
        const hint = HINTS[hintIndex] || "Hint content not available for this index";
        setHintValue(hint);
        
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const calculateGuessChance = useCallback(async () => {
    if (!jackpotContract || !web3 || !accounts[0] || !currentGuess) return;
    
    try {
      const chance = await jackpotContract.methods.calculateGuessChance(currentGuess).call();
      setGuessChance(chance / 100 + '%');
    } catch (error) {
      console.error("Error calculating guess chance:", error);
      setGuessChance('0%');
    }
  }, [jackpotContract, web3, accounts, currentGuess]);

  const makeGuess = async () => {
    if (!jackpotContract || !web3 || !accounts[0] || !currentGuess) {
      setStatusMessage('Please connect your wallet and enter a guess');
      return;
    }
    
    try {
      setIsLoading(true);
      setStatusMessage('Submitting guess... Please confirm in your wallet');
      
      // Check if token is approved
      const allowance = await tokenContract.methods.allowance(accounts[0], JACKPOT_ADDRESS).call();
      const guessCostWei = await jackpotContract.methods.guessCost().call();
      
      if (parseInt(allowance) < parseInt(guessCostWei)) {
        // Approve tokens
        setStatusMessage('Approving tokens for guess... Please confirm in your wallet');
        await tokenContract.methods.approve(JACKPOT_ADDRESS, guessCostWei).send({
          from: accounts[0]
        });
      }
      
      // Make guess in a single step
      setStatusMessage('Checking your guess... Please confirm in your wallet');
      const result = await jackpotContract.methods.singleStepGuess(currentGuess).send({
        from: accounts[0]
      });
      
      // Check if user won from transaction events
      let won = false;
      if (result.events && result.events.GuessRevealed) {
        won = result.events.GuessRevealed.returnValues.won;
      }
      
      if (won) {
        setStatusMessage('🎉 Congratulations! Your guess was correct and you won the jackpot! 🎉');
      } else {
        setStatusMessage('Sorry, your guess was incorrect. Try again with another guess!');
      }
      
      // Reload contract data after guess
      await loadContractData(web3, jackpotContract, tokenContract, bondingCurveContract, accounts[0]);
      setCurrentGuess('');
      setIsLoading(false);
    } catch (error) {
      console.error("Error making guess:", error);
      setStatusMessage('Error making guess. Please try again.');
      setIsLoading(false);
    }
  };

  // Render hint history component
  const renderHintHistory = () => {
    if (purchasedHints.length === 0) return null;
    
    return (
      <div className="hint-history">
        <h3>Your Purchased Hints</h3>
        <ul>
          {purchasedHints.map(index => (
            <li key={index} className="hint-item">
              <span className="hint-number">Hint #{index + 1}:</span> {HINTS[index] || "Hint content not available for this index"}
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
          // Request account access
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);
          
          // Get user accounts
          const accts = await web3Instance.eth.getAccounts();
          setAccounts(accts);
          
          // Initialize contracts
          const jackpotInstance = new web3Instance.eth.Contract(JackpotGameABI.abi, JACKPOT_ADDRESS);
          const tokenInstance = new web3Instance.eth.Contract(Token100xABI.abi, TOKEN_ADDRESS);
          const bondingCurveInstance = new web3Instance.eth.Contract(BondingCurveABI.abi, BONDING_CURVE_ADDRESS);
          
          setJackpotContract(jackpotInstance);
          setTokenContract(tokenInstance);
          setBondingCurveContract(bondingCurveInstance);
          
          // Load initial data
          await loadContractData(web3Instance, jackpotInstance, tokenInstance, bondingCurveInstance, accts[0]);
        } catch (error) {
          console.error("User denied account access or error occurred:", error);
          setStatusMessage('Error connecting to wallet. Please check MetaMask.');
        }
      } else {
        setStatusMessage('Please install MetaMask to use this application.');
        console.log('Please install MetaMask!');
      }
    };
    
    initWeb3();
  }, [JACKPOT_ADDRESS, TOKEN_ADDRESS, BONDING_CURVE_ADDRESS, loadContractData]);

  useEffect(() => {
    if (currentGuess && jackpotContract && web3 && accounts[0]) {
      calculateGuessChance();
    }
  }, [currentGuess, jackpotContract, web3, accounts, calculateGuessChance]);

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
            <p className="info-item">Guess Cost: {guessCost} 100X</p>
            <p className="info-item">Hint Cost: {hintCost} 100X</p>
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
            <p className="guess-chance">Guess Chance: {guessChance}</p>
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
            {hintValue && <p className="hint-value">Hint: {hintValue}</p>}
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
        
        <section className="reward-split">
          <h2 className="section-title">Reward Distribution</h2>
          <div className="split-bars">
            <div className="split-item">
              <div className="split-bar">
                <div className="bar-fill" style={{width: `${splits[0]}%`}}></div>
              </div>
              <p className="split-label">Winner: {splits[0]}%</p>
            </div>
            <div className="split-item">
              <div className="split-bar">
                <div className="bar-fill" style={{width: `${splits[1]}%`}}></div>
              </div>
              <p className="split-label">Bonus: {splits[1]}%</p>
            </div>
            <div className="split-item">
              <div className="split-bar">
                <div className="bar-fill" style={{width: `${splits[2]}%`}}></div>
              </div>
              <p className="split-label">Token Holders: {splits[2]}%</p>
            </div>
            <div className="split-item">
              <div className="split-bar">
                <div className="bar-fill" style={{width: `${splits[3]}%`}}></div>
              </div>
              <p className="split-label">Liquidity: {splits[3]}%</p>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="app-footer">
        <p>DeFAI Hackathon Project - Sonic Chain - 2024</p>
      </footer>
    </div>
  );
};

export default App;