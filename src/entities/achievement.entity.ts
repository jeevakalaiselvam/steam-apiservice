import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Game } from './game.entity';

@Entity('achievements')
export class Achievement {
  @PrimaryColumn()
  appId: number;

  @PrimaryColumn()
  apiName: string;

  @Column()
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  iconGray: string;

  @Column({ type: 'float', default: 0 })
  globalPercentage: number;

  @ManyToOne(() => Game, (game) => game.achievements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appId', referencedColumnName: 'appId' })
  game: Game;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
