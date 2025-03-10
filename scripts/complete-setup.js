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
  
  // 1. Set LiquidityPoolFactory in BondingCurve
  if (factoryAddress) {
    console.log("Setting LiquidityPoolFactory in BondingCurve...");
    const tx1 = await bondingCurve.setLiquidityPoolFactory(factoryAddress);
    await tx1.wait();
    console.log("Factory set. Tx hash:", tx1.hash);
  } else {
    console.log("Skipping factory setup - LIQUIDITY_POOL_FACTORY_ADDRESS not set");
  }
  
  // 2. Set Initial Secret
  console.log("Setting initial secret in JackpotGame...");
  // Generate a random salt (32 bytes)
  const salt = hre.ethers.randomBytes(32);
  
  // IMPORTANT: Replace this with your actual secret word
  const secretWord = "Sonic4Lyfe"; 
  
  // Create the hash of the secret + salt
  const secretHash = hre.ethers.keccak256(
    hre.ethers.concat([
      hre.ethers.toUtf8Bytes(secretWord),
      salt
    ])
  );
  
  const tx2 = await jackpotGame.setSecretHash(secretHash, salt);
  await tx2.wait();
  console.log("Secret set. Tx hash:", tx2.hash);
  console.log("Secret word:", secretWord);
  console.log("Salt (hex):", hre.ethers.hexlify(salt));
  
  // 3. Add an initial hint
  console.log("Adding initial hint...");
  const tx3 = await jackpotGame.addHint();
  await tx3.wait();
  console.log("Hint added. Tx hash:", tx3.hash);
  
  // 4. Set batch interval (e.g., 60 minutes)
  console.log("Setting batch interval to 0 minutes...");
  const tx4 = await jackpotGame.setBatchInterval(0);
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