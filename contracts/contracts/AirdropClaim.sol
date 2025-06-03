// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@lukso/lsp7-contracts/contracts/ILSP7DigitalAsset.sol";
import {
  _INTERFACEID_LSP7,
  _INTERFACEID_LSP7_V0_12_0,
  _INTERFACEID_LSP7_V0_14_0
} from "@lukso/lsp7-contracts/contracts/LSP7Constants.sol";

/**
 * @title AirdropClaim
 * @dev Contract for claiming tokens from an airdrop using merkle proofs
 */
contract AirdropClaim is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // The merkle root of the merkle tree containing the airdrop distribution
    bytes32 public merkleRoot;

    // The token being distributed
    address public token;
    bool public isLSP7;
    uint256 public totalClaimed;

    // Mapping of addresses that have claimed their tokens
    mapping(address => bool) public hasClaimed;

    // Events
    event AirdropClaimed(address indexed account, uint256 amount);
    event FundsRecovered(address indexed token, uint256 amount);

    /**
     * @dev Constructor to initialize the contract with the token address and merkle root
     * @param _token The token contract address
     * @param _merkleRoot The merkle root of the airdrop distribution
     */
    constructor(address _token, bytes32 _merkleRoot) Ownable(msg.sender) {
        // Todo: Check if Ownable is compatible with deployment through UP extension

        token = _token;
        merkleRoot = _merkleRoot;

        // Check if token contract supports ERC165
        bool isERC165 = ERC165Checker.supportsERC165(token);

        if (isERC165) {
            // Token supports ERC165, you can now check for other interfaces
            // e.g., IERC20.interfaceId
            isLSP7 =
                ERC165Checker.supportsInterface(token, _INTERFACEID_LSP7) ||
                ERC165Checker.supportsInterface(token, _INTERFACEID_LSP7_V0_12_0) ||
                ERC165Checker.supportsInterface(token, _INTERFACEID_LSP7_V0_14_0);
        } else {
            // Token does not support ERC165, proceed with alternative verification
            // Heuristic check if the token does support ERC20
            uint256 codeSize;
            assembly {
                codeSize := extcodesize(_token)
            }

            if (codeSize > 0) {
                bool hasTotalSupply;
                (hasTotalSupply, ) = token.staticcall(abi.encodeWithSignature("totalSupply()"));

                bool hasBalanceOf;
                (hasBalanceOf, ) = token.staticcall(abi.encodeWithSignature("balanceOf(address)", address(this)));

                if (!hasTotalSupply || !hasBalanceOf) {
                    revert("Not a compliant ERC20 token");
                }
            } else {
                revert("Address is not a contract");
            }
        }
    }

    /**
     * @dev Claim tokens from the airdrop
     * @param amount The amount of tokens to claim
     * @param merkleProof The merkle proof verifying the claim
     */
    function claim(uint256 amount, bytes32[] memory merkleProof, bool forceLSP7Transfer) external nonReentrant {
        // Ensure address has not already claimed
        require(!hasClaimed[msg.sender], "Airdrop: Already claimed");

        // Verify the merkle proof
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, amount))));
        require(MerkleProof.verify(merkleProof, merkleRoot, leaf), "Airdrop: Invalid proof");

        // Mark as claimed
        hasClaimed[msg.sender] = true;
        totalClaimed += amount;

        // Transfer the tokens
        if (isLSP7) {
            ILSP7DigitalAsset(token).transfer(address(this), msg.sender, amount, forceLSP7Transfer, "");
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }

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