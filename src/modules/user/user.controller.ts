import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { UserParam } from 'src/Decorator/user-param.decorator';
import { ApiCookieAuth } from '@nestjs/swagger';
import { User } from './entities/user.entity';

@Controller('user')
@ApiCookieAuth('accessToken') // This enables Swagger to use the bearer token
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentUser(@UserParam() user: User) {
    return user;
  }
}
