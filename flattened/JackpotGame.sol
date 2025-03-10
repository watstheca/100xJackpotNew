// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// OpenZeppelin Contracts (last updated v5.1.0) (token/ERC20/IERC20.sol)
/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

interface IAccessControl {
    /**
     * @dev The `account` is missing a role.
     */
    error AccessControlUnauthorizedAccount(address account, bytes32 neededRole);

    /**
     * @dev The caller of a function is not the expected one.
     *
     * NOTE: Don't confuse with {AccessControlUnauthorizedAccount}.
     */
    error AccessControlBadConfirmation();

    /**
     * @dev Emitted when `newAdminRole` is set as ``role``'s admin role, replacing `previousAdminRole`
     *
     * `DEFAULT_ADMIN_ROLE` is the starting admin for all roles, despite
     * {RoleAdminChanged} not being emitted signaling this.
     */
    event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);

    /**
     * @dev Emitted when `account` is granted `role`.
     *
     * `sender` is the account that originated the contract call. This account bears the admin role (for the granted role).
     * Expected in cases where the role was granted using the internal {AccessControl-_grantRole}.
     */
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Emitted when `account` is revoked `role`.
     *
     * `sender` is the account that originated the contract call:
     *   - if using `revokeRole`, it is the admin role bearer
     *   - if using `renounceRole`, it is the role bearer (i.e. `account`)
     */
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) external view returns (bool);

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {AccessControl-_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function grantRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function revokeRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been granted `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     */
    function renounceRole(bytes32 role, address callerConfirmation) external;
}

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[ERC section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

abstract contract ERC165 is IERC165 {
    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/AccessControl.sol)
/**
 * @dev Contract module that allows children to implement role-based access
 * control mechanisms. This is a lightweight version that doesn't allow enumerating role
 * members except through off-chain means by accessing the contract event logs. Some
 * applications may benefit from on-chain enumerability, for those cases see
 * {AccessControlEnumerable}.
 *
 * Roles are referred to by their `bytes32` identifier. These should be exposed
 * in the external API and be unique. The best way to achieve this is by
 * using `public constant` hash digests:
 *
 * ```solidity
 * bytes32 public constant MY_ROLE = keccak256("MY_ROLE");
 * ```
 *
 * Roles can be used to represent a set of permissions. To restrict access to a
 * function call, use {hasRole}:
 *
 * ```solidity
 * function foo() public {
 *     require(hasRole(MY_ROLE, msg.sender));
 *     ...
 * }
 * ```
 *
 * Roles can be granted and revoked dynamically via the {grantRole} and
 * {revokeRole} functions. Each role has an associated admin role, and only
 * accounts that have a role's admin role can call {grantRole} and {revokeRole}.
 *
 * By default, the admin role for all roles is `DEFAULT_ADMIN_ROLE`, which means
 * that only accounts with this role will be able to grant or revoke other
 * roles. More complex role relationships can be created by using
 * {_setRoleAdmin}.
 *
 * WARNING: The `DEFAULT_ADMIN_ROLE` is also its own admin: it has permission to
 * grant and revoke this role. Extra precautions should be taken to secure
 * accounts that have been granted it. We recommend using {AccessControlDefaultAdminRules}
 * to enforce additional security measures for this role.
 */
abstract contract AccessControl is Context, IAccessControl, ERC165 {
    struct RoleData {
        mapping(address account => bool) hasRole;
        bytes32 adminRole;
    }

    mapping(bytes32 role => RoleData) private _roles;

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    /**
     * @dev Modifier that checks that an account has a specific role. Reverts
     * with an {AccessControlUnauthorizedAccount} error including the required role.
     */
    modifier onlyRole(bytes32 role) {
        _checkRole(role);
        _;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IAccessControl).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) public view virtual returns (bool) {
        return _roles[role].hasRole[account];
    }

    /**
     * @dev Reverts with an {AccessControlUnauthorizedAccount} error if `_msgSender()`
     * is missing `role`. Overriding this function changes the behavior of the {onlyRole} modifier.
     */
    function _checkRole(bytes32 role) internal view virtual {
        _checkRole(role, _msgSender());
    }

    /**
     * @dev Reverts with an {AccessControlUnauthorizedAccount} error if `account`
     * is missing `role`.
     */
    function _checkRole(bytes32 role, address account) internal view virtual {
        if (!hasRole(role, account)) {
            revert AccessControlUnauthorizedAccount(account, role);
        }
    }

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) public view virtual returns (bytes32) {
        return _roles[role].adminRole;
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleGranted} event.
     */
    function grantRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleRevoked} event.
     */
    function revokeRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _revokeRole(role, account);
    }

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been revoked `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     *
     * May emit a {RoleRevoked} event.
     */
    function renounceRole(bytes32 role, address callerConfirmation) public virtual {
        if (callerConfirmation != _msgSender()) {
            revert AccessControlBadConfirmation();
        }

        _revokeRole(role, callerConfirmation);
    }

    /**
     * @dev Sets `adminRole` as ``role``'s admin role.
     *
     * Emits a {RoleAdminChanged} event.
     */
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual {
        bytes32 previousAdminRole = getRoleAdmin(role);
        _roles[role].adminRole = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }

    /**
     * @dev Attempts to grant `role` to `account` and returns a boolean indicating if `role` was granted.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleGranted} event.
     */
    function _grantRole(bytes32 role, address account) internal virtual returns (bool) {
        if (!hasRole(role, account)) {
            _roles[role].hasRole[account] = true;
            emit RoleGranted(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Attempts to revoke `role` to `account` and returns a boolean indicating if `role` was revoked.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleRevoked} event.
     */
    function _revokeRole(bytes32 role, address account) internal virtual returns (bool) {
        if (hasRole(role, account)) {
            _roles[role].hasRole[account] = false;
            emit RoleRevoked(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }
}

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/ReentrancyGuard.sol)
/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (utils/Pausable.sol)
/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract Pausable is Context {
    bool private _paused;

    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    /**
     * @dev The operation failed because the contract is paused.
     */
    error EnforcedPause();

    /**
     * @dev The operation failed because the contract is not paused.
     */
    error ExpectedPause();

    /**
     * @dev Initializes the contract in unpaused state.
     */
    constructor() {
        _paused = false;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Throws if the contract is paused.
     */
    function _requireNotPaused() internal view virtual {
        if (paused()) {
            revert EnforcedPause();
        }
    }

    /**
     * @dev Throws if the contract is not paused.
     */
    function _requirePaused() internal view virtual {
        if (!paused()) {
            revert ExpectedPause();
        }
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}

// SPDX-License-Identifier: UNLICENSED
interface IBondingCurve {
    function sell(uint256 gameAmount) external returns (uint256);
    function getPoolInfo() external view returns (uint256 accountingS, uint256 actualS, uint256 tokenBalance);
}

interface IToken100x {
    function burn(uint256 amount) external;
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
        // Instead of sending to dead address, use the token's burn function
        // gameToken.transfer(address(0xdead), burnAmount);
        IToken100x(address(gameToken)).burn(burnAmount);
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

function setBatchInterval(uint256 _interval) external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused {
    batchInterval = _interval;
}

/**
 * @dev Allows admin to withdraw tokens and S from the contract in case of emergency
 * @param _token Address of token to withdraw (use address(0) for S)
 * @param _to Recipient address
 * @param _amount Amount to withdraw
 */
function emergencyWithdraw(
    address _token,
    address _to,
    uint256 _amount
) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_to != address(0), "Invalid recipient");
    require(_amount > 0, "Invalid amount");
    
    if (_token == address(0)) {
        // Withdraw S (native currency)
        require(_amount <= address(this).balance, "Insufficient S balance");
        
        // Keep track of any affected balances
        if (_amount > jackpotAmount + nextJackpotAmount) {
            // If trying to withdraw more than jackpot balances,
            // reset jackpot amounts to zero
            jackpotAmount = 0;
            nextJackpotAmount = 0;
        } else {
            // First, drain nextJackpotAmount
            if (_amount <= nextJackpotAmount) {
                nextJackpotAmount -= _amount;
            } else {
                uint256 remainingAmount = _amount - nextJackpotAmount;
                nextJackpotAmount = 0;
                jackpotAmount -= remainingAmount;
            }
        }
        
        // Send S to recipient
        (bool sent, ) = _to.call{value: _amount}("");
        require(sent, "S transfer failed");
    } else {
        // Withdraw ERC20 tokens
        require(_token == address(gameToken), "Only game token can be withdrawn");
        
        // If withdrawing game tokens, reset accumulated tokens
        if (_amount >= accumulated100X) {
            accumulated100X = 0;
        } else {
            accumulated100X -= _amount;
        }
        
        // Transfer tokens to recipient
        IERC20(_token).transfer(_to, _amount);
    }
    
    // Let everyone know an emergency withdrawal occurred
    emit SocialAnnouncement("EMERGENCY_WITHDRAWAL", "Emergency funds withdrawal executed by admin");
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