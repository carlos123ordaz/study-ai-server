import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { env } from './env';
import { User } from '../models/User';
import { CreditTransaction } from '../models/CreditTransaction';
import { logger } from '../utils/logger';

passport.use(
  new GoogleStrategy(
    {
      clientID: env.google.clientId,
      clientSecret: env.google.clientSecret,
      callbackURL: env.google.callbackUrl,
      scope: ['profile', 'email'],
    },
    async (_accessToken, _refreshToken, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email associated with Google account'), undefined);
        }

        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // New user - create and grant initial credits
          user = await User.create({
            googleId: profile.id,
            email,
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value,
            credits: env.credits.initial,
          });

          await CreditTransaction.create({
            userId: user._id,
            type: 'initial_grant',
            amount: env.credits.initial,
            balanceBefore: 0,
            balanceAfter: env.credits.initial,
            status: 'completed',
            description: `Welcome bonus: ${env.credits.initial} credits granted on registration`,
          });

          logger.info(`New user registered: ${email}`);
        } else {
          // Update profile info
          user.name = profile.displayName;
          user.avatar = profile.photos?.[0]?.value;
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        logger.error('Google OAuth error:', error);
        return done(error as Error, undefined);
      }
    }
  )
);

// We use JWT, not sessions - these are minimal stubs
passport.serializeUser((user: Express.User, done) => {
  done(null, (user as { id: string }).id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
