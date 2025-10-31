import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Message } from 'src/modules/messages/entities/message.entity';

export enum ChatType {
  DIRECT = 'direct',
}
export type AiInsights = {
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  keywords: string[];
};

@Entity()
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ChatType, default: ChatType.DIRECT })
  type: ChatType;

  @Column({ nullable: true })
  title?: string; // optional for group chats

  @ManyToMany(() => User)
  @JoinTable({
    name: 'chat_participants',
    joinColumn: { name: 'chat_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  participants: User[];

  @OneToMany(() => Message, (message) => message.chat)
  messages: Message[];

  @Column({ type: 'json', nullable: true })
  aiInsights?: Partial<AiInsights>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
