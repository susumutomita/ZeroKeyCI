package deployment

# OPA Policy for Smart Contract Deployment
# Enforces security and compliance rules for deployments

# Minimum number of signers required
min_signers := 2

# Allowed networks for deployment
allowed_networks := ["sepolia", "mainnet", "polygon", "arbitrum", "optimism", "base"]

# Maximum gas limit to prevent excessive costs
max_gas_limit := 10000000

# Deployment rules
default allow = false

# Allow deployment if all conditions are met
allow {
  valid_network
  valid_signers
  valid_gas_limit
  no_private_keys
  valid_contract
}

# Check network is allowed
valid_network {
  input.network
  input.network == allowed_networks[_]
}

# Check minimum signers threshold
valid_signers {
  input.signers.threshold >= min_signers
}

# Check gas limit is reasonable
valid_gas_limit {
  input.gasLimit <= max_gas_limit
}

# Ensure no private keys in configuration
no_private_keys {
  not contains(input, "privateKey")
  not contains(input, "mnemonic")
  not contains(input, "secret")
}

# Check contract is valid UUPS upgradeable
valid_contract {
  input.contract != ""
  # In production, would verify contract bytecode
}

# Deny if deploying to mainnet without audit
deny[msg] {
  input.network == "mainnet"
  not input.validations.requireAudit
  msg := "Mainnet deployment requires security audit"
}

# Deny if test coverage is below threshold
deny[msg] {
  input.validations.minCoverage > 0
  input.testCoverage < input.validations.minCoverage
  msg := sprintf("Test coverage %v%% is below required %v%%", [input.testCoverage, input.validations.minCoverage])
}

# Helper function to check if object contains a key
contains(obj, key) {
  obj[key]
}