'use client';

import { useState, useEffect } from 'react';
import { SafeProposalBuilder } from '@/services/SafeProposalBuilder';
import { SafeTransactionData } from '@/types/safe';

interface SandboxConfig {
  contractName: string;
  network: string;
  safeAddress: string;
  bytecode: string;
  constructorArgs: string;
  value: string;
}

export default function SafeProposalSandbox() {
  const [config, setConfig] = useState<SandboxConfig>({
    contractName: 'MyContract',
    network: 'sepolia',
    safeAddress: '0x742D35CC6634c0532925A3b844BC9E7595F0BEb0',
    bytecode:
      '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe',
    constructorArgs: '[]',
    value: '0',
  });

  const [proposal, setProposal] = useState<SafeTransactionData | null>(null);
  const [validationHash, setValidationHash] = useState<string>('');
  const [deploymentAddress, setDeploymentAddress] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'config' | 'proposal' | 'code'>(
    'config'
  );

  // Sample contract code for display
  const sampleContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract MyContract is UUPSUpgradeable {
    uint256 public value;

    function initialize(uint256 _value) public initializer {
        value = _value;
    }

    function setValue(uint256 _value) public {
        value = _value;
    }

    function _authorizeUpgrade(address) internal override {}
}`;

  const generateProposal = async () => {
    try {
      setError('');

      // Parse constructor args
      let args = [];
      try {
        if (config.constructorArgs.trim()) {
          args = JSON.parse(config.constructorArgs);
        }
      } catch {
        throw new Error('Invalid constructor arguments JSON');
      }

      const chainIds: Record<string, number> = {
        sepolia: 11155111,
        mainnet: 1,
        polygon: 137,
        arbitrum: 42161,
        optimism: 10,
        base: 8453,
      };

      const builder = new SafeProposalBuilder({
        safeAddress: config.safeAddress,
        chainId: chainIds[config.network] || 11155111,
        defaultGasSettings: {
          safeTxGas: '5000000',
          gasPrice: '20000000000',
        },
      });

      const newProposal = await builder.createDeploymentProposal({
        contractName: config.contractName,
        bytecode: config.bytecode,
        constructorArgs: args,
        value: config.value,
        metadata: {
          description: `Deploy ${config.contractName} via Sandbox`,
          requestor: 'Sandbox Demo',
          timestamp: Date.now(),
          network: config.network,
        },
      });

      setProposal(newProposal);

      // Generate validation hash
      const hash = builder.generateValidationHash(newProposal);
      setValidationHash(hash);

      // Calculate deployment address
      const salt = '0x' + '0'.repeat(64);
      const address = builder.calculateDeploymentAddress(config.bytecode, salt);
      setDeploymentAddress(address);

      setActiveTab('proposal');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate proposal'
      );
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          Try It Live - Safe Proposal Sandbox
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Generate a Safe transaction proposal without any keys. Edit the
          configuration and see the results instantly.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'config'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          Configuration
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'code'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          Contract Code
        </button>
        <button
          onClick={() => setActiveTab('proposal')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'proposal'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          Generated Proposal
        </button>
      </div>

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="contractName"
                className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
              >
                Contract Name
              </label>
              <input
                id="contractName"
                type="text"
                value={config.contractName}
                onChange={(e) =>
                  setConfig({ ...config, contractName: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="MyContract"
              />
            </div>
            <div>
              <label
                htmlFor="network"
                className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
              >
                Network
              </label>
              <select
                id="network"
                value={config.network}
                onChange={(e) =>
                  setConfig({ ...config, network: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              >
                <option value="sepolia">Sepolia</option>
                <option value="mainnet">Mainnet</option>
                <option value="polygon">Polygon</option>
                <option value="arbitrum">Arbitrum</option>
                <option value="optimism">Optimism</option>
                <option value="base">Base</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="safeAddress"
              className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
            >
              Safe Address
            </label>
            <input
              id="safeAddress"
              type="text"
              value={config.safeAddress}
              onChange={(e) =>
                setConfig({ ...config, safeAddress: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg font-mono text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="0x..."
            />
          </div>

          <div>
            <label
              htmlFor="bytecode"
              className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
            >
              Bytecode (hex)
            </label>
            <textarea
              id="bytecode"
              value={config.bytecode}
              onChange={(e) =>
                setConfig({ ...config, bytecode: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg font-mono text-xs h-24 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="0x608060..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="constructorArgs"
                className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
              >
                Constructor Args (JSON)
              </label>
              <input
                id="constructorArgs"
                type="text"
                value={config.constructorArgs}
                onChange={(e) =>
                  setConfig({ ...config, constructorArgs: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="[]"
              />
            </div>
            <div>
              <label
                htmlFor="value"
                className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
              >
                Value (wei)
              </label>
              <input
                id="value"
                type="text"
                value={config.value}
                onChange={(e) =>
                  setConfig({ ...config, value: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="0"
              />
            </div>
          </div>

          <button
            onClick={generateProposal}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Generate Safe Proposal
          </button>
        </div>
      )}

      {/* Contract Code Tab */}
      {activeTab === 'code' && (
        <div>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-gray-100 text-sm">
              <code>{sampleContract}</code>
            </pre>
          </div>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> This is a sample UUPS upgradeable contract.
              In production, you would compile your actual contract and use the
              resulting bytecode.
            </p>
          </div>
        </div>
      )}

      {/* Generated Proposal Tab */}
      {activeTab === 'proposal' && (
        <div>
          {proposal ? (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                  ✅ Proposal Generated Successfully
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Validation Hash:
                    </span>
                    <code className="ml-2 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {validationHash}
                    </code>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Deployment Address:
                    </span>
                    <code className="ml-2 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {deploymentAddress}
                    </code>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-gray-100 text-xs">
                  <code>{JSON.stringify(proposal, null, 2)}</code>
                </pre>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                    Transaction Type
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {proposal.operation === 0 ? 'CREATE' : 'CALL'}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                    Gas Limit
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {proposal.safeTxGas || 'Default'}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                    Value
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {proposal.value} wei
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                Configure your deployment and click &quot;Generate Safe
                Proposal&quot; to see the result
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-red-700 dark:text-red-300">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}
    </div>
  );
}
