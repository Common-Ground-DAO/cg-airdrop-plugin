// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AirdropClaim
 * @dev Contract for claiming tokens from an airdrop using merkle proofs
 */
contract AirdropClaim is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // The merkle root of the merkle tree containing the airdrop distribution
    bytes32 public merkleRoot;

    // The token being distributed
    IERC20 public token;

    // Mapping of addresses that have claimed their tokens
    mapping(address => bool) public hasClaimed;

    // Events
    event AirdropClaimed(address indexed account, uint256 amount);
    event FundsRecovered(address indexed token, uint256 amount);
    event MerkleRootSet(bytes32 merkleRoot);

    /**
     * @dev Constructor to initialize the contract with the token address and merkle root
     * @param _token The token contract address
     * @param _merkleRoot The merkle root of the airdrop distribution
     */
    constructor(IERC20 _token, bytes32 _merkleRoot) Ownable(msg.sender) {
        token = _token;
        merkleRoot = _merkleRoot;
        emit MerkleRootSet(_merkleRoot);
    }

    /**
     * @dev Claim tokens from the airdrop
     * @param amount The amount of tokens to claim
     * @param merkleProof The merkle proof verifying the claim
     */
    function claim(uint256 amount, bytes32[] calldata merkleProof) external nonReentrant {
        // Ensure address has not already claimed
        require(!hasClaimed[msg.sender], "Airdrop: Already claimed");

        // Verify the merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        require(MerkleProof.verify(merkleProof, merkleRoot, leaf), "Airdrop: Invalid proof");

        // Mark as claimed
        hasClaimed[msg.sender] = true;

        // Transfer the tokens
        token.safeTransfer(msg.sender, amount);

        // Emit claim event
        emit AirdropClaimed(msg.sender, amount);
    }

    /**
     * @dev Recover any ERC20 tokens sent to the contract
     * @param _token The token contract address to recover
     */
    function recoverFunds(IERC20 _token) external onlyOwner {
        uint256 amount = _token.balanceOf(address(this));
        require(amount > 0, "Airdrop: No tokens to recover");
        
        _token.safeTransfer(owner(), amount);
        emit FundsRecovered(address(_token), amount);
    }
} 