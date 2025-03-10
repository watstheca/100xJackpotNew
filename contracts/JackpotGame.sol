// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IBondingCurve {
    function sell(uint256 gameAmount) external returns (uint256);
    function getPoolInfo() external view returns (uint256 accountingS, uint256 actualS, uint256 tokenBalance);
}

/**
 * @title JackpotGame
 * @dev Optimized jackpot guessing game with DeFAI integration
 */
contract JackpotGame is AccessControl, ReentrancyGuard, Pausable {
    // External contracts
    IERC20 public gameToken;
    IBondingCurve public bondingCurve;
    
    // Game configuration
    address public marketingWallet;
    address public defaiAgent;
    uint256 public guessCost;
    uint256 public hintCost;
    uint256 public revealDelay;
    uint256 public batchInterval;
    
    // Game state
    uint256 public totalPayouts;
    uint256 public jackpotAmount;
    uint256 public nextJackpotAmount;
    uint256 public totalGuesses;
    bytes32 public secretHash;
    bytes32 public salt;
    uint256 public lastBatchTime;
    uint256 public accumulated100X;
    
    // Statistics
    uint256 public totalWinners;
    uint256 public lastWinTime;
    address public lastWinner;
    uint256 public uniquePlayers;
    
    // Funds distribution
    uint256 public burnPercent = 30;
    uint256 public jackpotPercent = 45;
    uint256 public nextJackpotPercent = 15;
    uint256 public marketingPercent = 10;
    
    // Hint system - only track purchases, content stored off-chain
    uint256 public hintCount;
    // Track hint purchases
    mapping(address => mapping(uint256 => bool)) public hintPurchases;
    
    // User data
    mapping(address => uint256) public playerGuesses;
    mapping(address => bytes32) public commitments;
    mapping(address => uint256) public commitBlocks;
    mapping(address => bool) public hasPlayed;
    
    // Roles
    bytes32 public constant PASSWORD_SETTER_ROLE = keccak256("PASSWORD_SETTER_ROLE");
    bytes32 public constant DEFAI_AGENT_ROLE = keccak256("DEFAI_AGENT_ROLE");
    bytes32 public constant HINT_MANAGER_ROLE = keccak256("HINT_MANAGER_ROLE");
    
    // Events
    event GuessCommitted(address indexed player, bytes32 commitment);
    event GuessRevealed(address indexed player, string guess, bool won);
    event HintRequested(address indexed player, uint256 hintIndex);
    event HintAdded(uint256 index);
    event GameUpdate(string message);
    event JackpotWon(address indexed winner, uint256 amount, string guess);
    event NewPlayer(address indexed player);
    event SocialAnnouncement(string announcementType, string message);

    constructor(address _gameToken, address _bondingCurve, address _marketingWallet) {
        require(_gameToken != address(0), "Invalid token address");
        require(_bondingCurve != address(0), "Invalid curve address");
        require(_marketingWallet != address(0), "Invalid wallet address");
        
        gameToken = IERC20(_gameToken);
        bondingCurve = IBondingCurve(_bondingCurve);
        marketingWallet = _marketingWallet;
        
        guessCost = 10000 * 10**6; // 10,000 100X
        hintCost = 5000 * 10**6; // 5,000 100X
        revealDelay = 10; // ~20 seconds
        lastBatchTime = block.timestamp;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PASSWORD_SETTER_ROLE, msg.sender);
        _grantRole(HINT_MANAGER_ROLE, msg.sender);
    }

    function fundJackpot() external payable onlyRole(DEFAULT_ADMIN_ROLE) {
        require(msg.value > 0, "Must send S to fund jackpot");
        jackpotAmount += msg.value;
        emit SocialAnnouncement("JACKPOT_FUNDED", "Jackpot funded!");
    }

    function setSecretHash(bytes32 _hashedSecret, bytes32 _newSalt) external onlyRole(PASSWORD_SETTER_ROLE) whenNotPaused {
        salt = _newSalt;
        secretHash = _hashedSecret;
        emit SocialAnnouncement("NEW_SECRET", "New secret set!");
    }

    // Add a new hint (only increments count, content is off-chain)
    function addHint() external onlyRole(HINT_MANAGER_ROLE) whenNotPaused {
        hintCount++;
        emit HintAdded(hintCount - 1);
        emit SocialAnnouncement("NEW_HINT", "New hint available!");
    }

    function hasAccessToHint(address user, uint256 hintIndex) external view returns (bool) {
        return hintPurchases[user][hintIndex];
    }

    function setDefaiAgent(address _agent) external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused {
        require(_agent != address(0), "Invalid agent address");
        defaiAgent = _agent;
        _grantRole(DEFAI_AGENT_ROLE, _agent);
    }

    function emitGameUpdate(string memory _message) external whenNotPaused {
        require(msg.sender == defaiAgent || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Unauthorized");
        emit GameUpdate(_message);
    }

    /**
     * @dev Make a guess in a single transaction
     * @param _guess The player's guess
     * @return won Whether the guess was correct
     */
    function singleStepGuess(string memory _guess) external whenNotPaused nonReentrant returns (bool won) {
        require(gameToken.transferFrom(msg.sender, address(this), guessCost), "Transfer failed");
        
        // Update game metrics
        totalGuesses++;
        playerGuesses[msg.sender]++;
        
        // Track unique players
        if (!hasPlayed[msg.sender]) {
            hasPlayed[msg.sender] = true;
            uniquePlayers++;
            emit NewPlayer(msg.sender);
        }
        
        // Add tokens to accumulated batch
        accumulated100X += guessCost;

        // Check if guess is correct
        won = (keccak256(abi.encodePacked(_guess, salt)) == secretHash);
        if (won) {
            // Calculate payouts
            uint256 payout = (jackpotAmount * 90) / 100;
            uint256 remainder = jackpotAmount - payout;
            uint256 originalNextJackpot = nextJackpotAmount;
            uint256 rollover = (originalNextJackpot * 90) / 100;
            uint256 newNextJackpot = (originalNextJackpot * 10) / 100;
            
            // Update game state
            require(address(this).balance >= payout, "Insufficient S for payout");
            jackpotAmount = remainder + rollover;
            nextJackpotAmount = newNextJackpot;
            
            // Update statistics
            totalWinners++;
            totalPayouts += payout;
            lastWinTime = block.timestamp;
            lastWinner = msg.sender;
            
            // Transfer winnings
            (bool sent, ) = msg.sender.call{value: payout}("");
            require(sent, "Payout failed");
            
            // Emit events for DeFAI
            emit JackpotWon(msg.sender, payout, _guess);
            
            string memory message = string(abi.encodePacked(
                "We have a winner! ",
                _truncateAddress(msg.sender),
                " just won ",
                _uintToString(payout / 10**18),
                ".",
                _uintToString((payout % 10**18) / 10**16),
                " S by guessing the secret: ",
                _guess
            ));
            emit SocialAnnouncement("JACKPOT_WON", message);
        }

        emit GuessRevealed(msg.sender, _guess, won);

        // Process batch if interval has passed
        if (batchInterval > 0 && block.timestamp >= lastBatchTime + (batchInterval * 60)) {
            _processBatch();
        }
        
        return won;
    }

    function requestHint() external whenNotPaused nonReentrant {
        require(hintCount > 0, "No hints available");
        require(gameToken.transferFrom(msg.sender, address(this), hintCost), "Transfer failed");
        
        // Record the hint purchase for the user
        hintPurchases[msg.sender][hintCount - 1] = true;
        
        accumulated100X += hintCost;
        
        if (batchInterval > 0 && block.timestamp >= lastBatchTime + (batchInterval * 60)) {
            _processBatch();
        }
        emit HintRequested(msg.sender, hintCount - 1);
    }

    function _processBatch() internal {
        if (accumulated100X == 0) return;

        uint256 total100X = accumulated100X;
        accumulated100X = 0;

        uint256 burnAmount = (total100X * burnPercent) / 100;
        uint256 toSell = total100X - burnAmount;
        uint256 sReceived;

        if (burnAmount > 0) {
            gameToken.transfer(address(0xdead), burnAmount);
        }

        if (toSell > 0) {
            gameToken.approve(address(bondingCurve), toSell);
            sReceived = bondingCurve.sell(toSell);
        }

        uint256 totalNonBurnPercent = jackpotPercent + nextJackpotPercent + marketingPercent;
        uint256 jackpotShare = (sReceived * jackpotPercent) / totalNonBurnPercent;
        uint256 nextJackpotShare = (sReceived * nextJackpotPercent) / totalNonBurnPercent;
        uint256 marketingShare = (sReceived * marketingPercent) / totalNonBurnPercent;

        jackpotAmount += jackpotShare;
        nextJackpotAmount += nextJackpotShare;
        
        if (marketingShare > 0) {
            (bool sent, ) = marketingWallet.call{value: marketingShare}("");
            require(sent, "Marketing transfer failed");
        }

        lastBatchTime = block.timestamp;
    }

    function updateSplit(uint256 _burn, uint256 _jackpot, uint256 _next, uint256 _marketing) external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused {
        require(_burn + _jackpot + _next + _marketing == 100, "Must sum to 100");
        burnPercent = _burn;
        jackpotPercent = _jackpot;
        nextJackpotPercent = _next;
        marketingPercent = _marketing;
    }

    function setMarketingWallet(address _newWallet) external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused {
        require(_newWallet != address(0), "Invalid address");
        marketingWallet = _newWallet;
    }

    function setCosts(uint256 _guessCost, uint256 _hintCost) external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused {
        guessCost = _guessCost;
        hintCost = _hintCost;
    }

    function getSplit() external view returns (uint256, uint256, uint256, uint256) {
        return (burnPercent, jackpotPercent, nextJackpotPercent, marketingPercent);
    }

    function getGameStats() external view returns (uint256, uint256, uint256, uint256) {
        return (totalGuesses, uniquePlayers, totalWinners, jackpotAmount);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function _truncateAddress(address addr) internal pure returns (string memory) {
        bytes memory addressBytes = abi.encodePacked(addr);
        bytes memory result = new bytes(13);
        
        // First 6 chars
        for(uint i = 0; i < 6; i++) {
            result[i] = addressBytes[i + 2]; // +2 to skip 0x
        }
        
        // Add "..."
        result[6] = '.';
        result[7] = '.';
        result[8] = '.';
        
        // Last 4 chars
        for(uint i = 0; i < 4; i++) {
            result[i + 9] = addressBytes[i + (addressBytes.length - 4)];
        }
        
        return string(result);
    }

    function _uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        
        uint256 temp = value;
        uint256 digits;
        
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }

    receive() external payable {
        revert("Use fundJackpot");
    }
}