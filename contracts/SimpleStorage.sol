// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SimpleStorage
 * @notice Simple storage contract for testing ZeroKey CI deployment
 * @dev Non-upgradeable contract for basic deployment testing
 */
contract SimpleStorage {
    uint256 private value;
    address public owner;

    event ValueUpdated(uint256 oldValue, uint256 newValue, address updatedBy);

    constructor(uint256 initialValue) {
        value = initialValue;
        owner = msg.sender;
    }

    function getValue() public view returns (uint256) {
        return value;
    }

    function setValue(uint256 newValue) public {
        require(msg.sender == owner, "Only owner can set value");
        uint256 oldValue = value;
        value = newValue;
        emit ValueUpdated(oldValue, newValue, msg.sender);
    }
}
