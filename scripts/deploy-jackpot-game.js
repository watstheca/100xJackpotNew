// Script to deploy the JackpotGame contract
const hre = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("Deploying JackpotGame to Sonic network...");
  
  // Get addresses from previous deployments
  const token100xAddress = process.env.TOKEN_ADDRESS;
  const bondingCurveAddress = process.env.BONDING_CURVE_ADDRESS;
  
  if (!token100xAddress || !bondingCurveAddress) {
    console.error("Please set the TOKEN_ADDRESS and BONDING_CURVE_ADDRESS environment variables!");
    process.exit(1);
  }
  
  // Get the contract deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
  
  // We'll use deployer as the marketing wallet initially (can be changed later)
  const marketingWallet = deployer.address;
  
  // Deploy the JackpotGame contract
  console.log("Deploying JackpotGame contract with the following parameters:");
  console.log("- Token100x address:", token100xAddress);
  console.log("- BondingCurve address:", bondingCurveAddress);
  console.log("- Marketing wallet:", marketingWallet);
  
  // Use the correct contract path
  const JackpotGame = await hre.ethers.getContractFactory("JackpotGame");
  const jackpotGame = await JackpotGame.deploy(
    token100xAddress,
    bondingCurveAddress,
    marketingWallet,
    { gasLimit: 8000000 } // Higher gas limit
  );
  
  // Wait for the deployment to complete
  await jackpotGame.waitForDeployment();
  const gameAddress = await jackpotGame.getAddress();
  
  console.log("JackpotGame deployed to:", gameAddress);
  
  // Update environment variables for subsequent scripts
  console.log("Updating .env file with JACKPOT_ADDRESS");
  // In a real script, you would update the .env file here
  
  // Update the jackpot address in the BondingCurve contract
  console.log("Setting JackpotGame as the jackpot address in BondingCurve...");
  const bondingCurve = await hre.ethers.getContractAt("BondingCurve", bondingCurveAddress);
  
  // Get current jackpot address
  const currentJackpotAddress = await bondingCurve.jackpotAddress();
  if (currentJackpotAddress.toLowerCase() === gameAddress.toLowerCase()) {
    console.log("Jackpot address already set correctly.");
  } else {
    console.log("Current jackpot address:", currentJackpotAddress);
    console.log("Setting to:", gameAddress);
    
    const txJackpot = await bondingCurve.setJackpotAddress(gameAddress);
    await txJackpot.wait();
    console.log("Jackpot address updated. Tx hash:", txJackpot.hash);
  }
  
  // Unpause the bonding curve so players can buy tokens
  const isPaused = await bondingCurve.paused();
  if (isPaused) {
    console.log("Unpausing BondingCurve...");
    const txUnpause = await bondingCurve.unpause();
    await txUnpause.wait();
    console.log("BondingCurve unpaused. Tx hash:", txUnpause.hash);
  } else {
    console.log("BondingCurve is already unpaused.");
  }
  
  // Fund the jackpot with some initial S
  const initialFundingAmount = hre.ethers.parseEther("0.1"); // 0.1 S
  console.log(`Funding jackpot with ${hre.ethers.formatEther(initialFundingAmount)} S...`);
  
  const txFund = await jackpotGame.fundJackpot({ value: initialFundingAmount });
  await txFund.wait();
  console.log("Jackpot funded. Tx hash:", txFund.hash);
  
  // Print a summary of the deployment
  console.log("\n====== DEPLOYMENT SUMMARY ======");
  console.log("Token100x:", token100xAddress);
  console.log("BondingCurve:", bondingCurveAddress);
  console.log("JackpotGame:", gameAddress);
  console.log("Marketing Wallet:", marketingWallet);
  console.log("Initial Jackpot:", hre.ethers.formatEther(initialFundingAmount), "S");
  console.log("===============================\n");
  
  // Save the contract addresses to the environment file
  console.log("Please set the following in your .env file:");
  console.log(`JACKPOT_ADDRESS=${gameAddress}`);
  
  // Log the info needed for contract verification
  console.log("To verify on block explorer:");
  console.log(`npx hardhat verify --network sonicTestnet ${gameAddress} ${token100xAddress} ${bondingCurveAddress} ${marketingWallet}`);
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });