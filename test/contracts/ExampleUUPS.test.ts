import { describe, it, expect, beforeEach } from 'vitest';
import hre from 'hardhat';
import { getAddress } from 'viem';

describe('ExampleUUPS', () => {
  let exampleUUPS: any;
  let owner: any;
  let addr1: any;
  let ownerAddress: string;
  let addr1Address: string;

  beforeEach(async () => {
    // Get signers
    [owner, addr1] = await hre.viem.getWalletClients();
    ownerAddress = getAddress(owner.account.address);
    addr1Address = getAddress(addr1.account.address);

    // Deploy ExampleUUPS as upgradeable proxy
    const ExampleUUPS = await hre.viem.deployContract('ExampleUUPS');
    await ExampleUUPS.write.initialize([ownerAddress]);

    exampleUUPS = ExampleUUPS;
  });

  describe('Initialization', () => {
    it('should initialize with correct owner', async () => {
      const contractOwner = await exampleUUPS.read.owner();
      expect(contractOwner.toLowerCase()).toBe(ownerAddress.toLowerCase());
    });

    it('should initialize with default value of 0', async () => {
      const value = await exampleUUPS.read.getValue();
      expect(value).toBe(0n);
    });

    it('should initialize with default message', async () => {
      const message = await exampleUUPS.read.getMessage();
      expect(message).toBe('Hello, ZeroKey CI!');
    });

    it('should return version 1.0.0', async () => {
      const version = await exampleUUPS.read.version();
      expect(version).toBe('1.0.0');
    });
  });

  describe('setValue', () => {
    it('should allow owner to set value', async () => {
      await exampleUUPS.write.setValue([100n]);
      const value = await exampleUUPS.read.getValue();
      expect(value).toBe(100n);
    });

    it('should emit ValueUpdated event', async () => {
      const hash = await exampleUUPS.write.setValue([200n]);
      const publicClient = await hre.viem.getPublicClient();
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      expect(receipt.logs.length).toBeGreaterThan(0);
    });

    it('should revert if value exceeds 1000000', async () => {
      await expect(exampleUUPS.write.setValue([1000001n])).rejects.toThrow();
    });

    it('should revert if non-owner tries to set value', async () => {
      const [, addr1Client] = await hre.viem.getWalletClients();
      const addr1Contract = await hre.viem.getContractAt(
        'ExampleUUPS',
        exampleUUPS.address,
        { client: { wallet: addr1Client } }
      );

      await expect(addr1Contract.write.setValue([100n])).rejects.toThrow();
    });
  });

  describe('setMessage', () => {
    it('should allow owner to set message', async () => {
      const newMessage = 'New message';
      await exampleUUPS.write.setMessage([newMessage]);
      const message = await exampleUUPS.read.getMessage();
      expect(message).toBe(newMessage);
    });

    it('should emit MessageUpdated event', async () => {
      const hash = await exampleUUPS.write.setMessage(['Test message']);
      const publicClient = await hre.viem.getPublicClient();
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      expect(receipt.logs.length).toBeGreaterThan(0);
    });

    it('should revert if message is empty', async () => {
      await expect(exampleUUPS.write.setMessage([''])).rejects.toThrow();
    });

    it('should revert if non-owner tries to set message', async () => {
      const [, addr1Client] = await hre.viem.getWalletClients();
      const addr1Contract = await hre.viem.getContractAt(
        'ExampleUUPS',
        exampleUUPS.address,
        { client: { wallet: addr1Client } }
      );

      await expect(
        addr1Contract.write.setMessage(['Unauthorized'])
      ).rejects.toThrow();
    });
  });

  describe('Upgradeability', () => {
    it('should allow owner to upgrade to V2', async () => {
      // Deploy V2 implementation
      const ExampleUUPSV2 = await hre.viem.deployContract('ExampleUUPSV2');

      // Upgrade to V2
      await exampleUUPS.write.upgradeToAndCall([ExampleUUPSV2.address, '0x']);

      // Get V2 contract at proxy address
      const upgradedContract = await hre.viem.getContractAt(
        'ExampleUUPSV2',
        exampleUUPS.address
      );

      // Verify version is 2.0.0
      const version = await upgradedContract.read.version();
      expect(version).toBe('2.0.0');

      // Verify storage is preserved
      const value = await upgradedContract.read.getValue();
      expect(value).toBe(0n);

      const message = await upgradedContract.read.getMessage();
      expect(message).toBe('Hello, ZeroKey CI!');
    });

    it('should allow using new increment function after upgrade', async () => {
      // Set initial value
      await exampleUUPS.write.setValue([10n]);

      // Deploy and upgrade to V2
      const ExampleUUPSV2 = await hre.viem.deployContract('ExampleUUPSV2');
      await exampleUUPS.write.upgradeToAndCall([ExampleUUPSV2.address, '0x']);

      const upgradedContract = await hre.viem.getContractAt(
        'ExampleUUPSV2',
        exampleUUPS.address
      );

      // Use new increment function
      await upgradedContract.write.increment();
      const value = await upgradedContract.read.getValue();
      expect(value).toBe(11n);
    });

    it('should revert if non-owner tries to upgrade', async () => {
      const ExampleUUPSV2 = await hre.viem.deployContract('ExampleUUPSV2');

      const [, addr1Client] = await hre.viem.getWalletClients();
      const addr1Contract = await hre.viem.getContractAt(
        'ExampleUUPS',
        exampleUUPS.address,
        { client: { wallet: addr1Client } }
      );

      await expect(
        addr1Contract.write.upgradeToAndCall([ExampleUUPSV2.address, '0x'])
      ).rejects.toThrow();
    });
  });
});
