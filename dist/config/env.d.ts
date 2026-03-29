export declare const env: {
    nodeEnv: string;
    port: number;
    clientUrl: string;
    mongodbUri: string;
    jwtSecret: string;
    jwtExpiresIn: string;
    google: {
        clientId: string;
        clientSecret: string;
        callbackUrl: string;
    };
    gcs: {
        bucketName: string;
        projectId: string;
        credentialsPath: string;
    };
    gemini: {
        apiKey: string;
        model: string;
    };
    credits: {
        initial: number;
    };
    payment: {
        provider: "mock" | "mercadopago" | "paypal";
        mercadopago: {
            accessToken: string;
            publicKey: string;
            webhookSecret: string;
        };
        paypal: {
            clientId: string;
            clientSecret: string;
            mode: "sandbox" | "live";
        };
    };
    upload: {
        maxFileSizeMb: number;
    };
    isDev: boolean;
    isProd: boolean;
};
//# sourceMappingURL=env.d.ts.map