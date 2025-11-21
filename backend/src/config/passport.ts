import { PassportStatic } from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { prisma } from '../lib/prisma';
import { AuthProvider, User } from '@prisma/client';

/**
 * Extract display name from OAuth profile
 */
function extractDisplayName(profile: any, email: string): string {
  return (
    profile.displayName ||
    profile.username ||
    profile.name?.givenName ||
    profile.name?.familyName ||
    email.split('@')[0]
  );
}

/**
 * Generic OAuth callback handler
 * Handles user lookup, creation, and account linking for OAuth providers
 */
async function handleOAuthCallback(
  provider: AuthProvider,
  profile: any,
  email: string
): Promise<User> {
  // Find existing user by email or provider ID
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        {
          authProvider: provider,
          authProviderId: profile.id,
        },
      ],
    },
  });

  if (!user) {
    // Create new user
    user = await prisma.user.create({
      data: {
        email,
        fullName: extractDisplayName(profile, email),
        authProvider: provider,
        authProviderId: profile.id,
      },
    });
  } else if (!user.authProviderId) {
    // Link existing email-based account to OAuth provider
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        authProvider: provider,
        authProviderId: profile.id,
      },
    });
  }

  // Update last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return user;
}

export const initializePassport = (passport: PassportStatic) => {
  // JWT Strategy
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET!,
      },
      async (payload, done) => {
        try {
          const user = await prisma.user.findUnique({
            where: { id: payload.userId },
          });

          if (user) {
            return done(null, user);
          }
          return done(null, false);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: '/api/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error('No email provided by Google OAuth'), undefined);
            }

            const user = await handleOAuthCallback(AuthProvider.GOOGLE, profile, email);
            return done(null, user);
          } catch (error) {
            return done(error as Error, undefined);
          }
        }
      )
    );
  }

  // GitHub OAuth Strategy
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: '/api/auth/github/callback',
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error('No email provided by GitHub OAuth'), undefined);
            }

            const user = await handleOAuthCallback(AuthProvider.GITHUB, profile, email);
            return done(null, user);
          } catch (error) {
            return done(error, false);
          }
        }
      )
    );
  }

  // Serialize/Deserialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};