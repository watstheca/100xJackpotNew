# simplified_agent.py
import os
import time
import json
import logging
import tweepy
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("100xJackpotAgent")

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
def post_twitter_update(message):
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

# Main function to simulate agent activity
def run_demo_agent():
    """Run a simplified demo of the agent for the hackathon"""
    logger.info("Starting 100x Jackpot DeFAI Agent (Demo Mode)")
    
    # Post initial announcement
    post_twitter_update("🚀 100x Jackpot DeFAI Agent is now active! Will you solve the secret and win the jackpot? #100xJackpot #DeFAI #SonicHackathon")
    
    # Simulate some events
    events = [
        {
            "type": "new_player",
            "message": "🎮 Welcome to our 25th player! The 100x Jackpot community keeps growing! Current jackpot: 15.75 S #100xJackpot #CryptoGaming"
        },
        {
            "type": "hint_added",
            "message": "🔍 New hint added to the 100x Jackpot game! Purchase it in-game to get closer to solving the secret! Current jackpot: 15.75 S #100xJackpot #CryptoGame"
        },
        {
            "type": "jackpot_win",
            "message": "🎊 JACKPOT WON! 🎊\n\nAddress 0x1234...5678 just won 15.75 S by correctly guessing: 'SonicSpeed4'\n\nThe jackpot has been reset. Can you solve the next secret? #100xJackpot #CryptoWin"
        },
        {
            "type": "game_stats",
            "message": "📊 100x Jackpot Game Update 📊\n\nCurrent Jackpot: 5.50 S\nTotal Players: 42\nTotal Guesses: 156\n100X Price: 0.00012500 S\nLast Win: 2 hours ago\n\n#100xJackpot #DeFAI #CryptoGaming"
        }
    ]
    
    # Post events with delay
    for event in events:
        logger.info(f"Processing simulated event: {event['type']}")
        post_twitter_update(event['message'])
        
        # Wait before next event
        delay = 60  # 1 minute between events
        logger.info(f"Waiting {delay} seconds before next event...")
        time.sleep(delay)
    
    logger.info("Demo completed successfully!")

# Run the demo
if __name__ == "__main__":
    run_demo_agent()