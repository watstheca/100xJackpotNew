const ethers = require('ethers');

exports.handler = async function(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // HINTS securely stored server-side only
  const HINTS = [
    "The secret is related to the Sonic blockchain.",
    "The secret has exactly 11 characters in total.",
    "The secret includes both letters and a number.",
    "The secret contains the number '4'.",
    "The secret starts with a capital letter."
  ];

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const params = event.queryStringParameters;
  const hintIndex = parseInt(params.hintIndex);
  const userAddress = params.userAddress;

  // Return the hint if available
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
};
