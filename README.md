# K3s Homelab Pulumi Project

Manage your K3s homelab Kubernetes resources with Pulumi, TypeScript, and Bun.

## Prerequisites

- [Pulumi CLI](https://www.pulumi.com/docs/get-started/install/)
- [Bun](https://bun.sh/) (latest)
- Access to your K3s cluster
- `kubectl` configured with cluster access

## Project Structure

```
pulumi-k3s-homelab/
├── Pulumi.yaml              # Pulumi project config
├── package.json             # Bun dependencies
├── bun.lock                 # Bun lockfile (committed)
├── tsconfig.json            # TypeScript config
├── README.md
├── src/                     # TypeScript source files
│   ├── index.ts             # Main entry point
│   ├── config.ts            # Pulumi configuration
│   ├── namespaces.ts        # Namespace resources + types
│   ├── storage.ts           # PVC resources + types
│   ├── postgres.ts          # Postgres resources + types
│   ├── valkey.ts            # Valkey resources + types
│   └── dashboard.ts         # Dashboard resources + types
└── dist/                    # Bundled JavaScript (generated)
```

## Installation

```bash
cd pulumi-k3s-homelab
bun install
```

## Configuration

Create a new stack and configure it:

```bash
pulumi stack init dev
pulumi config set kubeconfig --path ~/.kube/config
```

### Optional: Set Custom Passwords

```bash
pulumi config set --secret postgresPassword your-password
pulumi config set --secret postgresDevPassword your-dev-password
pulumi config set --secret valkeyPassword your-valkey-password
pulumi config set --secret valkeyDevPassword your-valkey-dev-password
```

If not set, default passwords will be used (matching your current deployment).

## Deploy

```bash
bun run build
pulumi up
```

## Destroy

```bash
pulumi destroy
```

## TypeScript Usage

All modules export typed interfaces and functions:

```typescript
import { createPostgres, type PostgresSpec } from "./postgres.js";
import { createValkey, type ValkeySpec } from "./valkey.js";
import { createPVC, type PVCSpec } from "./storage.js";
```

## Commands

```bash
bun install          # Install dependencies
bun run build        # Bundle TypeScript for Pulumi
bun run watch        # Watch mode for development
pulumi up            # Deploy to cluster
pulumi destroy       # Remove all resources
```
