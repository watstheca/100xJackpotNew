const hre = require("hardhat");
require('dotenv').config();

async function main() {
  const jackpotAddress = process.env.JACKPOT_ADDRESS;
  
  const jackpot = await hre.ethers.getContractAt("JackpotGame", jackpotAddress);
  
  // Display current costs
  const guessCost = await jackpot.guessCost();
  const hintCost = await jackpot.hintCost();
  
  console.log("Current costs:");
  console.log(`Guess Cost: ${guessCost / 10**6} 100X`);
  console.log(`Hint Cost: ${hintCost / 10**6} 100X`);
  
  // Uncomment to update costs
  // const tx = await jackpot.setCosts(newGuessCost, newHintCost);
  // await tx.wait();
  // console.log("Costs updated!");
}

main().catch(error => console.error(error));
