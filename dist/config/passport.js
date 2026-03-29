"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const env_1 = require("./env");
const User_1 = require("../models/User");
const CreditTransaction_1 = require("../models/CreditTransaction");
const logger_1 = require("../utils/logger");
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: env_1.env.google.clientId,
    clientSecret: env_1.env.google.clientSecret,
    callbackURL: env_1.env.google.callbackUrl,
    scope: ['profile', 'email'],
}, async (_accessToken, _refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
            return done(new Error('No email associated with Google account'), undefined);
        }
        let user = await User_1.User.findOne({ googleId: profile.id });
        if (!user) {
            // New user - create and grant initial credits
            user = await User_1.User.create({
                googleId: profile.id,
                email,
                name: profile.displayName,
                avatar: profile.photos?.[0]?.value,
                credits: env_1.env.credits.initial,
            });
            await CreditTransaction_1.CreditTransaction.create({
                userId: user._id,
                type: 'initial_grant',
                amount: env_1.env.credits.initial,
                balanceBefore: 0,
                balanceAfter: env_1.env.credits.initial,
                status: 'completed',
                description: `Welcome bonus: ${env_1.env.credits.initial} credits granted on registration`,
            });
            logger_1.logger.info(`New user registered: ${email}`);
        }
        else {
            // Update profile info
            user.name = profile.displayName;
            user.avatar = profile.photos?.[0]?.value;
            await user.save();
        }
        return done(null, user);
    }
    catch (error) {
        logger_1.logger.error('Google OAuth error:', error);
        return done(error, undefined);
    }
}));
// We use JWT, not sessions - these are minimal stubs
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await User_1.User.findById(id);
        done(null, user);
    }
    catch (err) {
        done(err, null);
    }
});
exports.default = passport_1.default;
//# sourceMappingURL=passport.js.map