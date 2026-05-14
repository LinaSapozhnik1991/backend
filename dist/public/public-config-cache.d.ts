export declare const PUBLIC_CONFIG_TTL_MS = 60000;
export declare function getPublicConfigCache(): Map<number, {
    expires: number;
    payload: Record<string, unknown>;
}>;
export declare function clearPublicConfigCache(): void;
