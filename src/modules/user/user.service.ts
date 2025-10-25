import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm';
import { User } from './entities/user.entity';
import { SignUpDto } from 'src/auth/dto/signup.dto';
import { UpdateUserDto } from './dto/updateUser';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async totalUsers(): Promise<number> {
    return await this.userRepository.count();
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByIds(userIds: string[]): Promise<User[]> {
    if (userIds.length === 0) return [];

    return this.userRepository.find({
      where: { id: In(userIds) },
      select: ['id', 'firstName', 'userName', 'email'],
    });
  }

  async findOne(userParam: User): Promise<User> {
    return this.findById(userParam.id);
  }

  async findByToken(token: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        passwordRestToken: token,
        passwordResetExpires: MoreThan(Date.now()),
      },
    });

    if (!user) {
      throw new NotFoundException('User not found or token expired');
    }

    return user;
  }

  async create(userDto: SignUpDto): Promise<User> {
    const user = this.userRepository.create(userDto);
    return await this.userRepository.save(user);
  }

  async update(updateDto: UpdateUserDto, userParam: User): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userParam.id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.id !== userParam.id) {
      throw new UnauthorizedException(
        'You are not allowed to update this user',
      );
    }

    const updatedUser = this.userRepository.merge(user, updateDto);
    return await this.userRepository.save(updatedUser);
  }
}
