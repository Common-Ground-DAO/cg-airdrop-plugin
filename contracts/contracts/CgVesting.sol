// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (finance/VestingWallet.sol)
pragma solidity ^0.8.20;

import {VestingWallet} from "@openzeppelin/contracts/finance/VestingWallet.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC165Checker} from "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import {ILSP7DigitalAsset} from "@lukso/lsp7-contracts/contracts/ILSP7DigitalAsset.sol";
import {
  _INTERFACEID_LSP7,
  _INTERFACEID_LSP7_V0_12_0,
  _INTERFACEID_LSP7_V0_14_0
} from "@lukso/lsp7-contracts/contracts/LSP7Constants.sol";

/**
 * @dev A vesting wallet is an ownable contract that can receive native currency and ERC-20 tokens, and release these
 * assets to the wallet owner, also referred to as "beneficiary", according to a vesting schedule.
 *
 * Any assets transferred to this contract will follow the vesting schedule as if they were locked from the beginning.
 * Consequently, if the vesting has already started, any amount of tokens sent to this contract will (at least partly)
 * be immediately releasable.
 *
 * By setting the duration to 0, one can configure this contract to behave like an asset timelock that holds tokens for
 * a beneficiary until a specified time.
 *
 * NOTE: Since the wallet is {Ownable}, and ownership can be transferred, it is possible to sell unvested tokens.
 * Preventing this in a smart contract is difficult, considering that: 1) a beneficiary address could be a
 * counterfactually deployed contract, 2) there is likely to be a migration path for EOAs to become contracts in the
 * near future.
 *
 * NOTE: When using this contract with any token whose balance is adjusted automatically (i.e. a rebase token), make
 * sure to account the supply/balance adjustment in the vesting schedule to ensure the vested amount is as intended.
 *
 * NOTE: Chains with support for native ERC20s may allow the vesting wallet to withdraw the underlying asset as both an
 * ERC20 and as native currency. For example, if chain C supports token A and the wallet gets deposited 100 A, then
 * at 50% of the vesting period, the beneficiary can withdraw 50 A as ERC20 and 25 A as native currency (totaling 75 A).
 * Consider disabling one of the withdrawal methods.
 */
contract CgVesting is VestingWallet {
  event TokensReleased(address indexed token, uint256 amount);
  mapping(address token => uint256) private _tokensReleased;
  uint256 public constant VERSION = 1;

  /**
    * @dev Sets the beneficiary (owner), the start timestamp and the vesting duration (in seconds) of the vesting
    * wallet.
    */
  constructor(address beneficiary, uint64 startTimestamp, uint64 durationSeconds) payable VestingWallet(beneficiary, startTimestamp, durationSeconds) {}

  /**
    * @dev Amount of token already released
    */
  function released(address token) public view override returns (uint256) {
    return _tokensReleased[token];
  }

  /**
    * @dev Release the tokens that have already vested.
    *
    * Emits a {ERC20Released} event.
    */
  function release(address token) public override {
    uint256 amount = releasable(token);
    _tokensReleased[token] += amount;
    emit TokensReleased(token, amount);
    bool isLsp7 = false;
    bool isErc165 = ERC165Checker.supportsERC165(token);
    if (isErc165) {
      isLsp7 = 
        ERC165Checker.supportsInterface(token, _INTERFACEID_LSP7) ||
        ERC165Checker.supportsInterface(token, _INTERFACEID_LSP7_V0_12_0) ||
        ERC165Checker.supportsInterface(token, _INTERFACEID_LSP7_V0_14_0);
    }
    if (isLsp7) {
      ILSP7DigitalAsset(token).transfer(address(this), beneficiary(), amount, true, "");
    } else {
      SafeERC20.safeTransfer(IERC20(token), beneficiary(), amount);
    }
  }
}
