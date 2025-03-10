const { ethers } = require('ethers');

const secret = 'Sonic4Lyfe'; // Your secret
const salt = ethers.randomBytes(32);
const secretHash = ethers.keccak256(
  ethers.concat([ethers.toUtf8Bytes(secret), salt])
);

console.log('Secret:', secret);
console.log('Salt (hex):', ethers.hexlify(salt));
console.log('Secret Hash:', secretHash);
