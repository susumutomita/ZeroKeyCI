// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ExampleUUPS.sol";

/**
 * @title ExampleUUPSV2
 * @notice Upgraded version of ExampleUUPS for testing upgrades
 * @dev Adds new functionality while maintaining storage compatibility
 */
contract ExampleUUPSV2 is ExampleUUPS {
    event IncrementCalled(uint256 oldValue, uint256 newValue);

    /**
     * @notice Increment the value by 1 (new function in V2)
     */
    function increment() public onlyOwner {
        ExampleUUPSStorage storage $ = _getExampleUUPSStorage();
        uint256 oldValue = $.value;
        $.value += 1;

        emit IncrementCalled(oldValue, $.value);
    }

    /**
     * @notice Get the contract version
     * @return The version string
     */
    function version() public pure override returns (string memory) {
        return "2.0.0";
    }
}
