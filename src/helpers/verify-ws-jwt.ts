// src/modules/ws/helpers/verify-ws-jwt.ts
import type { AuthenticatedSocket } from 'src/types/socket-with-user';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/modules/user/user.service';
import { parse } from 'cookie';
import { TokenPayload } from 'src/types/token.payload';

export async function verifyWsJwt(
  socket: AuthenticatedSocket,
  jwtService: JwtService,
  configService: ConfigService,
  userService: UserService,
): Promise<boolean> {
  let token: string | undefined;

  // 1️⃣ Try Authorization header first
  const authHeader = socket.handshake.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2️⃣ Fallback: try cookies
  if (!token) {
    const cookieHeader = socket.handshake.headers.cookie;
    if (cookieHeader) {
      const cookies = parse(cookieHeader);
      token = cookies['accessToken'];
    }
  }

  // 3️⃣ Reject if no token found
  if (!token) return false;

  try {
    const payload: TokenPayload = jwtService.verify(token, {
      secret: configService.getOrThrow<string>('JWT_SECRET'),
    });

    const user = await userService.findById(payload.userId);
    if (!user) return false;

    socket.user = user;
    return true;
  } catch {
    return false;
  }
}
