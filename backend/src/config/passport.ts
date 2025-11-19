import { PassportStatic } from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { prisma } from '../lib/prisma';
import { AuthProvider } from '@prisma/client';

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
            let user = await prisma.user.findFirst({
              where: {
                OR: [
                  { email: profile.emails?.[0].value },
                  {
                    authProvider: AuthProvider.GOOGLE,
                    authProviderId: profile.id,
                  },
                ],
              },
            });

            if (!user) {
              user = await prisma.user.create({
                data: {
                  email: profile.emails![0].value,
                  fullName: profile.displayName,
                  authProvider: AuthProvider.GOOGLE,
                  authProviderId: profile.id,
                },
              });
            } else if (!user.authProviderId) {
              // Link existing account
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  authProvider: AuthProvider.GOOGLE,
                  authProviderId: profile.id,
                },
              });
            }

            await prisma.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
            });

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
            let user = await prisma.user.findFirst({
              where: {
                OR: [
                  { email: profile.emails?.[0].value },
                  {
                    authProvider: AuthProvider.GITHUB,
                    authProviderId: profile.id,
                  },
                ],
              },
            });

            if (!user) {
              user = await prisma.user.create({
                data: {
                  email: profile.emails![0].value,
                  fullName: profile.displayName || profile.username,
                  authProvider: AuthProvider.GITHUB,
                  authProviderId: profile.id,
                },
              });
            } else if (!user.authProviderId) {
              // Link existing account
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  authProvider: AuthProvider.GITHUB,
                  authProviderId: profile.id,
                },
              });
            }

            await prisma.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
            });

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