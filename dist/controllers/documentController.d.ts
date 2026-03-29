import { Request, Response } from 'express';
import multer from 'multer';
export declare const uploadMiddleware: multer.Multer;
export declare function uploadAndProcessDocument(req: Request, res: Response): Promise<void>;
export declare function listDocuments(req: Request, res: Response): Promise<void>;
export declare function getDocument(req: Request, res: Response): Promise<void>;
export declare function removeDocument(req: Request, res: Response): Promise<void>;
export declare function getChunks(req: Request, res: Response): Promise<void>;
export declare function handleMulterError(err: Error, req: Request, res: Response, next: Function): void;
//# sourceMappingURL=documentController.d.ts.map