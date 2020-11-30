pragma solidity ^0.5.11;

import "../../contracts/ZUSDImplementation.sol";

contract ZUSDWithBalance is ZUSDImplementation {
    function initializeBalance(address initialAccount, uint256 initialBalance)
        public
    {
        _balances[initialAccount] = initialBalance;
        _totalSupply = initialBalance;
    }

    function topupBalance(address to, uint256 desiredBalance) public {
        if (desiredBalance < _balances[to]) {
            return;
        }

        uint256 toAdd = desiredBalance.sub(_balances[to]);
        _balances[to] = desiredBalance;
        _totalSupply = _totalSupply.add(toAdd);
    }
}
