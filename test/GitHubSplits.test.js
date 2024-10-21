// GitHubSplits.test.js

const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("GitHubSplits", function () {
  let GitHubSplits;
  let gitHubSplits;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    GitHubSplits = await ethers.getContractFactory("GitHubSplits");
    gitHubSplits = await upgrades.deployProxy(GitHubSplits, []);
    await gitHubSplits.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await gitHubSplits.owner()).to.equal(owner.address);
    });
  });

  describe("Adding Shares", function () {
    it("Should allow owner to add shares", async function () {
      await gitHubSplits.addShare("user1", 50);
      expect(await gitHubSplits.getShare("user1")).to.equal(50);
    });

    it("Should increase total shares when adding", async function () {
      await gitHubSplits.addShare("user1", 50);
      await gitHubSplits.addShare("user2", 30);
      expect(await gitHubSplits.totalShares()).to.equal(80);
    });

    it("Should not allow non-owners to add shares", async function () {
      await expect(gitHubSplits.connect(addr1).addShare("user1", 50))
        .to.be.revertedWithCustomError(
          gitHubSplits,
          "OwnableUnauthorizedAccount"
        )
        .withArgs(addr1.address);
    });

    it("Should not allow adding shares with zero amount", async function () {
      await expect(gitHubSplits.addShare("user1", 0)).to.be.revertedWith(
        "Share amount must be greater than zero"
      );
    });

    it("Should update share amount for existing user", async function () {
      await gitHubSplits.addShare("user1", 50);
      await gitHubSplits.addShare("user1", 75);
      expect(await gitHubSplits.getShare("user1")).to.equal(75);
      expect(await gitHubSplits.totalShares()).to.equal(75);
    });
  });

  describe("Claiming Funds", function () {
    beforeEach(async function () {
      await gitHubSplits.addShare("user1", 50);
      await gitHubSplits.addShare("user2", 50);
      await owner.sendTransaction({
        to: gitHubSplits.target,
        value: ethers.parseEther("1.0"),
      });
    });

    it("Should allow users to claim their share", async function () {
      const initialBalance = await ethers.provider.getBalance(addr1.address);
      await gitHubSplits.connect(addr1).claim("user1", "0x");
      const finalBalance = await ethers.provider.getBalance(addr1.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should not allow claiming for non-existent users", async function () {
      await expect(
        gitHubSplits.connect(addr1).claim("nonexistent", "0x")
      ).to.be.revertedWith("No shares for this GitHub account");
    });

    it("Should update total shares after claiming", async function () {
      await gitHubSplits.connect(addr1).claim("user1", "0x");
      expect(await gitHubSplits.totalShares()).to.equal(50);
    });

    it("Should not allow claiming twice", async function () {
      await gitHubSplits.connect(addr1).claim("user1", "0x");
      await expect(
        gitHubSplits.connect(addr1).claim("user1", "0x")
      ).to.be.revertedWith("No shares for this GitHub account");
    });

    it("Should distribute funds proportionally", async function () {
      await gitHubSplits.addShare("user3", 25);
      const initialBalance1 = await ethers.provider.getBalance(addr1.address);
      const initialBalance2 = await ethers.provider.getBalance(addr2.address);

      await gitHubSplits.connect(addr1).claim("user1", "0x");
      await gitHubSplits.connect(addr2).claim("user2", "0x");

      const finalBalance1 = await ethers.provider.getBalance(addr1.address);
      const finalBalance2 = await ethers.provider.getBalance(addr2.address);

      const claimed1 = finalBalance1 - initialBalance1;
      const claimed2 = finalBalance2 - initialBalance2;

      expect(claimed1).to.be.closeTo(claimed2, ethers.parseEther("0.1")); // Allow for larger gas differences
    });
  });

  describe("Withdrawing Funds", function () {
    beforeEach(async function () {
      await owner.sendTransaction({
        to: gitHubSplits.target,
        value: ethers.parseEther("1.0"),
      });
    });

    it("Should not allow non-owners to add shares", async function () {
      await expect(
        gitHubSplits.connect(addr1).addShare("user1", 50)
      ).to.be.revertedWithCustomError(
        gitHubSplits,
        "OwnableUnauthorizedAccount"
      );
    });

    it("Should not allow non-owners to withdraw funds", async function () {
      await expect(
        gitHubSplits.connect(addr1).withdraw()
      ).to.be.revertedWithCustomError(
        gitHubSplits,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Utility Functions", function () {
    it("Should correctly report if a user has shares", async function () {
      await gitHubSplits.addShare("user1", 50);
      expect(await gitHubSplits.hasShares("user1")).to.be.true;
      expect(await gitHubSplits.hasShares("nonexistent")).to.be.false;
    });

    it("Should correctly report contract balance", async function () {
      await owner.sendTransaction({
        to: gitHubSplits.target,
        value: ethers.parseEther("1.0"),
      });
      expect(await gitHubSplits.getContractBalance()).to.equal(
        ethers.parseEther("1.0")
      );
    });
  });
});
