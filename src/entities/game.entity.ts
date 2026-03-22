import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Achievement } from './achievement.entity';
import { PlayerAchievement } from './player-achievement.entity';

@Entity('games')
export class Game {
  @PrimaryColumn()
  appId: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  imgIconUrl: string;

  @Column({ nullable: true })
  imgLogoUrl: string;

  @Column({ default: 0 })
  playtimeForeverMinutes: number;

  @Column({ default: 0 })
  playtimeRecentMinutes: number;

  @Column({ default: false })
  hasAchievements: boolean;

  @Column({ default: 0 })
  totalAchievements: number;

  @Column({ type: 'float', default: 0 })
  completionPercentage: number;

  @OneToMany(() => Achievement, (a) => a.game, { cascade: true })
  achievements: Achievement[];

  @OneToMany(() => PlayerAchievement, (pa) => pa.game, { cascade: true })
  playerAchievements: PlayerAchievement[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
