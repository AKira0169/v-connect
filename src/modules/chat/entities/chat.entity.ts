import { Message } from 'src/modules/messages/entities/message.entity';
import { User } from 'src/modules/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToMany(() => User)
  @JoinTable()
  participants: User[];

  @OneToMany(() => Message, (message) => message.chat)
  messages: Message[];

  @Column({ nullable: true })
  name?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
