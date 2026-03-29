import { Response } from 'express';
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    meta?: Record<string, unknown>;
}
export declare function sendSuccess<T>(res: Response, data: T, message?: string, statusCode?: number, meta?: Record<string, unknown>): Response;
export declare function sendCreated<T>(res: Response, data: T, message?: string): Response;
export declare function sendError(res: Response, error: string, statusCode?: number, data?: unknown): Response;
export declare function sendNotFound(res: Response, resource?: string): Response;
export declare function sendUnauthorized(res: Response, message?: string): Response;
export declare function sendForbidden(res: Response, message?: string): Response;
export declare function sendBadRequest(res: Response, message: string): Response;
//# sourceMappingURL=apiResponse.d.ts.map