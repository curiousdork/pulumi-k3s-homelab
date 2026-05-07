import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

export interface ValkeySpec {
    name: string;
    namespace: pulumi.Input<string>;
    password: pulumi.Input<string>;
    pvcName: pulumi.Input<string>;
    nodePort?: number;
    cpuLimit?: string;
    memoryLimit?: string;
    cpuRequest?: string;
    memoryRequest?: string;
    provider: k8s.Provider;
}

export interface ValkeyResources {
    deployment: k8s.apps.v1.Deployment;
    service: k8s.core.v1.Service;
}

export function createValkey(args: ValkeySpec): ValkeyResources {
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
                            name: "valkey",
                            image: "valkey/valkey:latest",
                            imagePullPolicy: "Always",
                            command: ["valkey-server"],
                            args: [
                                "--requirepass",
                                args.password,
                                "--save",
                                "60",
                                "1",
                                "--appendonly",
                                "yes",
                            ],
                            ports: [{ containerPort: 6379, protocol: "TCP" }],
                            resources: {
                                limits: {
                                    cpu: args.cpuLimit ?? "250m",
                                    memory: args.memoryLimit ?? "256Mi",
                                },
                                requests: {
                                    cpu: args.cpuRequest ?? "50m",
                                    memory: args.memoryRequest ?? "64Mi",
                                },
                            },
                            volumeMounts: [
                                {
                                    name: "valkey-data",
                                    mountPath: "/data",
                                },
                            ],
                        },
                    ],
                    volumes: [
                        {
                            name: "valkey-data",
                            persistentVolumeClaim: {
                                claimName: args.pvcName,
                            },
                        },
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
                    port: 6379,
                    targetPort: 6379,
                    protocol: "TCP",
                    ...(args.nodePort ? { nodePort: args.nodePort } : {}),
                },
            ],
        },
    }, { provider: args.provider });

    return { deployment, service };
}
