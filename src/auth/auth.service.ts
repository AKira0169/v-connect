import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../modules/user/user.service';
import { SignInDto } from './dto/signin.dto';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto } from './dto/signup.dto';
import { TokenPayload } from 'src/types/token.payload';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { CookieConfigService } from 'src/config/cookies/cookie-config.service';
import { User } from 'src/modules/user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private readonly userService: UserService,
    private jwtService: JwtService,
    private cookieConfigService: CookieConfigService,
  ) {}

  async validateUser({ email, password }: SignInDto) {
    const user = await this.userService.findByEmail(email);
    if (user && (await user.validatePassword(password))) {
      return user;
    }
    throw new UnauthorizedException('Invalid email or password');
  }

  login(user: User, res: Response) {
    const sessionId = randomUUID();
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      sessionId,
    };
    const accessToken = this.jwtService.sign(payload);
    res.cookie(
      'accessToken',
      accessToken,
      this.cookieConfigService.cookieOptions.accessToken,
    );

    return {
      accessToken: accessToken,
    };
  }

  async signUp(signUpDto: SignUpDto, res: Response) {
    const user = await this.userService.create(signUpDto);

    return this.login(user, res);
  }
}
