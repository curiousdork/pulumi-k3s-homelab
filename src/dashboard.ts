import * as k8s from "@pulumi/kubernetes";

export interface DashboardSpec {
    provider: k8s.Provider;
}

export interface DashboardResources {
    namespace: k8s.core.v1.Namespace;
    serviceAccount: k8s.core.v1.ServiceAccount;
    secret: k8s.core.v1.Secret;
    csrfSecret: k8s.core.v1.Secret;
    keyHolderSecret: k8s.core.v1.Secret;
    configMap: k8s.core.v1.ConfigMap;
    role: k8s.rbac.v1.Role;
    roleBinding: k8s.rbac.v1.RoleBinding;
    clusterRole: k8s.rbac.v1.ClusterRole;
    clusterRoleBinding: k8s.rbac.v1.ClusterRoleBinding;
    metricsScraperDeployment: k8s.apps.v1.Deployment;
    metricsScraperService: k8s.core.v1.Service;
    dashboardDeployment: k8s.apps.v1.Deployment;
    dashboardService: k8s.core.v1.Service;
}

export function createDashboard(args: DashboardSpec): DashboardResources {
    const namespace = new k8s.core.v1.Namespace("kubernetes-dashboard", {
        metadata: {
            name: "kubernetes-dashboard",
        },
    }, { provider: args.provider });

    const serviceAccount = new k8s.core.v1.ServiceAccount("kubernetes-dashboard", {
        metadata: {
            name: "kubernetes-dashboard",
            namespace: namespace.metadata.name,
        },
    }, { provider: args.provider });

    const secret = new k8s.core.v1.Secret("kubernetes-dashboard-certs", {
        metadata: {
            name: "kubernetes-dashboard-certs",
            namespace: namespace.metadata.name,
        },
        type: "Opaque",
    }, { provider: args.provider });

    const csrfSecret = new k8s.core.v1.Secret("kubernetes-dashboard-csrf", {
        metadata: {
            name: "kubernetes-dashboard-csrf",
            namespace: namespace.metadata.name,
        },
        type: "Opaque",
        data: {
            csrf: "",
        },
    }, { provider: args.provider });

    const keyHolderSecret = new k8s.core.v1.Secret("kubernetes-dashboard-key-holder", {
        metadata: {
            name: "kubernetes-dashboard-key-holder",
            namespace: namespace.metadata.name,
        },
        type: "Opaque",
    }, { provider: args.provider });

    const configMap = new k8s.core.v1.ConfigMap("kubernetes-dashboard-settings", {
        metadata: {
            name: "kubernetes-dashboard-settings",
            namespace: namespace.metadata.name,
        },
    }, { provider: args.provider });

    const role = new k8s.rbac.v1.Role("kubernetes-dashboard", {
        metadata: {
            name: "kubernetes-dashboard",
            namespace: namespace.metadata.name,
        },
        rules: [
            {
                apiGroups: [""],
                resources: ["secrets"],
                verbs: ["create", "delete", "get", "list", "update"],
            },
            {
                apiGroups: [""],
                resources: ["configmaps"],
                verbs: ["get", "list"],
            },
        ],
    }, { provider: args.provider });

    const roleBinding = new k8s.rbac.v1.RoleBinding("kubernetes-dashboard", {
        metadata: {
            name: "kubernetes-dashboard",
            namespace: namespace.metadata.name,
        },
        roleRef: {
            apiGroup: "rbac.authorization.k8s.io",
            kind: "Role",
            name: "kubernetes-dashboard",
        },
        subjects: [
            {
                kind: "ServiceAccount",
                name: "kubernetes-dashboard",
                namespace: namespace.metadata.name,
            },
        ],
    }, { provider: args.provider });

    const clusterRole = new k8s.rbac.v1.ClusterRole("kubernetes-dashboard", {
        metadata: {
            name: "kubernetes-dashboard",
        },
        rules: [
            {
                apiGroups: [""],
                resources: ["pods", "services", "configmaps", "secrets", "nodes"],
                verbs: ["get", "list", "watch"],
            },
            {
                apiGroups: [""],
                resources: ["namespaces"],
                verbs: ["get", "list"],
            },
            {
                apiGroups: ["apps"],
                resources: ["deployments", "daemonsets", "replicasets", "statefulsets"],
                verbs: ["get", "list", "watch"],
            },
            {
                apiGroups: ["batch"],
                resources: ["jobs", "cronjobs"],
                verbs: ["get", "list", "watch"],
            },
        ],
    }, { provider: args.provider });

    const clusterRoleBinding = new k8s.rbac.v1.ClusterRoleBinding("kubernetes-dashboard", {
        metadata: {
            name: "kubernetes-dashboard",
        },
        roleRef: {
            apiGroup: "rbac.authorization.k8s.io",
            kind: "ClusterRole",
            name: "kubernetes-dashboard",
        },
        subjects: [
            {
                kind: "ServiceAccount",
                name: "kubernetes-dashboard",
                namespace: namespace.metadata.name,
            },
        ],
    }, { provider: args.provider });

    const metricsScraperDeployment = new k8s.apps.v1.Deployment("dashboard-metrics-scraper", {
        metadata: {
            name: "dashboard-metrics-scraper",
            namespace: namespace.metadata.name,
            labels: {
                "k8s-app": "dashboard-metrics-scraper",
            },
        },
        spec: {
            replicas: 1,
            revisionHistoryLimit: 10,
            selector: {
                matchLabels: {
                    "k8s-app": "dashboard-metrics-scraper",
                },
            },
            template: {
                metadata: {
                    labels: {
                        "k8s-app": "dashboard-metrics-scraper",
                    },
                },
                spec: {
                    containers: [
                        {
                            name: "dashboard-metrics-scraper",
                            image: "kubernetesui/metrics-scraper:v1.0.8",
                            ports: [
                                {
                                    containerPort: 8000,
                                    protocol: "TCP",
                                },
                            ],
                            livenessProbe: {
                                httpGet: {
                                    path: "/",
                                    port: 8000,
                                    scheme: "HTTP",
                                },
                                initialDelaySeconds: 30,
                                timeoutSeconds: 30,
                            },
                            volumeMounts: [
                                {
                                    name: "tmp-volume",
                                    mountPath: "/tmp",
                                },
                            ],
                            securityContext: {
                                allowPrivilegeEscalation: false,
                                readOnlyRootFilesystem: true,
                                runAsGroup: 2001,
                                runAsUser: 1001,
                            },
                        },
                    ],
                    nodeSelector: {
                        "kubernetes.io/os": "linux",
                    },
                    securityContext: {
                        seccompProfile: {
                            type: "RuntimeDefault",
                        },
                    },
                    serviceAccountName: "kubernetes-dashboard",
                    tolerations: [
                        {
                            effect: "NoSchedule",
                            key: "node-role.kubernetes.io/master",
                        },
                    ],
                    volumes: [
                        {
                            name: "tmp-volume",
                            emptyDir: {},
                        },
                    ],
                },
            },
        },
    }, { provider: args.provider });

    const metricsScraperService = new k8s.core.v1.Service("dashboard-metrics-scraper", {
        metadata: {
            name: "dashboard-metrics-scraper",
            namespace: namespace.metadata.name,
            labels: {
                "k8s-app": "dashboard-metrics-scraper",
            },
        },
        spec: {
            selector: {
                "k8s-app": "dashboard-metrics-scraper",
            },
            ports: [
                {
                    port: 8000,
                    targetPort: 8000,
                },
            ],
        },
    }, { provider: args.provider });

    const dashboardDeployment = new k8s.apps.v1.Deployment("kubernetes-dashboard", {
        metadata: {
            name: "kubernetes-dashboard",
            namespace: namespace.metadata.name,
            labels: {
                "k8s-app": "kubernetes-dashboard",
            },
        },
        spec: {
            replicas: 1,
            revisionHistoryLimit: 10,
            selector: {
                matchLabels: {
                    "k8s-app": "kubernetes-dashboard",
                },
            },
            template: {
                metadata: {
                    labels: {
                        "k8s-app": "kubernetes-dashboard",
                    },
                },
                spec: {
                    containers: [
                        {
                            name: "kubernetes-dashboard",
                            image: "kubernetesui/dashboard:v2.7.0",
                            imagePullPolicy: "Always",
                            args: [
                                "--auto-generate-certificates",
                                "--namespace=kubernetes-dashboard",
                            ],
                            ports: [
                                {
                                    containerPort: 8443,
                                    protocol: "TCP",
                                },
                            ],
                            livenessProbe: {
                                httpGet: {
                                    path: "/",
                                    port: 8443,
                                    scheme: "HTTPS",
                                },
                                initialDelaySeconds: 30,
                                timeoutSeconds: 30,
                            },
                            volumeMounts: [
                                {
                                    name: "kubernetes-dashboard-certs",
                                    mountPath: "/certs",
                                },
                                {
                                    name: "tmp-volume",
                                    mountPath: "/tmp",
                                },
                            ],
                            securityContext: {
                                allowPrivilegeEscalation: false,
                                readOnlyRootFilesystem: true,
                                runAsGroup: 2001,
                                runAsUser: 1001,
                            },
                        },
                    ],
                    nodeSelector: {
                        "kubernetes.io/os": "linux",
                    },
                    securityContext: {
                        seccompProfile: {
                            type: "RuntimeDefault",
                        },
                    },
                    serviceAccountName: "kubernetes-dashboard",
                    tolerations: [
                        {
                            effect: "NoSchedule",
                            key: "node-role.kubernetes.io/master",
                        },
                    ],
                    volumes: [
                        {
                            name: "kubernetes-dashboard-certs",
                            secret: {
                                secretName: "kubernetes-dashboard-certs",
                            },
                        },
                        {
                            name: "tmp-volume",
                            emptyDir: {},
                        },
                    ],
                },
            },
        },
    }, { provider: args.provider });

    const dashboardService = new k8s.core.v1.Service("kubernetes-dashboard", {
        metadata: {
            name: "kubernetes-dashboard",
            namespace: namespace.metadata.name,
            labels: {
                "k8s-app": "kubernetes-dashboard",
            },
        },
        spec: {
            selector: {
                "k8s-app": "kubernetes-dashboard",
            },
            ports: [
                {
                    port: 443,
                    targetPort: 8443,
                },
            ],
        },
    }, { provider: args.provider });

    return {
        namespace,
        serviceAccount,
        secret,
        csrfSecret,
        keyHolderSecret,
        configMap,
        role,
        roleBinding,
        clusterRole,
        clusterRoleBinding,
        metricsScraperDeployment,
        metricsScraperService,
        dashboardDeployment,
        dashboardService,
    };
}
