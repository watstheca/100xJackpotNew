# test_v2.py
import tweepy
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Twitter credentials
api_key = os.getenv("TWITTER_API_KEY")
api_secret = os.getenv("TWITTER_API_SECRET")
access_token = os.getenv("TWITTER_ACCESS_TOKEN")
access_secret = os.getenv("TWITTER_ACCESS_SECRET")

print(f"Using credentials:")
print(f"API Key: {api_key[:5]}...")
print(f"API Secret: {api_secret[:5]}...")
print(f"Access Token: {access_token[:5]}...")
print(f"Access Secret: {access_secret[:5]}...")

# Set up authentication for v2
client = tweepy.Client(
    consumer_key=api_key,
    consumer_secret=api_secret,
    access_token=access_token,
    access_token_secret=access_secret
)

# Test tweet with v2 API
try:
    response = client.create_tweet(text="Testing my 100x Jackpot DeFAI agent with Twitter API v2! #100xJackpot #SonicHackathon")
    print(f"Tweet posted successfully! Tweet ID: {response.data['id']}")
except Exception as e:
    print(f"Error: {e}")