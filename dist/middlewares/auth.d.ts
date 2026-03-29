import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';
export interface JwtPayload {
    userId: string;
    email: string;
}
declare global {
    namespace Express {
        interface User extends IUser {
        }
    }
}
export declare function generateToken(user: IUser): string;
export declare function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.d.ts.map