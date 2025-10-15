# Production Setup Guide

This guide explains how to configure ZeroKeyCI for production use.

## Environment Variables

### Required

**`SAFE_ADDRESS`** (Required in production)

Your Gnosis Safe multisig wallet address that will execute the deployment transactions.

```bash
SAFE_ADDRESS=0x742D35CC6634c0532925A3b844BC9E7595F0BEb0
```

### Optional

**`STORAGE_TYPE`** (Default: `file`)

Storage backend for proposals:
- `file` - File-based storage (default, good for small-medium deployments)
- `memory` - In-memory storage (for testing only, data lost on restart)

```bash
STORAGE_TYPE=file
```

**`STORAGE_DIR`** (Default: `.zerokey/storage`)

Custom directory for file-based storage:

```bash
STORAGE_DIR=/var/lib/zerokey/storage
```

**`NODE_ENV`**

Environment mode:
- `development` - Development mode (uses demo Safe address if not set)
- `production` - Production mode (requires SAFE_ADDRESS)
- `test` - Test mode

```bash
NODE_ENV=production
```

## Storage

### File-Based Storage (Default)

Proposals are stored in JSON format at `.zerokey/storage/proposals.json`.

**Pros:**
- Simple setup
- No external dependencies
- Good for small-medium deployments
- Persistent across restarts

**Cons:**
- Not suitable for high-volume production
- No built-in redundancy
- File locks may cause issues with multiple instances

### Migrating to Database Storage

For high-volume production deployments, implement a database adapter:

1. Create a new storage adapter in `src/services/ProposalStorage.ts`:

```typescript
export class DatabaseStorageAdapter implements StorageAdapter {
  private db: YourDatabaseClient;

  constructor(connectionString: string) {
    this.db = new YourDatabaseClient(connectionString);
  }

  async getAll(): Promise<ProposalWithMetadata[]> {
    return await this.db.query('SELECT * FROM proposals');
  }

  async getById(id: string): Promise<ProposalWithMetadata | null> {
    return await this.db.query('SELECT * FROM proposals WHERE id = $1', [id]);
  }

  async create(proposal: ProposalWithMetadata): Promise<void> {
    await this.db.query('INSERT INTO proposals ...', [proposal]);
  }

  async update(id: string, proposal: ProposalWithMetadata): Promise<void> {
    await this.db.query('UPDATE proposals SET ... WHERE id = $1', [proposal, id]);
  }

  async delete(id: string): Promise<void> {
    await this.db.query('DELETE FROM proposals WHERE id = $1', [id]);
  }
}
```

2. Update `getStorage()` to use the database adapter:

```typescript
export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    const storageType = process.env.STORAGE_TYPE || 'file';

    if (storageType === 'database') {
      storageInstance = new DatabaseStorageAdapter(
        process.env.DATABASE_URL!
      );
    } else if (storageType === 'memory') {
      storageInstance = new InMemoryStorageAdapter();
    } else {
      storageInstance = new FileStorageAdapter(process.env.STORAGE_DIR);
    }
  }

  return storageInstance;
}
```

## Production Checklist

- [ ] Set `SAFE_ADDRESS` environment variable
- [ ] Set `NODE_ENV=production`
- [ ] Configure appropriate storage backend
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for storage
- [ ] Test Safe multisig signing workflow
- [ ] Document deployment procedures
- [ ] Set up CI/CD pipeline for contract deployments

## Security Considerations

### Environment Variables

- Never commit `.env` files to version control
- Use secret management systems (AWS Secrets Manager, HashiCorp Vault, etc.)
- Rotate credentials regularly

### Safe Address

- Verify the Safe address before deploying to production
- Ensure the Safe has the correct owners and threshold
- Test with a testnet Safe first

### Storage Security

- Ensure storage directory has appropriate permissions (600/700)
- Encrypt sensitive data if storing in database
- Regular backups of proposal data
- Consider implementing data retention policies

## Monitoring

### Recommended Metrics

- Number of proposals created
- Proposal success/failure rates
- Storage size and growth
- API response times
- Failed proposal reasons

### Logging

Configure Winston logger levels based on environment:

```typescript
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

## Deployment

### Vercel/Netlify

Add environment variables in the platform's dashboard:

1. Go to Project Settings → Environment Variables
2. Add `SAFE_ADDRESS` with your production Safe address
3. Add `NODE_ENV=production`
4. Deploy

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV SAFE_ADDRESS=${SAFE_ADDRESS}
ENV STORAGE_DIR=/data/storage

VOLUME ["/data"]

EXPOSE 3000

CMD ["npm", "start"]
```

### Kubernetes

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: zerokey-config
data:
  NODE_ENV: "production"
  STORAGE_TYPE: "file"
  STORAGE_DIR: "/data/storage"

---
apiVersion: v1
kind: Secret
metadata:
  name: zerokey-secrets
type: Opaque
stringData:
  SAFE_ADDRESS: "0x742D35CC6634c0532925A3b844BC9E7595F0BEb0"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zerokey-deployment
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: zerokey
        image: zerokey:latest
        envFrom:
        - configMapRef:
            name: zerokey-config
        - secretRef:
            name: zerokey-secrets
        volumeMounts:
        - name: storage
          mountPath: /data
      volumes:
      - name: storage
        persistentVolumeClaim:
          claimName: zerokey-storage-pvc
```

## Troubleshooting

### "SAFE_ADDRESS environment variable is required in production"

**Solution:** Set the `SAFE_ADDRESS` environment variable with your Gnosis Safe multisig address.

### Storage permission errors

**Solution:** Ensure the application has write permissions to the storage directory:

```bash
mkdir -p .zerokey/storage
chmod 700 .zerokey/storage
```

### Proposals not persisting

**Solution:**
1. Check `STORAGE_TYPE` is set to `file` (not `memory`)
2. Verify storage directory is writable
3. Check disk space

## Support

For issues or questions:
- GitHub Issues: https://github.com/susumutomita/ZeroKeyCI/issues
- Documentation: https://github.com/susumutomita/ZeroKeyCI
