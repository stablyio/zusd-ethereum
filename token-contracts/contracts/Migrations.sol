pragma solidity 0.7.5;

// This is used for truffle migrations / testing.

contract Migrations {
    uint256 public last_completed_migration;

    function setCompleted(uint256 completed) public {
        last_completed_migration = completed;
    }

    function upgrade(address new_address) public {
        Migrations upgraded = Migrations(new_address);
        upgraded.setCompleted(last_completed_migration);
    }
}
