import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import { createNamespace } from "./namespaces.js";
import { createPVC } from "./storage.js";
import { createPostgres, type PostgresResources } from "./postgres.js";
import { createValkey, type ValkeyResources } from "./valkey.js";
import { createDashboard, type DashboardResources } from "./dashboard.js";
import {
    postgresPassword,
    postgresDevPassword,
    valkeyPassword,
    valkeyDevPassword,
} from "./config.js";

const config = new pulumi.Config();
const kubeconfig = config.get("kubeconfig");

const provider = new k8s.Provider("k3s-provider", {
    kubeconfig: kubeconfig,
});

const sharedNamespace = createNamespace("shared-instances", provider);

const postgresPVC = createPVC("postgres-pvc", sharedNamespace.metadata.name, "10Gi", "local-path", provider);
const postgresDevPVC = createPVC("postgres-dev-pvc", sharedNamespace.metadata.name, "10Gi", "local-path", provider);
const valkeyPVC = createPVC("valkey-pvc", sharedNamespace.metadata.name, "5Gi", "local-path", provider);
const valkeyDevPVC = createPVC("valkey-dev-pvc", sharedNamespace.metadata.name, "5Gi", "local-path", provider);

const postgresInitConfigMap = new k8s.core.v1.ConfigMap("postgres-init", {
    metadata: {
        name: "postgres-init",
        namespace: sharedNamespace.metadata.name,
    },
    data: {},
}, { provider });

const postgresDevInitConfigMap = new k8s.core.v1.ConfigMap("postgres-dev-init", {
    metadata: {
        name: "postgres-dev-init",
        namespace: sharedNamespace.metadata.name,
    },
    data: {},
}, { provider });

const postgres: PostgresResources = createPostgres({
    name: "postgres",
    namespace: sharedNamespace.metadata.name,
    password: postgresPassword,
    pvcName: postgresPVC.metadata.name,
    initConfigMapName: postgresInitConfigMap.metadata.name,
    nodePort: 30432,
    provider: provider,
});

const postgresDev: PostgresResources = createPostgres({
    name: "postgres-dev",
    namespace: sharedNamespace.metadata.name,
    password: postgresDevPassword,
    user: "postgres-dev",
    db: "homelab",
    pvcName: postgresDevPVC.metadata.name,
    initConfigMapName: postgresDevInitConfigMap.metadata.name,
    nodePort: 30433,
    provider: provider,
});

const valkey: ValkeyResources = createValkey({
    name: "valkey",
    namespace: sharedNamespace.metadata.name,
    password: valkeyPassword,
    pvcName: valkeyPVC.metadata.name,
    nodePort: 30379,
    provider: provider,
});

const valkeyDev: ValkeyResources = createValkey({
    name: "valkey-dev",
    namespace: sharedNamespace.metadata.name,
    password: valkeyDevPassword,
    pvcName: valkeyDevPVC.metadata.name,
    nodePort: 30380,
    provider: provider,
});

const dashboard: DashboardResources = createDashboard({ provider: provider });

export const postgresServiceNodePort = postgres.service.spec.ports.apply(ports => ports?.[0]?.nodePort);
export const postgresDevServiceNodePort = postgresDev.service.spec.ports.apply(ports => ports?.[0]?.nodePort);
export const valkeyServiceNodePort = valkey.service.spec.ports.apply(ports => ports?.[0]?.nodePort);
export const valkeyDevServiceNodePort = valkeyDev.service.spec.ports.apply(ports => ports?.[0]?.nodePort);
export const dashboardServicePort = dashboard.dashboardService.spec.ports.apply(ports => ports?.[0]?.port);
