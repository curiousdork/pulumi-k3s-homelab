import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

export interface PostgresSpec {
    name: string;
    namespace: pulumi.Input<string>;
    password: pulumi.Input<string>;
    user?: pulumi.Input<string>;
    db?: pulumi.Input<string>;
    pvcName: pulumi.Input<string>;
    initConfigMapName?: pulumi.Input<string>;
    nodePort?: number;
    cpuLimit?: string;
    memoryLimit?: string;
    cpuRequest?: string;
    memoryRequest?: string;
    provider: k8s.Provider;
}

export interface PostgresResources {
    deployment: k8s.apps.v1.Deployment;
    service: k8s.core.v1.Service;
}

export function createPostgres(args: PostgresSpec): PostgresResources {
    const labels: Record<string, string> = { app: args.name };

    const deployment = new k8s.apps.v1.Deployment(args.name, {
        metadata: {
            name: args.name,
            namespace: args.namespace,
        },
        spec: {
            replicas: 1,
            selector: {
                matchLabels: labels,
            },
            template: {
                metadata: {
                    labels: labels,
                },
                spec: {
                    containers: [
                        {
                            name: "postgres",
                            image: "postgres:18-alpine",
                            ports: [{ containerPort: 5432, protocol: "TCP" }],
                            env: [
                                { name: "POSTGRES_PASSWORD", value: args.password },
                                ...(args.user ? [{ name: "POSTGRES_USER", value: args.user }] : []),
                                ...(args.db ? [{ name: "POSTGRES_DB", value: args.db }] : []),
                                { name: "PGDATA", value: "/var/lib/postgresql/data/pgdata" },
                            ],
                            resources: {
                                limits: {
                                    cpu: args.cpuLimit ?? "500m",
                                    memory: args.memoryLimit ?? "512Mi",
                                },
                                requests: {
                                    cpu: args.cpuRequest ?? "100m",
                                    memory: args.memoryRequest ?? "128Mi",
                                },
                            },
                            volumeMounts: [
                                {
                                    name: "postgres-data",
                                    mountPath: "/var/lib/postgresql/data",
                                },
                                ...(args.initConfigMapName
                                    ? [
                                          {
                                              name: "postgres-init",
                                              mountPath: "/docker-entrypoint-initdb.d",
                                          },
                                      ]
                                    : []),
                            ],
                        },
                    ],
                    volumes: [
                        {
                            name: "postgres-data",
                            persistentVolumeClaim: {
                                claimName: args.pvcName,
                            },
                        },
                        ...(args.initConfigMapName
                            ? [
                                  {
                                      name: "postgres-init",
                                      configMap: {
                                          name: args.initConfigMapName,
                                      },
                                  },
                              ]
                            : []),
                    ],
                },
            },
        },
    }, { provider: args.provider });

    const service = new k8s.core.v1.Service(`${args.name}-svc`, {
        metadata: {
            name: args.name,
            namespace: args.namespace,
        },
        spec: {
            type: "NodePort",
            selector: labels,
            ports: [
                {
                    port: 5432,
                    targetPort: 5432,
                    protocol: "TCP",
                    ...(args.nodePort ? { nodePort: args.nodePort } : {}),
                },
            ],
        },
    }, { provider: args.provider });

    return { deployment, service };
}
