// scripts/complete-setup.js
const hre = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("Completing setup for 100x Jackpot...");
  
  // Get deployed contract addresses
  const tokenAddress = process.env.TOKEN_ADDRESS;
  const bondingCurveAddress = process.env.BONDING_CURVE_ADDRESS;
  const jackpotAddress = process.env.JACKPOT_ADDRESS;
  const factoryAddress = process.env.LIQUIDITY_POOL_FACTORY_ADDRESS;
  
  console.log("Using addresses:");
  console.log("- Token:", tokenAddress);
  console.log("- BondingCurve:", bondingCurveAddress);
  console.log("- JackpotGame:", jackpotAddress);
  console.log("- Factory:", factoryAddress);
  
  // Get contract instances
  const bondingCurve = await hre.ethers.getContractAt("BondingCurve", bondingCurveAddress);
  const jackpotGame = await hre.ethers.getContractAt("JackpotGame", jackpotAddress);
  
 
  // 4. Set batch interval (e.g., 60 minutes)
  console.log("Setting batch interval to 1 minutes...");
  const tx4 = await jackpotGame.setBatchInterval(1);
  await tx4.wait();
  console.log("Batch interval set. Tx hash:", tx4.hash);
  
  console.log("\nSetup complete! The game is now ready to play.");
  console.log("Remember to keep the secret word secure and set up your off-chain systems for hint management.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });