const hre = require("hardhat");
require('dotenv').config();

async function main() {
  const jackpotAddress = process.env.JACKPOT_ADDRESS;
  if (!jackpotAddress) {
    console.error("Please set JACKPOT_ADDRESS in .env file");
    process.exit(1);
  }
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Adding hint with account:", deployer.address);
  
  const jackpot = await hre.ethers.getContractAt("JackpotGame", jackpotAddress);
  
  console.log("Adding hint...");
  const tx = await jackpot.addHint();
  await tx.wait();
  console.log("Hint added! Transaction:", tx.hash);
  
  const hintCount = await jackpot.hintCount();
  console.log("Current hint count:", hintCount.toString());
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
