import mongoose, { Document, Model } from 'mongoose';
export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
    credits: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const User: Model<IUser>;
//# sourceMappingURL=User.d.ts.map