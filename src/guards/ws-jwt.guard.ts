import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/modules/user/user.service';
import { TokenPayload } from 'src/types/token.payload';
import { parse } from 'cookie';
import { AuthenticatedSocket } from 'src/types/socket-with-user';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<AuthenticatedSocket>();
    // 1️⃣ Try Authorization header first
    let token: string | undefined;
    const authHeader = client.handshake.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2️⃣ Fallback: try cookies
    if (!token) {
      const cookieHeader = client.handshake.headers.cookie;
      if (cookieHeader) {
        const cookies = parse(cookieHeader);
        token = cookies['accessToken'];
      }
    }

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

      client.user = user;
      return true;
    } catch (error) {
      console.warn('❌ Invalid or expired token:', error);
      return false;
    }
  }
}
