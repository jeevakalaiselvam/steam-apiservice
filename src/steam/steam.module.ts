import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from '../entities/game.entity';
import { Achievement } from '../entities/achievement.entity';
import { PlayerAchievement } from '../entities/player-achievement.entity';
import { SteamApiClient } from './steam-api.client';
import { SteamSyncService } from './steam-sync.service';
import { SteamController } from './steam.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Game, Achievement, PlayerAchievement])],
  providers: [SteamApiClient, SteamSyncService],
  controllers: [SteamController],
  exports: [SteamSyncService],
})
export class SteamModule {}
