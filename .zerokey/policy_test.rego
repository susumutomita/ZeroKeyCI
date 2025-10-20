package deployment_test

import data.deployment
import future.keywords

# Test data
valid_base_deployment := {
	"network": "sepolia",
	"contract": "ExampleUUPS",
	"signers": {"threshold": 2},
	"gasLimit": 5000000,
	"constructorArgs": [],
	"value": "0",
	"validations": {
		"requireAudit": false,
		"minCoverage": 0,
	},
	"testCoverage": 100,
}

# ==============================================================================
# Regular Deployment Tests (No Proxy)
# ==============================================================================

test_allow_regular_deployment if {
	deployment.allow with input as valid_base_deployment
}

test_deny_invalid_network if {
	invalid_input := object.union(valid_base_deployment, {"network": "invalid"})
	not deployment.allow with input as invalid_input
}

# ==============================================================================
# UUPS Proxy Deployment Tests
# ==============================================================================

test_allow_uups_proxy_deployment if {
	uups_deployment := object.union(valid_base_deployment, {
		"proxy": {
			"type": "uups",
			"initializeArgs": ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"],
		},
		"constructorArgs": [],
	})
	deployment.allow with input as uups_deployment
}

test_deny_uups_without_initialize_args if {
	invalid_uups := object.union(valid_base_deployment, {
		"proxy": {
			"type": "uups",
		},
		"constructorArgs": [],
	})
	not deployment.allow with input as invalid_uups
	count(deployment.deny) > 0 with input as invalid_uups
}

test_deny_uups_with_non_array_initialize_args if {
	invalid_uups := object.union(valid_base_deployment, {
		"proxy": {
			"type": "uups",
			"initializeArgs": "not-an-array",
		},
		"constructorArgs": [],
	})
	not deployment.allow with input as invalid_uups
}

test_allow_uups_with_empty_initialize_args if {
	uups_deployment := object.union(valid_base_deployment, {
		"proxy": {
			"type": "uups",
			"initializeArgs": [],
		},
		"constructorArgs": [],
	})
	deployment.allow with input as uups_deployment
}

# ==============================================================================
# Transparent Proxy Deployment Tests
# ==============================================================================

test_allow_transparent_proxy_deployment if {
	transparent_deployment := object.union(valid_base_deployment, {
		"proxy": {
			"type": "transparent",
			"initializeArgs": ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"],
		},
		"constructorArgs": [],
	})
	deployment.allow with input as transparent_deployment
}

test_allow_transparent_with_valid_admin if {
	transparent_with_admin := object.union(valid_base_deployment, {
		"proxy": {
			"type": "transparent",
			"admin": "0x1234567890123456789012345678901234567890",
			"initializeArgs": ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"],
		},
		"constructorArgs": [],
	})
	deployment.allow with input as transparent_with_admin
}

test_deny_transparent_with_invalid_admin if {
	invalid_transparent := object.union(valid_base_deployment, {
		"proxy": {
			"type": "transparent",
			"admin": "invalid-address",
			"initializeArgs": ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"],
		},
		"constructorArgs": [],
	})
	not deployment.allow with input as invalid_transparent
	count(deployment.deny) > 0 with input as invalid_transparent
}

# ==============================================================================
# UUPS Proxy Upgrade Tests
# ==============================================================================

test_allow_uups_upgrade if {
	uups_upgrade := object.union(valid_base_deployment, {
		"proxy": {
			"type": "uups",
			"proxyAddress": "0x1234567890123456789012345678901234567890",
		},
		"constructorArgs": [],
	})
	deployment.allow with input as uups_upgrade
}

test_allow_uups_upgrade_with_initialize_args if {
	uups_upgrade_with_init := object.union(valid_base_deployment, {
		"proxy": {
			"type": "uups",
			"proxyAddress": "0x1234567890123456789012345678901234567890",
			"initializeArgs": ["arg1", "arg2"],
		},
		"constructorArgs": [],
	})
	deployment.allow with input as uups_upgrade_with_init
}

test_deny_upgrade_with_invalid_proxy_address if {
	invalid_upgrade := object.union(valid_base_deployment, {
		"proxy": {
			"type": "uups",
			"proxyAddress": "invalid-address",
		},
		"constructorArgs": [],
	})
	not deployment.allow with input as invalid_upgrade
	count(deployment.deny) > 0 with input as invalid_upgrade
}

test_deny_upgrade_with_short_address if {
	invalid_upgrade := object.union(valid_base_deployment, {
		"proxy": {
			"type": "uups",
			"proxyAddress": "0x123",
		},
		"constructorArgs": [],
	})
	not deployment.allow with input as invalid_upgrade
}

# ==============================================================================
# Invalid Proxy Type Tests
# ==============================================================================

test_deny_invalid_proxy_type if {
	invalid_type := object.union(valid_base_deployment, {
		"proxy": {
			"type": "invalid",
			"initializeArgs": [],
		},
		"constructorArgs": [],
	})
	not deployment.allow with input as invalid_type
	count(deployment.deny) > 0 with input as invalid_type
}

# ==============================================================================
# Constructor Args Warning Tests
# ==============================================================================

test_warn_constructor_args_with_proxy if {
	proxy_with_constructor := object.union(valid_base_deployment, {
		"proxy": {
			"type": "uups",
			"initializeArgs": ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"],
		},
		"constructorArgs": ["arg1", "arg2"],
	})
	count(deployment.warn) > 0 with input as proxy_with_constructor
}

test_no_warn_empty_constructor_args_with_proxy if {
	proxy_no_constructor := object.union(valid_base_deployment, {
		"proxy": {
			"type": "uups",
			"initializeArgs": ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"],
		},
		"constructorArgs": [],
	})
	count(deployment.warn) == 0 with input as proxy_no_constructor
}

# ==============================================================================
# Ethereum Address Validation Tests
# ==============================================================================

test_valid_ethereum_address if {
	deployment.valid_ethereum_address("0x1234567890123456789012345678901234567890")
}

test_invalid_ethereum_address_no_prefix if {
	not deployment.valid_ethereum_address("1234567890123456789012345678901234567890")
}

test_invalid_ethereum_address_wrong_length if {
	not deployment.valid_ethereum_address("0x123456")
}

test_invalid_ethereum_address_non_hex if {
	not deployment.valid_ethereum_address("0xGGGG567890123456789012345678901234567890")
}

# ==============================================================================
# Edge Cases
# ==============================================================================

test_allow_deployment_without_proxy_field if {
	no_proxy := {
		"network": "sepolia",
		"contract": "SimpleContract",
		"signers": {"threshold": 2},
		"gasLimit": 5000000,
		"constructorArgs": ["arg1"],
		"value": "0",
		"validations": {
			"requireAudit": false,
			"minCoverage": 0,
		},
		"testCoverage": 100,
	}
	deployment.allow with input as no_proxy
}

test_checksummed_addresses_valid if {
	deployment.valid_ethereum_address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
}

test_lowercase_addresses_valid if {
	deployment.valid_ethereum_address("0x742d35cc6634c0532925a3b844bc9e7595f0beb")
}
