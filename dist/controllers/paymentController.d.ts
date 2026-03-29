import { Request, Response } from 'express';
export declare function getPackages(_req: Request, res: Response): Promise<void>;
export declare function createPayment(req: Request, res: Response): Promise<void>;
export declare function confirmPaymentHandler(req: Request, res: Response): Promise<void>;
export declare function listPayments(req: Request, res: Response): Promise<void>;
export declare function paymentWebhook(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=paymentController.d.ts.map