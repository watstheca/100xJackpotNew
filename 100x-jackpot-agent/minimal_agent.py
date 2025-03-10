import os
import time
import json
import logging
import tweepy
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("100xJackpotAgent")

# Contract addresses and RPC URL
RPC_URL = os.getenv("RPC_URL", "https://rpc.sonic.fantom.network")
JACKPOT_ADDRESS = os.getenv("JACKPOT_ADDRESS", "0x1bCb1B4474b636874E1C35B0CC32ADb408bb43e0")

# Twitter configuration
TWITTER_API_KEY = os.getenv("TWITTER_API_KEY")
TWITTER_API_SECRET = os.getenv("TWITTER_API_SECRET")
TWITTER_ACCESS_TOKEN = os.getenv("TWITTER_ACCESS_TOKEN")
TWITTER_ACCESS_SECRET = os.getenv("TWITTER_ACCESS_SECRET")

# Initialize Twitter client
twitter = None
if all([TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET]):
    twitter = tweepy.Client(
        consumer_key=TWITTER_API_KEY,
        consumer_secret=TWITTER_API_SECRET,
        access_token=TWITTER_ACCESS_TOKEN,
        access_token_secret=TWITTER_ACCESS_SECRET
    )
    logger.info("Twitter client initialized (v2 API)")
else:
    logger.warning("Twitter credentials not found, social posting disabled")

# Function to post tweets
def post_tweet(message):
    """Post a message to Twitter using v2 API"""
    logger.info(f"Preparing to tweet: {message}")
    
    if twitter:
        try:
            response = twitter.create_tweet(text=message)
            logger.info(f"Tweet posted successfully! Tweet ID: {response.data['id']}")
            return True
        except Exception as e:
            logger.error(f"Error posting to Twitter: {e}")
            return False
    else:
        logger.warning("Twitter client not available, skipping tweet")
        return False

# Function to make RPC calls directly
def make_rpc_call(method, params=None):
    """Make a direct JSON-RPC call to the blockchain"""
    if params is None:
        params = []
    
    payload = {
        "jsonrpc": "2.0",
        "method": method,
        "params": params,
        "id": int(time.time() * 1000)
    }
    
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(RPC_URL, json=payload, headers=headers)
        return response.json()
    except Exception as e:
        logger.error(f"RPC call error: {e}")
        return None

# Function to check blockchain connection
def check_blockchain_connection():
    """Check if we can connect to the blockchain"""
    result = make_rpc_call("eth_blockNumber")
    if result and "result" in result:
        block_number = int(result["result"], 16)
        logger.info(f"Connected to blockchain. Current block: {block_number}")
        return True
    else:
        logger.error("Failed to connect to blockchain")
        return False

# Main function
def run_agent():
    """Run the 100x Jackpot DeFAI Agent"""
    logger.info("Starting 100x Jackpot DeFAI Agent")
    
    # Check blockchain connection
    if not check_blockchain_connection():
        logger.error("Cannot connect to blockchain. Exiting.")
        return
    
    # Post initial announcement
    post_tweet("🚀 100x Jackpot DeFAI Agent is now connected to the Sonic blockchain! Monitoring 100x Jackpot events in real-time. #100xJackpot #DeFAI #SonicHackathon")
    
    # Run demo mode for hackathon
    logger.info("Running in demo mode for hackathon")
    
    # Simulate blockchain events for the demo
    events = [
        "🎮 DeFAI Agent detected a new player joining the 100x Jackpot game on the Sonic blockchain! #100xJackpot #DeFAI",
        "🔍 DeFAI Agent detected a new hint purchase on-chain for the 100x Jackpot game! #100xJackpot #DeFAI",
        "📊 DeFAI Agent detected updated game stats: 25 players, 156 guesses, 15.75 S jackpot #100xJackpot #DeFAI"
    ]
    
    # Post events with delay
    for event in events:
        post_tweet(event)
        delay = 60  # 1 minute between events
        logger.info(f"Waiting {delay} seconds before next event...")
        time.sleep(delay)
    
    # Final message
    post_tweet("💡 This concludes our 100x Jackpot DeFAI Agent demo for the Sonic Hackathon! In production, this agent would monitor events 24/7. #100xJackpot #DeFAI #SonicHackathon")
    
    logger.info("Demo completed successfully!")

# Run the agent
if __name__ == "__main__":
    run_agent()