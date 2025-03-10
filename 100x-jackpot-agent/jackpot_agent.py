"""
100x Jackpot DeFAI Agent - Full Production Version

A DeFAI agent that monitors on-chain events from the 100x Jackpot game
and posts updates to Twitter in real-time.
"""

import asyncio
import json
import logging
import os
import time
from datetime import datetime
from typing import Dict, List, Optional

import tweepy
from web3 import Web3
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("100xJackpotAgent")

# Contract addresses
JACKPOT_ADDRESS = os.getenv("JACKPOT_ADDRESS", "0x1bCb1B4474b636874E1C35B0CC32ADb408bb43e0")
TOKEN_ADDRESS = os.getenv("TOKEN_ADDRESS", "0x0755fb9917419a08c90a0Fd245F119202844ec3D")
BONDING_CURVE_ADDRESS = os.getenv("BONDING_CURVE_ADDRESS", "0x2ECA93adD34C533008b947B2Ed02e4974122D525")

# Load private key for transactions (if needed)
AGENT_PRIVATE_KEY = os.getenv("AGENT_PRIVATE_KEY")

# Load contract ABIs from files
try:
    with open("JackpotGame.json", "r") as f:
        JACKPOT_ABI = json.load(f)

    with open("Token100x.json", "r") as f:
        TOKEN_ABI = json.load(f)

    with open("BondingCurve.json", "r") as f:
        BONDING_CURVE_ABI = json.load(f)
        
    logger.info("Contract ABIs loaded successfully")
except Exception as e:
    logger.error(f"Error loading contract ABIs: {e}")
    raise

# Twitter configuration from environment variables
TWITTER_API_KEY = os.getenv("TWITTER_API_KEY")
TWITTER_API_SECRET = os.getenv("TWITTER_API_SECRET")
TWITTER_ACCESS_TOKEN = os.getenv("TWITTER_ACCESS_TOKEN")
TWITTER_ACCESS_SECRET = os.getenv("TWITTER_ACCESS_SECRET")

# Game statistics for analytics
class GameStats:
    def __init__(self):
        self.total_guesses = 0
        self.unique_players = 0
        self.total_winners = 0
        self.jackpot_amount = 0
        self.last_update = time.time()
        self.last_win_time = 0
        self.last_winner = None
        self.token_price = 0
        self.liquidity = 0
        self.hints_purchased = []
        self.last_hint_time = 0
        self.hint_count = 0
        self.recent_activities = []  # List of recent activities for periodic summaries
        
    def add_activity(self, activity_type: str, message: str, timestamp: float = None):
        """Add an activity to the recent activities log"""
        if timestamp is None:
            timestamp = time.time()
        
        self.recent_activities.append({
            "type": activity_type,
            "message": message,
            "timestamp": timestamp
        })
        
        # Keep only the last 100 activities
        if len(self.recent_activities) > 100:
            self.recent_activities = self.recent_activities[-100:]

# Class for the 100x Jackpot DeFAI Agent
class JackpotAgent:
    def __init__(self, rpc_url: str):
        # Initialize Web3 connection
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        if not self.w3.is_connected():
            raise ConnectionError(f"Failed to connect to RPC: {rpc_url}")
        
        logger.info(f"Connected to blockchain at {rpc_url}")
        
        # Initialize contracts
        self.jackpot_contract = self.w3.eth.contract(
            address=self.w3.to_checksum_address(JACKPOT_ADDRESS),
            abi=JACKPOT_ABI
        )
        
        self.token_contract = self.w3.eth.contract(
            address=self.w3.to_checksum_address(TOKEN_ADDRESS),
            abi=TOKEN_ABI
        )
        
        self.bonding_curve = self.w3.eth.contract(
            address=self.w3.to_checksum_address(BONDING_CURVE_ADDRESS),
            abi=BONDING_CURVE_ABI
        )
        
        # Set up account if private key is provided
        self.account = None
        if AGENT_PRIVATE_KEY:
            self.account = self.w3.eth.account.from_key(AGENT_PRIVATE_KEY)
            logger.info(f"Using account: {self.account.address}")
        
        # Initialize game statistics
        self.stats = GameStats()
        
        # Initialize Twitter client
        self.twitter = None
        if all([TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET]):
            self.twitter = tweepy.Client(
                consumer_key=TWITTER_API_KEY,
                consumer_secret=TWITTER_API_SECRET,
                access_token=TWITTER_ACCESS_TOKEN,
                access_token_secret=TWITTER_ACCESS_SECRET
            )
            logger.info("Twitter client initialized (v2 API)")
        else:
            logger.warning("Twitter credentials not found, social posting disabled")
        
        # Event filters for listening to contract events
        self.jackpot_won_filter = self.jackpot_contract.events.JackpotWon.create_filter(
            fromBlock='latest'
        )
        
        self.social_announcement_filter = self.jackpot_contract.events.SocialAnnouncement.create_filter(
            fromBlock='latest'
        )
        
        self.new_player_filter = self.jackpot_contract.events.NewPlayer.create_filter(
            fromBlock='latest'
        )
        
        self.hint_requested_filter = self.jackpot_contract.events.HintRequested.create_filter(
            fromBlock='latest'
        )
        
        self.hint_added_filter = self.jackpot_contract.events.HintAdded.create_filter(
            fromBlock='latest'
        )
        
        # Initialize timers for periodic activities
        self.last_stats_update = time.time()
        self.last_social_post = time.time()
        
        logger.info("Jackpot Agent initialized and ready")
    
    async def run(self):
        """Main loop for the agent"""
        logger.info("Starting Jackpot Agent")
        
        # Initialize game statistics from contracts
        await self.update_game_stats()
        
        # First-time announcement
        jackpot_amount = self.stats.jackpot_amount
        await self.post_social_update(f"🚀 100x Jackpot DeFAI Agent is now active! Current jackpot: {jackpot_amount:.2f} S. Will you solve the secret and win? #100xJackpot #DeFAI")
        
        # Main event loop
        try:
            while True:
                # Check for new events
                await self.check_contract_events()
                
                # Perform periodic updates
                current_time = time.time()
                
                # Update game stats every 5 minutes
                if current_time - self.last_stats_update > 300:
                    await self.update_game_stats()
                    self.last_stats_update = current_time
                
                # Post periodic updates every 4 hours if there has been activity
                if current_time - self.last_social_post > 14400 and len(self.stats.recent_activities) > 0:
                    await self.post_periodic_summary()
                    self.last_social_post = current_time
                
                # Sleep to avoid excessive polling
                await asyncio.sleep(15)
                
        except KeyboardInterrupt:
            logger.info("Agent shutting down by user request")
        except Exception as e:
            logger.error(f"Error in main loop: {e}", exc_info=True)
    
    async def check_contract_events(self):
        """Check for new events from the contracts"""
        try:
            # Check for jackpot wins
            for event in self.jackpot_won_filter.get_new_entries():
                await self.handle_jackpot_win(event)
            
            # Check for social announcements
            for event in self.social_announcement_filter.get_new_entries():
                await self.handle_social_announcement(event)
            
            # Check for new players
            for event in self.new_player_filter.get_new_entries():
                await self.handle_new_player(event)
            
            # Check for hint requests
            for event in self.hint_requested_filter.get_new_entries():
                await self.handle_hint_request(event)
            
            # Check for new hints
            for event in self.hint_added_filter.get_new_entries():
                await self.handle_hint_added(event)
            
        except Exception as e:
            logger.error(f"Error checking contract events: {e}", exc_info=True)
    
    async def handle_jackpot_win(self, event):
        """Handle a jackpot win event"""
        logger.info(f"Jackpot win detected: {event}")
        
        # Extract event data
        winner = event.args.winner
        amount = self.w3.from_wei(event.args.amount, 'ether')
        guess = event.args.guess
        
        # Update stats
        self.stats.last_winner = winner
        self.stats.last_win_time = time.time()
        self.stats.total_winners += 1
        
        # Create winner announcement
        winner_addr = self.truncate_address(winner)
        announcement = (
            f"🎊 JACKPOT WON! 🎊\n\n"
            f"Address {winner_addr} just won {amount:.2f} S by correctly guessing: '{guess}'\n\n"
            f"The jackpot has been reset. Can you solve the next secret? #100xJackpot #CryptoWin"
        )
        
        # Post to social media
        await self.post_social_update(announcement)
        
        # Add to activity log
        self.stats.add_activity(
            "jackpot_win", 
            f"Jackpot won by {winner_addr}: {amount:.2f} S with guess '{guess}'"
        )
        
        # Update game stats after a jackpot win
        await self.update_game_stats()
    
    async def handle_social_announcement(self, event):
        """Handle a social announcement event from the contract"""
        logger.info(f"Social announcement: {event}")
        
        announcement_type = event.args.announcementType
        message = event.args.message
        
        # Add to activity log
        self.stats.add_activity("announcement", f"{announcement_type}: {message}")
        
        # Prepare social media post based on announcement type
        if announcement_type == "NEW_SECRET":
            post = "🔐 A new secret has been set in the 100x Jackpot game! Can you solve it and win the jackpot? #100xJackpot #CryptoGame"
        elif announcement_type == "NEW_HINT":
            post = f"🔍 New hint available in the 100x Jackpot game! {message} Purchase it in-game to get closer to solving the secret! #100xJackpot"
        elif announcement_type == "JACKPOT_FUNDED":
            # Get current jackpot amount
            jackpot = self.w3.from_wei(await self.jackpot_contract.functions.jackpotAmount().call(), 'ether')
            post = f"💰 The jackpot has been funded! Current jackpot: {jackpot:.2f} S. Will you be the one to solve the secret? #100xJackpot #CryptoJackpot"
        elif announcement_type == "JACKPOT_WON":
            # This is handled by the JackpotWon event, but we'll post the message anyway
            post = f"🎉 {message} #100xJackpot #CryptoWin"
        else:
            # Generic announcement
            post = f"📢 {announcement_type}: {message} #100xJackpot"
        
        # Post to social media
        await self.post_social_update(post)
    
    async def handle_new_player(self, event):
        """Handle a new player joining the game"""
        player = event.args.player
        player_addr = self.truncate_address(player)
        
        logger.info(f"New player joined: {player_addr}")
        
        # Update stats
        self.stats.unique_players += 1
        
        # Add to activity log
        self.stats.add_activity("new_player", f"New player joined: {player_addr}")
        
        # Every 10th player gets a special announcement
        if self.stats.unique_players % 10 == 0:
            # Get current jackpot amount
            jackpot = self.w3.from_wei(await self.jackpot_contract.functions.jackpotAmount().call(), 'ether')
            
            post = (
                f"🎮 Welcome to our {self.stats.unique_players}th player! "
                f"The 100x Jackpot community keeps growing! Current jackpot: "
                f"{jackpot:.2f} S "
                f"#100xJackpot #CryptoGaming"
            )
            await self.post_social_update(post)
    
    async def handle_hint_request(self, event):
        """Handle a hint request event"""
        player = event.args.player
        hint_index = event.args.hintIndex
        
        logger.info(f"Hint requested: Player {self.truncate_address(player)} requested hint #{hint_index}")
        
        # Update stats
        self.stats.hints_purchased.append(hint_index)
        self.stats.last_hint_time = time.time()
        
        # Add to activity log
        self.stats.add_activity(
            "hint_purchased", 
            f"Player {self.truncate_address(player)} purchased hint #{hint_index}"
        )
        
        # Every 5th hint purchase gets a social media post
        hint_count = len(self.stats.hints_purchased)
        if hint_count % 5 == 0:
            # Get current jackpot amount
            jackpot = self.w3.from_wei(await self.jackpot_contract.functions.jackpotAmount().call(), 'ether')
            
            post = (
                f"🔍 {hint_count} hints have been purchased by players trying to solve the secret! "
                f"Will someone crack the code soon? Current jackpot: "
                f"{jackpot:.2f} S "
                f"#100xJackpot #CryptoDetective"
            )
            await self.post_social_update(post)
    
    async def handle_hint_added(self, event):
        """Handle a new hint being added to the game"""
        hint_index = event.args.index
        
        logger.info(f"New hint added: Hint #{hint_index}")
        
        # Update stats
        self.stats.hint_count += 1
        
        # Add to activity log
        self.stats.add_activity("hint_added", f"New hint #{hint_index} added to the game")
        
        # Post to social media
        # Get current jackpot amount
        jackpot = self.w3.from_wei(await self.jackpot_contract.functions.jackpotAmount().call(), 'ether')
        
        post = (
            f"🔍 New hint added to the 100x Jackpot game! Purchase it in-game to get closer to solving the secret! "
            f"Current jackpot: {jackpot:.2f} S "
            f"#100xJackpot #CryptoGame"
        )
        await self.post_social_update(post)
    
    async def update_game_stats(self):
        """Update game statistics from the contracts"""
        logger.info("Updating game statistics")
        
        try:
            # Get jackpot game stats
            game_stats = await self.jackpot_contract.functions.getGameStats().call()
            self.stats.total_guesses = game_stats[0]
            self.stats.unique_players = game_stats[1]
            self.stats.total_winners = game_stats[2]
            self.stats.jackpot_amount = self.w3.from_wei(game_stats[3], 'ether')
            
            # Get token price and liquidity
            try:
                pool_info = await self.bonding_curve.functions.getPoolInfo().call()
                self.stats.liquidity = self.w3.from_wei(pool_info[1], 'ether')  # actualS
                
                current_price_wei = await self.bonding_curve.functions.getCurrentPrice().call()
                self.stats.token_price = self.w3.from_wei(current_price_wei, 'ether')
            except Exception as e:
                logger.warning(f"Error getting token data: {e}")
            
            # Get hint count
            try:
                self.stats.hint_count = await self.jackpot_contract.functions.hintCount().call()
            except Exception as e:
                logger.warning(f"Error getting hint count: {e}")
            
            logger.info(f"Stats updated: {self.stats.total_guesses} guesses, " +
                       f"{self.stats.unique_players} players, " +
                       f"{self.stats.total_winners} winners, " +
                       f"Jackpot: {self.stats.jackpot_amount:.2f} S")
            
            # Update last update time
            self.stats.last_update = time.time()
            
        except Exception as e:
            logger.error(f"Error updating game stats: {e}", exc_info=True)
    
    async def post_periodic_summary(self):
        """Post a periodic summary of game activity"""
        if not self.stats.recent_activities:
            return  # No activities to report
        
        logger.info("Generating periodic summary")
        
        # Sort activities by time (newest first)
        recent = sorted(
            self.stats.recent_activities,
            key=lambda x: x["timestamp"],
            reverse=True
        )[:10]  # Get 10 most recent activities
        
        # Calculate time since last win
        time_since_last_win = "Never" if not self.stats.last_win_time else self.format_time_ago(self.stats.last_win_time)
        
        # Create summary post
        summary = (
            f"📊 100x Jackpot Game Update 📊\n\n"
            f"Current Jackpot: {self.stats.jackpot_amount:.2f} S\n"
            f"Total Players: {self.stats.unique_players}\n"
            f"Total Guesses: {self.stats.total_guesses}\n"
            f"100X Price: {self.stats.token_price:.8f} S\n"
            f"Last Win: {time_since_last_win}\n\n"
            f"#100xJackpot #DeFAI #CryptoGaming"
        )
        
        # Post to social media
        await self.post_social_update(summary)
    
    async def post_social_update(self, message: str):
        """Post a message to Twitter using v2 API"""
        # Log the message
        logger.info(f"Social update: {message}")
        
        # Post to Twitter if available
        if self.twitter:
            try:
                response = self.twitter.create_tweet(text=message)
                logger.info(f"Tweet posted successfully! Tweet ID: {response.data['id']}")
            except Exception as e:
                logger.error(f"Error posting to Twitter: {e}")
        
        # Call the emitGameUpdate function on the jackpot contract if account is set up
        if self.account:
            try:
                # Build transaction
                tx = self.jackpot_contract.functions.emitGameUpdate(message[:100]).build_transaction({
                    'from': self.account.address,
                    'nonce': self.w3.eth.get_transaction_count(self.account.address),
                    'gas': 200000,
                    'gasPrice': self.w3.eth.gas_price
                })
                
                # Sign and send transaction
                signed_tx = self.w3.eth.account.sign_transaction(tx, self.account.key)
                tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
                
                logger.info(f"Called emitGameUpdate. Transaction hash: {tx_hash.hex()}")
            except Exception as e:
                logger.error(f"Error calling emitGameUpdate: {e}")
        else:
            logger.info("No account configured, skipping on-chain emitGameUpdate call")
            
        # Track the last social post time
        self.last_social_post = time.time()
    
    def truncate_address(self, address: str) -> str:
        """Format an address for display (e.g., 0x1234...5678)"""
        if not address:
            return "None"
        return f"{address[:6]}...{address[-4:]}"
    
    def format_time_ago(self, timestamp: float) -> str:
        """Format a timestamp as a human-readable 'time ago' string"""
        if not timestamp:
            return "Never"
            
        seconds_ago = time.time() - timestamp
        
        if seconds_ago < 60:
            return "Just now"
        elif seconds_ago < 3600:
            minutes = int(seconds_ago / 60)
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        elif seconds_ago < 86400:
            hours = int(seconds_ago / 3600)
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        else:
            days = int(seconds_ago / 86400)
            return f"{days} day{'s' if days != 1 else ''} ago"

# Run the agent
if __name__ == "__main__":
    # Get RPC URL from environment or use default
    rpc_url = os.getenv("RPC_URL", "https://rpc.sonic.fantom.network")
    
    # Create and run the agent
    agent = JackpotAgent(rpc_url)
    
    # Run the agent using asyncio
    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(agent.run())
    except KeyboardInterrupt:
        logger.info("Agent stopped by user")
    except Exception as e:
        logger.error(f"Agent error: {e}", exc_info=True)
    finally:
        loop.close()