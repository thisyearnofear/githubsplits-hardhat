const { ethers, upgrades } = require("hardhat");

async function main() {
  const GitHubSplits = await ethers.getContractFactory("GitHubSplits");
  console.log("Deploying GitHubSplits...");
  const githubSplits = await upgrades.deployProxy(GitHubSplits, [], {
    initializer: "initialize",
  });
  await githubSplits.waitForDeployment();
  console.log("GitHubSplits deployed to:", await githubSplits.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
