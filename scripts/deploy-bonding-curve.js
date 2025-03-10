// Script to deploy the BondingCurve contract
const hre = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("Deploying BondingCurve to Sonic network...");
  
  // Token100x address from previous deployment
  const token100xAddress = process.env.TOKEN_ADDRESS;
  if (!token100xAddress) {
    console.error("Please set the TOKEN_ADDRESS environment variable to the deployed Token100x address!");
    process.exit(1);
  }
  
  // Get the contract deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
  
  // Get Token100x contract instance
  const token100x = await hre.ethers.getContractAt("Token100x", token100xAddress);
  console.log("Token100x address:", token100xAddress);
  
  // Get the current nonce for the deployer
  const initialNonce = await hre.ethers.provider.getTransactionCount(deployer.address);
  console.log("Current deployer nonce:", initialNonce);
  
  // Predict the address of the BondingCurve contract
  const predictedAddress = hre.ethers.getCreateAddress({
    from: deployer.address,
    nonce: initialNonce + 1 // Approval will use current nonce, deployment will use next
  });
  console.log("Predicted BondingCurve address:", predictedAddress);
  
  // Approve the predicted BondingCurve address to spend tokens
  const seedAmount = BigInt(110_000_000) * BigInt(10**6); // 110M 100X tokens (with 6 decimals)
  console.log("Approving transfer of 110M tokens to the BondingCurve...");
  
  const approveTx = await token100x.approve(predictedAddress, seedAmount);
  await approveTx.wait();
  console.log("Approval complete. Tx hash:", approveTx.hash);
  
  // Deploy the BondingCurve contract
  console.log("Deploying BondingCurve contract...");
  const BondingCurve = await hre.ethers.getContractFactory("BondingCurve");
  const bondingCurve = await BondingCurve.deploy(token100xAddress);
  
  // Wait for the deployment to complete
  await bondingCurve.waitForDeployment();
  const bondingAddress = await bondingCurve.getAddress();
  
  console.log("BondingCurve deployed to:", bondingAddress);
  
  // Verify the predicted address matches the deployed address
  if (bondingAddress.toLowerCase() === predictedAddress.toLowerCase()) {
    console.log("✅ Address prediction was correct");
  } else {
    console.warn("⚠️ Address prediction was incorrect!");
    console.log("Predicted:", predictedAddress);
    console.log("Actual:", bondingAddress);
  }
  
  // Check if the tokens were successfully seeded to the BondingCurve
  const bondingTokenBalance = await token100x.balanceOf(bondingAddress);
  console.log("BondingCurve token balance:", bondingTokenBalance.toString());
  
  if (bondingTokenBalance >= seedAmount) {
    console.log("✅ Token seeding successful");
  } else {
    console.error("❌ Token seeding failed!");
    console.log("Expected:", seedAmount.toString());
    console.log("Actual:", bondingTokenBalance.toString());
  }
  
  // Save the contract address for environment variables
  console.log("Please set the following in your .env file:");
  console.log(`BONDING_CURVE_ADDRESS=${bondingAddress}`);
  
  // Log the info needed for contract verification
  console.log("To verify on block explorer:");
  console.log(`npx hardhat verify --network sonicTestnet ${bondingAddress} ${token100xAddress}`);
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
