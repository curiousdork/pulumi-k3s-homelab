import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

const config = new pulumi.Config();

export const kubeconfig = config.get("kubeconfig");
export const postgresPassword = config.getSecret("postgresPassword") ?? pulumi.output("postgres");
export const postgresDevPassword = config.getSecret("postgresDevPassword") ?? pulumi.output("postgres-dev");
export const valkeyPassword = config.getSecret("valkeyPassword") ?? pulumi.output("valkey");
export const valkeyDevPassword = config.getSecret("valkeyDevPassword") ?? pulumi.output("valkey-dev");
