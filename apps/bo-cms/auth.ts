import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma, UserStatus } from "@cms/db";
import { z } from "zod";
import {
  clearAuthFailures,
  isRateLimited,
  loginRateLimitKey,
  recordAuthFailure,
} from "@/lib/auth/rate-limit";

class InactiveAccountError extends CredentialsSignin {
  code = "INACTIVE";
}

class RateLimitedError extends CredentialsSignin {
  code = "RATE_LIMITED";
}

const credentialsSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
});

/** Re-check ACTIVE + permissions from DB. Keep relatively long to avoid Edge/middleware churn. */
const SESSION_SYNC_MS = 5 * 60 * 1000;

declare module "next-auth" {
  interface User {
    roles: string[];
    permissions: string[];
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      roles: string[];
      permissions: string[];
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    roles?: string[];
    permissions?: string[];
    lastSync?: number;
    invalidated?: boolean;
  }
}

async function loadAuthUser(userId: string) {
  return prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  });
}

function rolesAndPermissions(
  user: NonNullable<Awaited<ReturnType<typeof loadAuthUser>>>,
) {
  const roles = user.roles.map((item) => item.role.name);
  const permissions = Array.from(
    new Set(
      user.roles.flatMap((item) =>
        item.role.permissions.map((rp) => rp.permission.code),
      ),
    ),
  );
  return { roles, permissions };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        login: { label: "Email hoặc tên đăng nhập", type: "text" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { login, password } = parsed.data;
        const rateKey = loginRateLimitKey(login);
        if (isRateLimited(rateKey)) {
          throw new RateLimitedError();
        }

        const user = await prisma.user.findFirst({
          where: {
            deletedAt: null,
            OR: [{ email: login }, { username: login }],
          },
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: { permission: true },
                    },
                  },
                },
              },
            },
          },
        });

        if (!user) {
          recordAuthFailure(rateKey);
          return null;
        }
        if (user.status !== UserStatus.ACTIVE) {
          recordAuthFailure(rateKey);
          throw new InactiveAccountError();
        }

        const valid = await compare(password, user.passwordHash);
        if (!valid) {
          recordAuthFailure(rateKey);
          return null;
        }

        clearAuthFailures(rateKey);
        const { roles, permissions } = rolesAndPermissions(user);

        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGIN",
            resource: "USER",
            resourceId: user.id,
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles,
          permissions,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
        token.permissions = user.permissions;
        token.lastSync = Date.now();
        token.invalidated = false;
        return token;
      }

      if (!token.id || token.invalidated) return token;

      // Middleware runs on Edge — Prisma is Node-only; sync only in Node runtimes.
      if (process.env.NEXT_RUNTIME === "edge") {
        return token;
      }

      const now = Date.now();
      if (token.lastSync && now - token.lastSync < SESSION_SYNC_MS) {
        return token;
      }

      try {
        const dbUser = await loadAuthUser(token.id);

        if (!dbUser || dbUser.status !== UserStatus.ACTIVE) {
          token.id = undefined;
          token.roles = [];
          token.permissions = [];
          token.invalidated = true;
          token.lastSync = now;
          return token;
        }

        const { roles, permissions } = rolesAndPermissions(dbUser);
        token.roles = roles;
        token.permissions = permissions;
        token.invalidated = false;
        token.lastSync = now;
        return token;
      } catch (error) {
        // DB/transient failures must not wipe a valid session (common with middleware/Edge).
        console.error("[auth:jwt-sync]", error instanceof Error ? error.message : error);
        return token;
      }
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.invalidated ? "" : (token.id ?? "");
        session.user.roles = token.roles ?? [];
        session.user.permissions = token.permissions ?? [];
      }
      return session;
    },
  },
  trustHost: true,
});
