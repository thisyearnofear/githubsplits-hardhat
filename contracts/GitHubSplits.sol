// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract GitHubSplits is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    mapping(bytes32 => uint256) public shares;
    uint256 public totalShares;

    event ShareAdded(string githubUsername, uint256 shareAmount);
    event FundsClaimed(string githubUsername, uint256 amount);
    event FundsWithdrawn(address owner, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() initializer public {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
    }

  function addShare(string memory githubUsername, uint256 shareAmount) external onlyOwner {
  require(shareAmount > 0, "Share amount must be greater than zero");
  bytes32 usernameHash = keccak256(abi.encodePacked(githubUsername));
  totalShares = totalShares - shares[usernameHash] + shareAmount;
  shares[usernameHash] = shareAmount;
  emit ShareAdded(githubUsername, shareAmount);
}

    function claim(string memory githubUsername, bytes memory proof) external {
  bytes32 usernameHash = keccak256(abi.encodePacked(githubUsername));
  require(shares[usernameHash] > 0, "No shares for this GitHub account");
  require(verifyGitHubProof(githubUsername, proof), "Invalid proof");
  
  uint256 amount = calculateClaimableAmount(usernameHash);
  totalShares -= shares[usernameHash];
  shares[usernameHash] = 0;
  payable(msg.sender).transfer(amount);
  emit FundsClaimed(githubUsername, amount);
}

    function verifyGitHubProof(string memory, bytes memory) internal pure returns (bool) {
        // Placeholder for GitHub verification logic
        // For MVP, we'll always return true
        return true;
    }

    function calculateClaimableAmount(bytes32 usernameHash) internal view returns (uint256) {
        uint256 balance = address(this).balance;
        return (balance * shares[usernameHash]) / totalShares;
    }

    function getShare(string memory githubUsername) external view returns (uint256) {
        bytes32 usernameHash = keccak256(abi.encodePacked(githubUsername));
        return shares[usernameHash];
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function withdraw() external onlyOwner {
        uint256 amount = address(this).balance;
        payable(owner()).transfer(amount);
        emit FundsWithdrawn(owner(), amount);
    }

    function hasShares(string memory githubUsername) external view returns (bool) {
        bytes32 usernameHash = keccak256(abi.encodePacked(githubUsername));
        return shares[usernameHash] > 0;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}

    receive() external payable {}
}