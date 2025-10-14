'use client';

import { useState } from 'react';
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
    <div className="glass-strong rounded-3xl p-8 animate-fade-in-up">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">
          Try It Live - Safe Proposal Sandbox
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Generate a Safe transaction proposal without any keys. Edit the
          configuration and see the results instantly.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 flex-wrap">
        <button
          onClick={() => setActiveTab('config')}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
            activeTab === 'config'
              ? 'glass-strong text-gray-900 dark:text-white shadow-lg scale-105'
              : 'glass text-gray-700 dark:text-gray-300 hover:scale-105'
          }`}
        >
          Configuration
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
            activeTab === 'code'
              ? 'glass-strong text-gray-900 dark:text-white shadow-lg scale-105'
              : 'glass text-gray-700 dark:text-gray-300 hover:scale-105'
          }`}
        >
          Contract Code
        </button>
        <button
          onClick={() => setActiveTab('proposal')}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
            activeTab === 'proposal'
              ? 'glass-strong text-gray-900 dark:text-white shadow-lg scale-105'
              : 'glass text-gray-700 dark:text-gray-300 hover:scale-105'
          }`}
        >
          Generated Proposal
        </button>
      </div>

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="contractName"
                className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200"
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
                className="glass-input w-full text-gray-900 dark:text-gray-100"
                placeholder="MyContract"
              />
            </div>
            <div>
              <label
                htmlFor="network"
                className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200"
              >
                Network
              </label>
              <select
                id="network"
                value={config.network}
                onChange={(e) =>
                  setConfig({ ...config, network: e.target.value })
                }
                className="glass-input w-full text-gray-900 dark:text-gray-100"
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
              className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200"
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
              className="glass-input w-full font-mono text-sm text-gray-900 dark:text-gray-100"
              placeholder="0x..."
            />
          </div>

          <div>
            <label
              htmlFor="bytecode"
              className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200"
            >
              Bytecode (hex)
            </label>
            <textarea
              id="bytecode"
              value={config.bytecode}
              onChange={(e) =>
                setConfig({ ...config, bytecode: e.target.value })
              }
              className="glass-input w-full font-mono text-xs h-24 text-gray-900 dark:text-gray-100"
              placeholder="0x608060..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="constructorArgs"
                className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200"
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
                className="glass-input w-full font-mono text-sm text-gray-900 dark:text-gray-100"
                placeholder="[]"
              />
            </div>
            <div>
              <label
                htmlFor="value"
                className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200"
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
                className="glass-input w-full text-gray-900 dark:text-gray-100"
                placeholder="0"
              />
            </div>
          </div>

          <button
            onClick={generateProposal}
            className="glass-button w-full glow-on-hover bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-500 hover:to-purple-500 text-lg py-4"
          >
            Generate Safe Proposal
          </button>
        </div>
      )}

      {/* Contract Code Tab */}
      {activeTab === 'code' && (
        <div className="animate-fade-in">
          <div className="glass-strong rounded-2xl p-6 overflow-x-auto">
            <pre className="text-gray-100 text-sm">
              <code>{sampleContract}</code>
            </pre>
          </div>
          <div className="mt-6 glass rounded-2xl p-6">
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
        <div className="animate-fade-in">
          {proposal ? (
            <div className="space-y-6">
              <div className="glass-strong rounded-2xl p-6 border-2 border-green-500/30">
                <h3 className="font-bold text-green-700 dark:text-green-300 mb-4 text-xl flex items-center gap-2">
                  <span className="text-2xl">✅</span>
                  Proposal Generated Successfully
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="glass rounded-xl p-4">
                    <span className="text-gray-600 dark:text-gray-400 font-semibold block mb-2">
                      Validation Hash:
                    </span>
                    <code className="text-xs glass-medium px-3 py-2 rounded block overflow-x-auto text-gray-900 dark:text-gray-100">
                      {validationHash}
                    </code>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <span className="text-gray-600 dark:text-gray-400 font-semibold block mb-2">
                      Deployment Address:
                    </span>
                    <code className="text-xs glass-medium px-3 py-2 rounded block overflow-x-auto text-gray-900 dark:text-gray-100">
                      {deploymentAddress}
                    </code>
                  </div>
                </div>
              </div>

              <div className="glass-strong rounded-2xl p-6 overflow-x-auto">
                <pre className="text-gray-100 text-xs">
                  <code>{JSON.stringify(proposal, null, 2)}</code>
                </pre>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="glass-card p-6">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white text-lg">
                    Transaction Type
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 font-mono">
                    {proposal.operation === 0 ? 'CREATE' : 'CALL'}
                  </p>
                </div>
                <div className="glass-card p-6">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white text-lg">
                    Gas Limit
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 font-mono">
                    {proposal.safeTxGas || 'Default'}
                  </p>
                </div>
                <div className="glass-card p-6">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white text-lg">
                    Value
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 font-mono">
                    {proposal.value} wei
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 glass rounded-3xl">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Configure your deployment and click &quot;Generate Safe
                Proposal&quot; to see the result
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-6 glass-strong rounded-2xl p-6 border-2 border-red-500/30 animate-fade-in">
          <p className="text-red-700 dark:text-red-300">
            <strong className="text-lg">⚠ Error:</strong>
            <span className="ml-2">{error}</span>
          </p>
        </div>
      )}
    </div>
  );
}
