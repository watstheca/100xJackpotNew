// Create a script like grant-admin-role.js
const hre = require("hardhat");
require('dotenv').config();

async function main() {
  const jackpotGame = await hre.ethers.getContractAt("JackpotGame", process.env.JACKPOT_ADDRESS);
  
  // Grant ADMIN role to bonding curve
  const DEFAULT_ADMIN_ROLE = await jackpotGame.DEFAULT_ADMIN_ROLE();
  await jackpotGame.grantRole(DEFAULT_ADMIN_ROLE, process.env.BONDING_CURVE_ADDRESS);
  console.log("Admin role granted to BondingCurve");
}

main().catch(console.error);