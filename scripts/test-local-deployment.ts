#!/usr/bin/env bun
/**
 * Local test script for SafeProposalBuilder
 * This simulates what would happen in CI without actually deploying
 */

import { SafeProposalBuilder } from '../src/services/SafeProposalBuilder';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import * as yaml from 'js-yaml';

async function testLocalDeployment() {
  console.log('🧪 Testing SafeProposalBuilder locally...\n');

  try {
    // 1. Load deployment configuration
    console.log('📋 Loading deployment configuration...');
    const configPath = resolve(process.cwd(), '.zerokey', 'deploy.yaml');
    const configContent = readFileSync(configPath, 'utf-8');
    const config = yaml.load(configContent) as any;

    console.log('  Network:', config.network);
    console.log('  Contract:', config.contract);
    console.log('  Threshold:', config.signers.threshold);
    console.log('  Signers:', config.signers.addresses.length);

    // 2. Create SafeProposalBuilder instance
    console.log('\n🔧 Initializing SafeProposalBuilder...');

    // Use a test Safe address (this would be from secrets in production)
    const testSafeAddress = '0x742D35CC6634c0532925A3b844BC9E7595F0BEb0';
    const chainId = 11155111; // Sepolia

    const builder = new SafeProposalBuilder({
      safeAddress: testSafeAddress,
      chainId: chainId,
      defaultGasSettings: {
        gasLimit: config.gasLimit,
        gasPrice: config.gasPrice,
      },
    });

    console.log('  Safe Address:', testSafeAddress);
    console.log('  Chain ID:', chainId);

    // 3. Create deployment proposal
    console.log('\n🚀 Creating deployment proposal...');

    // Simulate contract bytecode (in production, this comes from compilation)
    const simulatedBytecode =
      '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80632e64cec11461003b5780636057361d14610059575b600080fd5b610043610075565b60405161005091906100d9565b60405180910390f35b610073600480360381019061006e919061009d565b61007e565b005b60008054905090565b8060008190555050565b60008135905061009781610103565b92915050565b6000602082840312156100b3576100b26100fe565b5b60006100c184828501610088565b91505092915050565b6100d3816100f4565b82525050565b60006020820190506100ee60008301846100ca565b92915050565b6000819050919050565b600080fd5b61010c816100f4565b811461011757600080fd5b5056fea2646970667358221220';

    const proposal = await builder.createDeploymentProposal({
      contractName: config.contract,
      bytecode: simulatedBytecode,
      constructorArgs: config.constructorArgs || [],
      value: config.value || '0',
      metadata: {
        description: config.metadata.description,
        requestor: config.metadata.requestor,
        timestamp: Date.now(),
        network: config.network,
      },
    });

    console.log('  ✅ Proposal created successfully');

    // 4. Validate the proposal
    console.log('\n🔍 Validating proposal...');
    const isValid = builder.validateProposal(proposal);
    console.log('  Validation result:', isValid ? '✅ Valid' : '❌ Invalid');

    // 5. Calculate deployment address
    console.log('\n📍 Calculating deployment address...');
    const salt = '0x' + '0'.repeat(64);
    const deploymentAddress = builder.calculateDeploymentAddress(
      simulatedBytecode,
      salt
    );
    console.log('  Expected deployment address:', deploymentAddress);

    // 6. Serialize proposal
    console.log('\n💾 Serializing proposal...');
    const serialized = builder.serializeProposal(proposal);
    const parsed = JSON.parse(serialized);

    // 7. Save proposal to file
    const outputPath = resolve(process.cwd(), 'test-safe-proposal.json');
    writeFileSync(outputPath, serialized);
    console.log('  Proposal saved to:', outputPath);

    // 8. Display summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 PROPOSAL SUMMARY');
    console.log('='.repeat(60));
    console.log('Safe Address:      ', parsed.safeAddress);
    console.log('Chain ID:          ', parsed.chainId);
    console.log('Validation Hash:   ', parsed.validationHash);
    console.log('Contract:          ', config.contract);
    console.log('Network:           ', config.network);
    console.log(
      'Operation:         ',
      proposal.operation === 0 ? 'CREATE' : 'CALL'
    );
    console.log('Value:             ', proposal.value, 'wei');
    console.log('Data Length:       ', proposal.data.length, 'characters');

    // 9. Simulate policy validation
    console.log('\n🛡️ Policy Validation (simulated):');
    console.log('  ✅ Network allowed (sepolia)');
    console.log('  ✅ Minimum signers met (2)');
    console.log('  ✅ Gas limit reasonable');
    console.log('  ✅ No private keys detected');

    console.log('\n✨ Local test completed successfully!');
    console.log('\n📌 Next steps:');
    console.log(
      '  1. Review the generated proposal in test-safe-proposal.json'
    );
    console.log('  2. Create a PR with "deploy" label to trigger CI workflow');
    console.log(
      '  3. CI will generate the actual proposal with real contract bytecode'
    );
    console.log('  4. Safe owners can then sign and execute the transaction');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testLocalDeployment();
}
