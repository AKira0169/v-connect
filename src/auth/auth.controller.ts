import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from 'src/guards/local-auth.guard';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { UserParam } from 'src/Decorator/user-param.decorator';
import { JwtRefreshGuard } from 'src/guards/jwt-refresh.guard';
import { Response } from 'express';
import { SignInDto } from './dto/signin.dto';
import { ApiBody } from '@nestjs/swagger';
import { User } from 'src/modules/user/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @ApiBody({ type: SignInDto })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@UserParam() user: User, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(user, res);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  refresh(@UserParam() user: User, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(user, res);
  }
}
