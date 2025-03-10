// Script to deploy the LiquidityPoolFactory contract
const hre = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("Deploying LiquidityPoolFactory to Sonic network...");
  
  // Get the contract deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Get addresses from previous deployments
  const bondingCurveAddress = process.env.BONDING_CURVE_ADDRESS;
  
  if (!bondingCurveAddress) {
    console.error("Please set the BONDING_CURVE_ADDRESS environment variable!");
    process.exit(1);
  }
  
  // Deploy LiquidityPoolFactory contract
  console.log("Deploying LiquidityPoolFactory contract...");
  const LiquidityPoolFactory = await hre.ethers.getContractFactory("LiquidityPoolFactory");
  const factory = await LiquidityPoolFactory.deploy();
  
  // Wait for deployment to complete
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  
  console.log("LiquidityPoolFactory deployed to:", factoryAddress);
  
  // Configure BondingCurve to use the factory
  console.log("Setting factory address in BondingCurve...");
  const bondingCurve = await hre.ethers.getContractAt("BondingCurve", bondingCurveAddress);
  
  const tx = await bondingCurve.setLiquidityPoolFactory(factoryAddress);
  await tx.wait();
  console.log("Factory address set in BondingCurve. Tx:", tx.hash);
  
  // Verify the setup
  const factoryInBondingCurve = await bondingCurve.liquidityPoolFactory();
  if (factoryInBondingCurve.toLowerCase() === factoryAddress.toLowerCase()) {
    console.log("✅ LiquidityPoolFactory successfully set in BondingCurve");
  } else {
    console.error("❌ LiquidityPoolFactory setting verification failed!");
    console.log("Expected:", factoryAddress);
    console.log("Actual:", factoryInBondingCurve);
  }
  
  // Update environment variables
  console.log("Please set the following in your .env file:");
  console.log(`LIQUIDITY_POOL_FACTORY_ADDRESS=${factoryAddress}`);
  
  // Print a summary of the deployment
  console.log("\n====== DEPLOYMENT SUMMARY ======");
  console.log("LiquidityPoolFactory:", factoryAddress);
  console.log("BondingCurve:", bondingCurveAddress);
  console.log("===============================\n");
  
  // Log the info needed for contract verification
  console.log("To verify on block explorer:");
  console.log(`npx hardhat verify --network sonicTestnet ${factoryAddress}`);
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
