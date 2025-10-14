import { ProposalWithMetadata } from '@/types/api';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Storage adapter interface
 * Allows easy switching between different storage backends
 */
export interface StorageAdapter {
  getAll(): Promise<ProposalWithMetadata[]>;
  getById(id: string): Promise<ProposalWithMetadata | null>;
  create(proposal: ProposalWithMetadata): Promise<void>;
  update(id: string, proposal: ProposalWithMetadata): Promise<void>;
  delete(id: string): Promise<void>;
}

/**
 * File-based storage adapter for development and small deployments
 * In production, replace with DatabaseStorageAdapter
 */
export class FileStorageAdapter implements StorageAdapter {
  private storageDir: string;
  private storageFile: string;

  constructor(storageDir?: string) {
    this.storageDir =
      storageDir || path.join(process.cwd(), '.zerokey', 'storage');
    this.storageFile = path.join(this.storageDir, 'proposals.json');
    this.ensureStorageExists();
  }

  private ensureStorageExists(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
    if (!fs.existsSync(this.storageFile)) {
      fs.writeFileSync(this.storageFile, JSON.stringify([]), 'utf-8');
    }
  }

  private readProposals(): ProposalWithMetadata[] {
    try {
      const data = fs.readFileSync(this.storageFile, 'utf-8');
      return JSON.parse(data) as ProposalWithMetadata[];
    } catch {
      return [];
    }
  }

  private writeProposals(proposals: ProposalWithMetadata[]): void {
    fs.writeFileSync(this.storageFile, JSON.stringify(proposals, null, 2));
  }

  async getAll(): Promise<ProposalWithMetadata[]> {
    return this.readProposals();
  }

  async getById(id: string): Promise<ProposalWithMetadata | null> {
    const proposals = this.readProposals();
    return proposals.find((p) => p.id === id) || null;
  }

  async create(proposal: ProposalWithMetadata): Promise<void> {
    const proposals = this.readProposals();
    proposals.push(proposal);
    this.writeProposals(proposals);
  }

  async update(id: string, proposal: ProposalWithMetadata): Promise<void> {
    const proposals = this.readProposals();
    const index = proposals.findIndex((p) => p.id === id);
    if (index !== -1) {
      proposals[index] = proposal;
      this.writeProposals(proposals);
    }
  }

  async delete(id: string): Promise<void> {
    const proposals = this.readProposals();
    const filtered = proposals.filter((p) => p.id !== id);
    this.writeProposals(filtered);
  }
}

/**
 * In-memory storage adapter for testing
 */
export class InMemoryStorageAdapter implements StorageAdapter {
  private proposals: Map<string, ProposalWithMetadata> = new Map();

  async getAll(): Promise<ProposalWithMetadata[]> {
    return Array.from(this.proposals.values());
  }

  async getById(id: string): Promise<ProposalWithMetadata | null> {
    return this.proposals.get(id) || null;
  }

  async create(proposal: ProposalWithMetadata): Promise<void> {
    this.proposals.set(proposal.id, proposal);
  }

  async update(id: string, proposal: ProposalWithMetadata): Promise<void> {
    if (this.proposals.has(id)) {
      this.proposals.set(id, proposal);
    }
  }

  async delete(id: string): Promise<void> {
    this.proposals.delete(id);
  }

  // Test helper methods
  clear(): void {
    this.proposals.clear();
  }
}

/**
 * Singleton storage instance
 */
let storageInstance: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    // Use file storage by default, can be overridden via environment variable
    const storageType = process.env.STORAGE_TYPE || 'file';

    if (storageType === 'memory') {
      storageInstance = new InMemoryStorageAdapter();
    } else {
      storageInstance = new FileStorageAdapter(process.env.STORAGE_DIR);
    }
  }

  return storageInstance;
}

// For testing purposes
export function setStorage(adapter: StorageAdapter): void {
  storageInstance = adapter;
}

export function resetStorage(): void {
  storageInstance = null;
}
