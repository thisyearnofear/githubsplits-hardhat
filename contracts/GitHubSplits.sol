// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract GitHubSplits is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    mapping(bytes32 => uint256) public shares;
    uint256 public totalShares;
    bytes32[] public usernames;

    event ShareAdded(string indexed githubUsername, uint256 shareAmount);
    event FundsClaimed(string indexed githubUsername, uint256 amount);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    event Donation(address indexed donor, uint256 amount);

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
        require(bytes(githubUsername).length <= 32, "Username too long");
        bytes32 usernameBytes = stringToBytes32(githubUsername);
        if (shares[usernameBytes] == 0) {
            usernames.push(usernameBytes);
        }
        totalShares = totalShares - shares[usernameBytes] + shareAmount;
        shares[usernameBytes] = shareAmount;
        emit ShareAdded(githubUsername, shareAmount);
    }

    function getAllShares() external view returns (string[] memory, uint256[] memory) {
        string[] memory usernamesStr = new string[](usernames.length);
        uint256[] memory amounts = new uint256[](usernames.length);
        
        for (uint256 i = 0; i < usernames.length; i++) {
            usernamesStr[i] = bytes32ToString(usernames[i]);
            amounts[i] = shares[usernames[i]];
        }
        
        return (usernamesStr, amounts);
    }

    function claim(string memory githubUsername, bytes memory proof) external {
        bytes32 usernameBytes = stringToBytes32(githubUsername);
        require(shares[usernameBytes] > 0, "No shares for this GitHub account");
        require(verifyGitHubProof(githubUsername, proof), "Invalid proof");
        
        uint256 amount = calculateClaimableAmount(usernameBytes);
        totalShares -= shares[usernameBytes];
        shares[usernameBytes] = 0;
        
        // Replace transfer with call
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundsClaimed(githubUsername, amount);
    }

    function verifyGitHubProof(string memory, bytes memory) internal pure returns (bool) {
        // Placeholder for GitHub verification logic
        // For MVP, we'll always return true
        return true;
    }

    function calculateClaimableAmount(bytes32 usernameBytes) internal view returns (uint256) {
        uint256 balance = address(this).balance;
        return (balance * shares[usernameBytes]) / totalShares;
    }

    function getShare(string memory githubUsername) external view returns (uint256) {
        bytes32 usernameBytes = stringToBytes32(githubUsername);
        return shares[usernameBytes];
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function withdraw() external onlyOwner {
        uint256 amount = address(this).balance;
        // Replace transfer with call
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Transfer failed");
        emit FundsWithdrawn(owner(), amount);
    }

    function hasShares(string memory githubUsername) external view returns (bool) {
        bytes32 usernameBytes = stringToBytes32(githubUsername);
        return shares[usernameBytes] > 0;
    }

    function stringToBytes32(string memory source) internal pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly {
            result := mload(add(source, 32))
        }
    }

    function bytes32ToString(bytes32 _bytes32) public pure returns (string memory) {
        uint8 i = 0;
        while(i < 32 && _bytes32[i] != 0) {
            i++;
        }
        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}

    function donate() external payable {
        require(msg.value > 0, "Donation amount must be greater than zero");
        emit Donation(msg.sender, msg.value);
    }

    receive() external payable {
        emit Donation(msg.sender, msg.value);
    }
}
