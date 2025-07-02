// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
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
    mapping(address => mapping(uint256 => bool)) public hasClaimed;

    // Events
    event AirdropClaimed(address indexed account, uint256 amount);
    event FundsRecovered(address indexed token, uint256 amount);

    /**
     * @dev Constructor to initialize the contract with the token address and merkle root
     * @param _token The token contract address
     * @param _merkleRoot The merkle root of the airdrop distribution
     */
    constructor(address _token, bytes32 _merkleRoot) Ownable() {
        // Todo: Check if Ownable is compatible with deployment through UP extension

        token = _token;
        merkleRoot = _merkleRoot;

        // Check if token contract supports ERC165
        if (ERC165Checker.supportsERC165(token)) {
            // Todo: Check if all LSP7 versions have the same transfer function signature
            isLSP7 =
                ERC165Checker.supportsInterface(token, _INTERFACEID_LSP7) ||
                ERC165Checker.supportsInterface(token, _INTERFACEID_LSP7_V0_12_0) ||
                ERC165Checker.supportsInterface(token, _INTERFACEID_LSP7_V0_14_0);
        }
        if (!isLSP7) {
            // Token does not support ERC165, proceed with simple heuristic ERC20 check
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
                    revert("Neither ERC20 nor LSP7 token");
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
        require(!hasClaimed[msg.sender][amount], "Airdrop: Already claimed");

        // Verify the merkle proof
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, amount))));
        require(MerkleProof.verify(merkleProof, merkleRoot, leaf), "Airdrop: Invalid proof");

        // Mark as claimed
        hasClaimed[msg.sender][amount] = true;
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
     * @dev Recover any ERC20 or LSP7 tokens sent to the contract
     * @param recoverToken The token contract address to recover
     */
    function recoverFunds(address recoverToken) external onlyOwner nonReentrant {
        // balanceOf works for both ERC20 and LSP7 tokens
        uint256 amount = IERC20(recoverToken).balanceOf(address(this));
        require(amount > 0, "Airdrop: No tokens to recover");

        bool recoverLSP7 = false;
        if (ERC165Checker.supportsERC165(recoverToken)) {
            recoverLSP7 =
                ERC165Checker.supportsInterface(recoverToken, _INTERFACEID_LSP7) ||
                ERC165Checker.supportsInterface(recoverToken, _INTERFACEID_LSP7_V0_12_0) ||
                ERC165Checker.supportsInterface(recoverToken, _INTERFACEID_LSP7_V0_14_0);
        }
        
        // Transfer the tokens
        if (recoverLSP7) {
            ILSP7DigitalAsset(recoverToken).transfer(address(this), owner(), amount, true, "");
        } else {
            IERC20(recoverToken).safeTransfer(owner(), amount);
        }
        emit FundsRecovered(address(recoverToken), amount);
    }
} 