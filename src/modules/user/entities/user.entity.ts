import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { UserStatus } from '../enums/user-status';
import { Address } from './address.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Account } from 'src/modules/accounts/entities/account.entity';
import { Transaction } from 'src/modules/transactions/entities/transaction.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => Account, (account) => account.user)
  accounts: Account[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @Column('varchar')
  userName: string;

  @Column('varchar')
  firstName: string;

  @Column('varchar')
  lastName: string;

  @Index({ unique: true }) // creates unique index
  @Column({
    type: 'varchar',
    unique: true,
    nullable: false,
  })
  email: string;

  @Column('varchar')
  profilePic: string;

  @Column('varchar')
  phoneNumber: string;

  @Column(() => Address)
  address: Address;

  @Column({ type: 'varchar', select: false })
  password: string;

  @Column({ type: 'varchar', nullable: true })
  passwordRestToken?: string;

  @Column({ type: 'double precision', nullable: true })
  passwordResetExpires?: number;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;

  @BeforeInsert()
  @BeforeUpdate()
  lowercaseEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase();
    }
  }
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      const saltRounds = 10;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }

  validatePassword(password: string): Promise<boolean> {
    if (!password) {
      throw new Error('Password is required for validation');
    }
    if (!this.password) {
      throw new Error('Hashed password is not set on the user document');
    }
    return bcrypt.compare(password, this.password);
  }
  createPasswordRestToken(): string {
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    this.passwordRestToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
  }
}
