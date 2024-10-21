const { ethers } = require("hardhat");

async function main() {
  const PROXY_ADDRESS = "0xe6a54Ce9e840f51D7493F0b882e38Ff611fdd7a6";
  const GitHubSplits = await ethers.getContractFactory("GitHubSplits");
  const contract = GitHubSplits.attach(PROXY_ADDRESS);

  const [owner, addr1, addr2] = await ethers.getSigners();
  console.log("Interacting as owner:", owner.address);

  // 1. Add shares for GitHub users
  console.log("\nAdding shares for GitHub users:");
  await addShare(contract, "user1", 50);
  await addShare(contract, "user2", 30);
  await addShare(contract, "user3", 20);

  // 2. Check total shares
  const totalShares = await contract.totalShares();
  console.log("\nTotal shares:", totalShares.toString());

  // 3. Send donation to contract
  console.log("\nSending donation to contract:");
  const donationAmount = ethers.parseEther("0.1");
  await sendDonation(owner, PROXY_ADDRESS, donationAmount);

  // 4. Check contract balance
  const balance = await ethers.provider.getBalance(PROXY_ADDRESS);
  console.log("Contract balance:", ethers.formatEther(balance), "ETH");

  // 5. Simulate claims for each user
  console.log("\nSimulating claims:");
  await simulateClaim(contract, "user1", addr1);
  await simulateClaim(contract, "user2", addr2);
  await simulateClaim(contract, "user3", owner);

  // 6. Check contract balance after claims
  const finalBalance = await ethers.provider.getBalance(PROXY_ADDRESS);
  console.log(
    "\nFinal contract balance:",
    ethers.formatEther(finalBalance),
    "ETH"
  );

  // 7. Test hasShares function
  console.log("\nTesting hasShares function:");
  console.log("user1 has shares:", await contract.hasShares("user1"));
  console.log(
    "nonexistent user has shares:",
    await contract.hasShares("nonexistent")
  );

  // Event listeners
  console.log("\nSetting up event listeners (will run for 30 seconds):");
  setupEventListeners(contract);

  // Wait for 30 seconds to catch any events
  await new Promise((resolve) => setTimeout(resolve, 30000));
}

async function addShare(contract, username, shareAmount) {
  try {
    const tx = await contract.addShare(username, shareAmount);
    await tx.wait();
    console.log(`Share added for ${username}: ${shareAmount}`);
  } catch (error) {
    console.error(`Failed to add share for ${username}:`, error.message);
  }
}

async function sendDonation(signer, contractAddress, amount) {
  try {
    const tx = await signer.sendTransaction({
      to: contractAddress,
      value: amount,
    });
    await tx.wait();
    console.log(
      `Donation of ${ethers.formatEther(amount)} ETH sent to contract`
    );
  } catch (error) {
    console.error("Failed to send donation:", error.message);
  }
}

async function simulateClaim(contract, username, signer) {
  try {
    // In a real scenario, you'd generate a proper proof here
    const dummyProof = ethers.randomBytes(32);
    const tx = await contract.connect(signer).claim(username, dummyProof);
    await tx.wait();
    console.log(`Claim simulated for ${username}`);
  } catch (error) {
    console.error(`Claim failed for ${username}:`, error.message);
  }
}

function setupEventListeners(contract) {
  contract.on("ShareAdded", (username, amount) => {
    console.log(`Event: ShareAdded for ${username}, amount: ${amount}`);
  });

  contract.on("FundsClaimed", (username, amount) => {
    console.log(
      `Event: FundsClaimed by ${username}, amount: ${ethers.formatEther(
        amount
      )} ETH`
    );
  });

  contract.on("FundsWithdrawn", (owner, amount) => {
    console.log(
      `Event: FundsWithdrawn by ${owner}, amount: ${ethers.formatEther(
        amount
      )} ETH`
    );
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exitCode = 1;
  });
