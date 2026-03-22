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

@Entity('player_achievements')
export class PlayerAchievement {
  @PrimaryColumn()
  steamId: string;

  @PrimaryColumn()
  appId: number;

  @PrimaryColumn()
  apiName: string;

  @Column({ default: false })
  achieved: boolean;

  @Column({ type: 'bigint', default: 0 })
  unlockTime: number;

  @ManyToOne(() => Game, (game) => game.playerAchievements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appId', referencedColumnName: 'appId' })
  game: Game;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
