import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { UserParam } from 'src/Decorator/user-param.decorator';
import { User } from './entities/user.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentUser(@UserParam() user: User) {
    return user;
  }

  // 🔍 Search users by name or email
  @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchUsers(
    @Query('query') query: string,
    @UserParam() currentUser: User,
  ) {
    return await this.userService.searchUsers(query, currentUser.id);
  }
}
