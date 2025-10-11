// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title ExampleUUPS
 * @notice Example UUPS upgradeable contract for ZeroKey CI
 * @dev Demonstrates key-less deployment through Safe proposals
 */
contract ExampleUUPS is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    /// @custom:storage-location erc7201:example.storage.ExampleUUPS
    struct ExampleUUPSStorage {
        uint256 value;
        string message;
    }

    // keccak256(abi.encode(uint256(keccak256("example.storage.ExampleUUPS")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant EXAMPLE_UUPS_STORAGE_LOCATION =
        0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd00;

    event ValueUpdated(uint256 oldValue, uint256 newValue, address updatedBy);
    event MessageUpdated(string oldMessage, string newMessage, address updatedBy);

    error InvalidValue(uint256 value);
    error InvalidMessage();

    function _getExampleUUPSStorage() internal pure returns (ExampleUUPSStorage storage $) {
        assembly {
            $.slot := EXAMPLE_UUPS_STORAGE_LOCATION
        }
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract
     * @param initialOwner The initial owner address
     */
    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();

        ExampleUUPSStorage storage $ = _getExampleUUPSStorage();
        $.value = 0;
        $.message = "Hello, ZeroKey CI!";
    }

    /**
     * @notice Get the current value
     * @return The current value
     */
    function getValue() public view returns (uint256) {
        ExampleUUPSStorage storage $ = _getExampleUUPSStorage();
        return $.value;
    }

    /**
     * @notice Get the current message
     * @return The current message
     */
    function getMessage() public view returns (string memory) {
        ExampleUUPSStorage storage $ = _getExampleUUPSStorage();
        return $.message;
    }

    /**
     * @notice Update the value (owner only)
     * @param newValue The new value to set
     */
    function setValue(uint256 newValue) public onlyOwner {
        if (newValue > 1000000) {
            revert InvalidValue(newValue);
        }

        ExampleUUPSStorage storage $ = _getExampleUUPSStorage();
        uint256 oldValue = $.value;
        $.value = newValue;

        emit ValueUpdated(oldValue, newValue, msg.sender);
    }

    /**
     * @notice Update the message (owner only)
     * @param newMessage The new message to set
     */
    function setMessage(string memory newMessage) public onlyOwner {
        if (bytes(newMessage).length == 0) {
            revert InvalidMessage();
        }

        ExampleUUPSStorage storage $ = _getExampleUUPSStorage();
        string memory oldMessage = $.message;
        $.message = newMessage;

        emit MessageUpdated(oldMessage, newMessage, msg.sender);
    }

    /**
     * @notice Authorization function for UUPS upgrades
     * @dev Only owner can authorize upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @notice Get the contract version
     * @return The version string
     */
    function version() public pure virtual returns (string memory) {
        return "1.0.0";
    }
}
