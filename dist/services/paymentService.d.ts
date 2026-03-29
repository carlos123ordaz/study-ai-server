export declare function getCreditPackages(): import("../models/Payment").ICreditPackage[];
export declare function initiatePayment(userId: string, packageIndex: number, returnUrl?: string, cancelUrl?: string): Promise<{
    payment: import("mongoose").Document<unknown, {}, import("../models/Payment").IPayment, {}, {}> & import("../models/Payment").IPayment & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    };
    checkoutUrl: string | undefined;
    package: import("../models/Payment").ICreditPackage;
}>;
export declare function confirmPayment(paymentId: string, userId: string): Promise<import("mongoose").Document<unknown, {}, import("../models/Payment").IPayment, {}, {}> & import("../models/Payment").IPayment & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function getUserPayments(userId: string, page?: number, limit?: number): Promise<{
    payments: (import("mongoose").FlattenMaps<import("../models/Payment").IPayment> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}>;
//# sourceMappingURL=paymentService.d.ts.map