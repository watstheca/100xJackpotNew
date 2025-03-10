const hre = require("hardhat");
require('dotenv').config();

async function main() {
  const jackpotAddress = process.env.JACKPOT_ADDRESS;
  
  const jackpot = await hre.ethers.getContractAt("JackpotGame", jackpotAddress);
  
  const jackpotAmount = await jackpot.jackpotAmount();
  const hintCount = await jackpot.hintCount();
  const totalGuesses = await jackpot.totalGuesses();
  const uniquePlayers = await jackpot.uniquePlayers();
  
  console.log("=== Game Status ===");
  console.log(`Jackpot Amount: ${hre.ethers.formatEther(jackpotAmount)} S`);
  console.log(`Hint Count: ${hintCount}`);
  console.log(`Total Guesses: ${totalGuesses}`);
  console.log(`Unique Players: ${uniquePlayers}`);
}

main().catch(error => console.error(error));
