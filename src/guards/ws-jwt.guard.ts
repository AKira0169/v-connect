// src/auth/guards/ws-jwt.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/modules/user/user.service';
import { Socket } from 'socket.io';
import { TokenPayload } from 'src/types/token.payload';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const cookies = client.handshake.headers.cookie;

    if (!cookies) {
      console.warn('❌ No cookies found in handshake');
      return false;
    }

    // Parse cookies manually
    const parsedCookies = Object.fromEntries(
      cookies.split(';').map((cookie) => {
        const [key, ...v] = cookie.trim().split('=');
        return [key, decodeURIComponent(v.join('='))];
      }),
    );

    const token = parsedCookies['accessToken']; // exact name you use

    if (!token) {
      console.warn('❌ No accessToken found in cookies');
      return false;
    }

    try {
      const payload: TokenPayload = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });

      const user = await this.userService.findById(payload.userId);
      if (!user) {
        console.warn('❌ User not found for token payload');
        return false;
      }

      // Attach user to socket for later retrieval
      (client as any).user = user;
      return true;
    } catch {
      return false;
    }
  }
}
