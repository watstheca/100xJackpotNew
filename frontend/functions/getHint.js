const ethers = require('ethers');

// JackpotGame ABI (only the function we need)
const JACKPOT_ABI = [
  "function hasAccessToHint(address user, uint256 hintIndex) external view returns (bool)"
];

// Secure hint data only available on server-side
const HINTS = [
  "The secret is related to the Sonic blockchain.",
  "The secret has exactly 11 characters in total.",
  "The secret includes both letters and a number.",
  "The secret contains the number '4'.",
  "The secret starts with a capital letter.",
  "The secret word is 'Sonic4Lyfe'."
];

exports.handler = async function(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Get query parameters
  const params = event.queryStringParameters;
  const hintIndex = parseInt(params.hintIndex);
  const userAddress = params.userAddress;

  // Validate inputs
  if (isNaN(hintIndex) || !userAddress || !userAddress.startsWith('0x')) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid parameters' })
    };
  }

  try {
    // Initialize provider and contract
    const provider = new ethers.JsonRpcProvider(process.env.SONIC_RPC_URL);
    const jackpotContract = new ethers.Contract(
      process.env.JACKPOT_ADDRESS,
      JACKPOT_ABI,
      provider
    );

    // Check if user has access to the requested hint
    const hasAccess = await jackpotContract.hasAccessToHint(userAddress, hintIndex);

    if (!hasAccess) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'You have not purchased this hint' })
      };
    }

    // Return hint if the user has access
    if (hintIndex < HINTS.length) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ hintContent: HINTS[hintIndex] })
      };
    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Hint not found' })
      };
    }
  } catch (error) {
    console.error('Error retrieving hint:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};
