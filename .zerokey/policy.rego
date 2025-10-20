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
  valid_proxy_config
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
  not has_key(input, "privateKey")
  not has_key(input, "mnemonic")
  not has_key(input, "secret")
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
has_key(obj, key) {
  obj[key]
}

# ============================================================================
# Proxy Deployment Validation Rules
# ============================================================================

# Proxy configuration is valid if:
# - No proxy config provided (regular deployment)
# - OR valid UUPS proxy deployment
# - OR valid Transparent proxy deployment
# - OR valid proxy upgrade
valid_proxy_config {
  not input.proxy
}

valid_proxy_config {
  input.proxy
  valid_proxy_type
  valid_proxy_deployment_or_upgrade
  safe_proxy_constructors
}

# Valid proxy types: "uups" or "transparent"
valid_proxy_type {
  input.proxy.type == "uups"
}

valid_proxy_type {
  input.proxy.type == "transparent"
}

# Proxy deployment or upgrade must be valid
valid_proxy_deployment_or_upgrade {
  # New proxy deployment (no proxyAddress)
  not input.proxy.proxyAddress
  valid_proxy_initialization
}

valid_proxy_deployment_or_upgrade {
  # Proxy upgrade (has proxyAddress)
  input.proxy.proxyAddress
  valid_proxy_upgrade
}

# Proxy initialization validation for new deployments
valid_proxy_initialization {
  # initializeArgs must be provided for new proxy deployments
  input.proxy.initializeArgs
  is_array(input.proxy.initializeArgs)
}

# Proxy upgrade validation
valid_proxy_upgrade {
  # Must have valid Ethereum address
  valid_ethereum_address(input.proxy.proxyAddress)

  # initializeArgs is optional for upgrades (upgradeToAndCall vs upgradeTo)
}

# Transparent proxy admin validation
valid_transparent_admin {
  input.proxy.type != "transparent"
}

valid_transparent_admin {
  input.proxy.type == "transparent"
  # If admin is provided, it must be a valid address
  not input.proxy.admin
}

valid_transparent_admin {
  input.proxy.type == "transparent"
  input.proxy.admin
  valid_ethereum_address(input.proxy.admin)
}

# Constructor args should be empty for upgradeable contracts
safe_proxy_constructors {
  not input.proxy
}

safe_proxy_constructors {
  input.proxy
  # constructorArgs should be empty or not provided for upgradeable contracts
  not input.constructorArgs
}

safe_proxy_constructors {
  input.proxy
  input.constructorArgs
  count(input.constructorArgs) == 0
}

# Helper: Validate Ethereum address format (0x + 40 hex chars)
valid_ethereum_address(addr) {
  startswith(addr, "0x")
  count(addr) == 42
  # Simple hex validation - all chars after 0x should be hex
  hex_chars := substring(addr, 2, -1)
  regex.match("^[0-9a-fA-F]+$", hex_chars)
}

# Deny rules for proxy deployments
deny[msg] {
  input.proxy
  not valid_proxy_type
  msg := sprintf("Invalid proxy type '%v'. Must be 'uups' or 'transparent'", [input.proxy.type])
}

deny[msg] {
  input.proxy
  input.proxy.type == "transparent"
  input.proxy.admin
  not valid_ethereum_address(input.proxy.admin)
  msg := sprintf("Invalid admin address '%v'. Must be a valid Ethereum address (0x + 40 hex chars)", [input.proxy.admin])
}

deny[msg] {
  input.proxy
  input.proxy.proxyAddress
  not valid_ethereum_address(input.proxy.proxyAddress)
  msg := sprintf("Invalid proxy address '%v'. Must be a valid Ethereum address (0x + 40 hex chars)", [input.proxy.proxyAddress])
}

deny[msg] {
  input.proxy
  not input.proxy.proxyAddress  # New deployment
  not input.proxy.initializeArgs
  msg := "Proxy deployments must provide initializeArgs for the initialize() function"
}

deny[msg] {
  input.proxy
  not input.proxy.proxyAddress  # New deployment
  input.proxy.initializeArgs
  not is_array(input.proxy.initializeArgs)
  msg := "initializeArgs must be an array"
}

warn[msg] {
  input.proxy
  input.constructorArgs
  count(input.constructorArgs) > 0
  msg := "Warning: Upgradeable contracts should not use constructor arguments. Use initialize() function instead. Constructor args will be ignored."
}
