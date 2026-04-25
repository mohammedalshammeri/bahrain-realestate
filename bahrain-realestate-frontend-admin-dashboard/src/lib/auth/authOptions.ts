import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { adminApi } from '../api/adminApi';

interface LoginResponseData {
  admin: {
    id: number;
    name: string;
    username: string;
  };
  token: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'اسم المستخدم', type: 'text' },
        password: { label: 'كلمة المرور', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const response = await adminApi.login({
            username: credentials.username,
            password: credentials.password,
          });
          const data = response.data as LoginResponseData | undefined;

          if (response.success && data) {
            return {
              id: data.admin.id.toString(),
              name: data.admin.name,
              email: data.admin.username,
              token: data.token,
            };
          }
          
          return null;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.token;
        token.role = 'admin';
      }
      return token;
    },
    
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken;
        session.user.role = token.role;
      }
      return session;
    },
  },
  
  pages: {
    signIn: '/auth/login',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  
  secret: process.env.NEXTAUTH_SECRET,
};
