const { ethers } = require("hardhat");

async function main() {
  const PROXY_ADDRESS = "0xe6a54Ce9e840f51D7493F0b882e38Ff611fdd7a6"; // Replace with your actual proxy address
  const GitHubSplits = await ethers.getContractFactory("GitHubSplits");
  const contract = GitHubSplits.attach(PROXY_ADDRESS);

  const [owner] = await ethers.getSigners();
  console.log("Attempting to withdraw as:", owner.address);

  // Check contract balance before withdrawal
  const balanceBefore = await ethers.provider.getBalance(PROXY_ADDRESS);
  console.log(
    "Contract balance before withdrawal:",
    ethers.formatEther(balanceBefore),
    "ETH"
  );

  try {
    const tx = await contract.withdraw();
    await tx.wait();
    console.log("Withdrawal transaction hash:", tx.hash);
    console.log("Funds withdrawn successfully");

    // Check contract balance after withdrawal
    const balanceAfter = await ethers.provider.getBalance(PROXY_ADDRESS);
    console.log(
      "Contract balance after withdrawal:",
      ethers.formatEther(balanceAfter),
      "ETH"
    );
  } catch (error) {
    console.error("Failed to withdraw funds:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
