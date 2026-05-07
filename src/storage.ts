import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

export interface PVCSpec {
    name: string;
    namespace: pulumi.Input<string>;
    storage: string;
    storageClassName?: string;
    accessModes?: string[];
}

export function createPVC(
    name: string,
    namespace: pulumi.Input<string>,
    storage: string,
    storageClassName: string = "local-path",
    provider: k8s.Provider,
    accessModes: string[] = ["ReadWriteOnce"]
): k8s.core.v1.PersistentVolumeClaim {
    return new k8s.core.v1.PersistentVolumeClaim(name, {
        metadata: {
            name: name,
            namespace: namespace,
        },
        spec: {
            accessModes: accessModes,
            resources: {
                requests: {
                    storage: storage,
                },
            },
            storageClassName: storageClassName,
        },
    }, { provider });
}
