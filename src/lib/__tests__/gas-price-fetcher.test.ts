import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GasPriceFetcher, type GasPrice } from '../gas-price-fetcher';
import type { SupportedNetwork } from '../network-config';

describe('GasPriceFetcher', () => {
  let fetcher: GasPriceFetcher;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    fetcher = new GasPriceFetcher();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('fetchGasPrice', () => {
    it('should fetch gas price for mainnet', async () => {
      const mockResponse = {
        result: {
          SafeGasPrice: '30',
          ProposeGasPrice: '35',
          FastGasPrice: '40',
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const gasPrice = await fetcher.fetchGasPrice('mainnet');

      expect(gasPrice).toEqual({
        network: 'mainnet',
        slow: 30,
        standard: 35,
        fast: 40,
        timestamp: expect.any(Number),
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.etherscan.io')
      );
    });

    it('should fetch gas price for sepolia', async () => {
      const mockResponse = {
        result: {
          SafeGasPrice: '1',
          ProposeGasPrice: '2',
          FastGasPrice: '3',
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const gasPrice = await fetcher.fetchGasPrice('sepolia');

      expect(gasPrice).toEqual({
        network: 'sepolia',
        slow: 1,
        standard: 2,
        fast: 3,
        timestamp: expect.any(Number),
      });
    });

    it('should fetch gas price for polygon', async () => {
      const mockResponse = {
        result: {
          SafeGasPrice: '50',
          ProposeGasPrice: '100',
          FastGasPrice: '150',
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const gasPrice = await fetcher.fetchGasPrice('polygon');

      expect(gasPrice.network).toBe('polygon');
      expect(gasPrice.slow).toBe(50);
      expect(gasPrice.standard).toBe(100);
      expect(gasPrice.fast).toBe(150);
    });

    it('should fetch gas price for arbitrum', async () => {
      const mockResponse = {
        result: {
          SafeGasPrice: '0.1',
          ProposeGasPrice: '0.15',
          FastGasPrice: '0.2',
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const gasPrice = await fetcher.fetchGasPrice('arbitrum');

      expect(gasPrice.network).toBe('arbitrum');
      expect(gasPrice.slow).toBe(0.1);
      expect(gasPrice.standard).toBe(0.15);
      expect(gasPrice.fast).toBe(0.2);
    });

    it('should fetch gas price for optimism', async () => {
      const mockResponse = {
        result: {
          SafeGasPrice: '0.001',
          ProposeGasPrice: '0.002',
          FastGasPrice: '0.003',
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const gasPrice = await fetcher.fetchGasPrice('optimism');

      expect(gasPrice.network).toBe('optimism');
    });

    it('should fetch gas price for base', async () => {
      const mockResponse = {
        result: {
          SafeGasPrice: '0.001',
          ProposeGasPrice: '0.002',
          FastGasPrice: '0.003',
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const gasPrice = await fetcher.fetchGasPrice('base');

      expect(gasPrice.network).toBe('base');
    });

    it('should throw error for unsupported network', async () => {
      await expect(
        fetcher.fetchGasPrice('unknown' as SupportedNetwork)
      ).rejects.toThrow('Unsupported network');
    });

    it('should throw error when API call fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(fetcher.fetchGasPrice('mainnet')).rejects.toThrow(
        'Failed to fetch gas price'
      );
    });

    it('should throw error when response is malformed', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ result: {} }), // Missing gas price fields
      });

      await expect(fetcher.fetchGasPrice('mainnet')).rejects.toThrow();
    });

    it('should throw error when response is missing result field', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}), // No result field at all
      });

      await expect(fetcher.fetchGasPrice('mainnet')).rejects.toThrow(
        'Invalid gas price response: missing result'
      );
    });
  });

  describe('caching', () => {
    it('should cache gas prices for 5 minutes', async () => {
      const mockResponse = {
        result: {
          SafeGasPrice: '30',
          ProposeGasPrice: '35',
          FastGasPrice: '40',
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // First call
      await fetcher.fetchGasPrice('mainnet');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call within 5 minutes - should use cache
      await fetcher.fetchGasPrice('mainnet');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Advance time by 5 minutes + 1ms (to ensure cache expires)
      vi.advanceTimersByTime(5 * 60 * 1000 + 1);

      // Third call after 5 minutes - should fetch again
      await fetcher.fetchGasPrice('mainnet');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should cache different networks separately', async () => {
      const mockResponse = {
        result: {
          SafeGasPrice: '30',
          ProposeGasPrice: '35',
          FastGasPrice: '40',
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await fetcher.fetchGasPrice('mainnet');
      await fetcher.fetchGasPrice('sepolia');

      expect(global.fetch).toHaveBeenCalledTimes(2);

      // Cached calls
      await fetcher.fetchGasPrice('mainnet');
      await fetcher.fetchGasPrice('sepolia');

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should not cache failed requests', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(fetcher.fetchGasPrice('mainnet')).rejects.toThrow();

      // Second call should retry, not use cache
      await expect(fetcher.fetchGasPrice('mainnet')).rejects.toThrow();

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('rate limiting', () => {
    it('should retry on rate limit error (429)', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              SafeGasPrice: '30',
              ProposeGasPrice: '35',
              FastGasPrice: '40',
            },
          }),
        });

      const promise = fetcher.fetchGasPrice('mainnet');

      // Fast-forward through retry delays
      await vi.runAllTimersAsync();

      const gasPrice = await promise;

      expect(gasPrice.network).toBe('mainnet');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      // Attach error handler immediately to avoid unhandled rejection
      let error: Error | undefined;
      const p = fetcher.fetchGasPrice('mainnet').catch((e) => {
        error = e;
        return e; // Return error to resolve the promise
      });

      await vi.runAllTimersAsync();
      await p;

      expect(error).toBeDefined();
      expect(error?.message).toContain(
        'Failed to fetch gas price after retries'
      );

      // Should have tried 3 times (initial + 2 retries)
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('fallback providers', () => {
    it('should use fallback provider when primary fails', async () => {
      global.fetch = vi
        .fn()
        // Primary provider fails
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        // Fallback provider succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              SafeGasPrice: '30',
              ProposeGasPrice: '35',
              FastGasPrice: '40',
            },
          }),
        });

      const gasPrice = await fetcher.fetchGasPrice('mainnet', {
        useFallback: true,
      });

      expect(gasPrice.network).toBe('mainnet');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should throw error when all providers fail', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(
        fetcher.fetchGasPrice('mainnet', { useFallback: true })
      ).rejects.toThrow();
    });

    it('should throw error when fallback returns RPC error', async () => {
      global.fetch = vi
        .fn()
        // Primary fails
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        // Fallback returns RPC error
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            error: {
              code: -32000,
              message: 'execution reverted',
            },
          }),
        });

      await expect(
        fetcher.fetchGasPrice('mainnet', { useFallback: true })
      ).rejects.toThrow('RPC error: execution reverted');
    });

    it('should handle non-Error objects in fallback failure', async () => {
      global.fetch = vi
        .fn()
        // Primary fails
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        // Fallback throws string instead of Error
        .mockRejectedValueOnce('Network timeout');

      await expect(
        fetcher.fetchGasPrice('mainnet', { useFallback: true })
      ).rejects.toThrow('Failed to fetch gas price from all providers');
    });
  });

  describe('getAllGasPrices', () => {
    it('should fetch gas prices for all networks', async () => {
      const mockResponse = {
        result: {
          SafeGasPrice: '30',
          ProposeGasPrice: '35',
          FastGasPrice: '40',
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const allPrices = await fetcher.getAllGasPrices();

      expect(allPrices).toHaveLength(6);
      expect(allPrices.map((p) => p.network)).toEqual([
        'mainnet',
        'sepolia',
        'polygon',
        'arbitrum',
        'optimism',
        'base',
      ]);
    });

    it('should handle partial failures gracefully', async () => {
      global.fetch = vi
        .fn()
        // mainnet succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              SafeGasPrice: '30',
              ProposeGasPrice: '35',
              FastGasPrice: '40',
            },
          }),
        })
        // sepolia fails
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        // polygon succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              SafeGasPrice: '50',
              ProposeGasPrice: '100',
              FastGasPrice: '150',
            },
          }),
        })
        // Continue for other networks...
        .mockResolvedValue({
          ok: true,
          json: async () => ({
            result: {
              SafeGasPrice: '1',
              ProposeGasPrice: '2',
              FastGasPrice: '3',
            },
          }),
        });

      const allPrices = await fetcher.getAllGasPrices({
        continueOnError: true,
      });

      // Should return only successful fetches
      expect(allPrices.length).toBeGreaterThan(0);
      expect(allPrices.every((p) => p.network !== 'sepolia')).toBe(true);
    });

    it('should throw error on first failure when continueOnError is false', async () => {
      global.fetch = vi
        .fn()
        // First network (mainnet) fails
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

      await expect(
        fetcher.getAllGasPrices({ continueOnError: false })
      ).rejects.toThrow('Failed to fetch gas price for one or more networks');
    });
  });

  describe('gas price formatting', () => {
    it('should format gas price in Gwei', () => {
      const gasPrice: GasPrice = {
        network: 'mainnet',
        slow: 30,
        standard: 35,
        fast: 40,
        timestamp: Date.now(),
      };

      const formatted = fetcher.formatGasPrice(gasPrice);

      expect(formatted).toContain('mainnet');
      expect(formatted).toContain('30');
      expect(formatted).toContain('35');
      expect(formatted).toContain('40');
      expect(formatted).toContain('Gwei');
    });

    it('should include timestamp in formatted output', () => {
      const now = Date.now();
      const gasPrice: GasPrice = {
        network: 'mainnet',
        slow: 30,
        standard: 35,
        fast: 40,
        timestamp: now,
      };

      const formatted = fetcher.formatGasPrice(gasPrice);

      expect(formatted).toContain(new Date(now).toISOString());
    });
  });
});
