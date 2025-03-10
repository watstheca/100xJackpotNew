const hre = require("hardhat");
require('dotenv').config();

async function main() {
  const jackpotAddress = process.env.JACKPOT_ADDRESS;
  if (!jackpotAddress) {
    console.error("Please set JACKPOT_ADDRESS in .env file");
    process.exit(1);
  }

  // REPLACE these with values from step 6
  const secretHash = "0xa5ff6746db689a6ca1364a67fc5be194cad69b6a4564ad8295f463ae0c1ee0c1"; // your generated hash
  const salt = "0x5022eea3f992c945cf665082e8405c8896ce02527f3d8f49a17b27ba68364021"; // your generated salt
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Setting secret with account:", deployer.address);
  
  const jackpot = await hre.ethers.getContractAt("JackpotGame", jackpotAddress);
  
  console.log("Setting secret hash...");
  const tx = await jackpot.setSecretHash(secretHash, salt);
  await tx.wait();
  console.log("Secret hash set! Transaction:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
