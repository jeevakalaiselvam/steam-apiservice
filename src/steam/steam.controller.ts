import { Controller, Post, Query, Get, Param } from '@nestjs/common';
import { SteamSyncService } from './steam-sync.service';
import { RefreshQueryDto } from './dto/refresh-query.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from '../entities/game.entity';

@Controller('steam')
export class SteamController {
  constructor(
    private readonly syncService: SteamSyncService,
    @InjectRepository(Game)
    private readonly gameRepo: Repository<Game>,
  ) {}

  /** POST /api/steam/refresh?steamId=optional */
  @Post('refresh')
  async refresh(@Query() query: RefreshQueryDto) {
    return this.syncService.refresh(query.steamId);
  }

  /** GET /api/steam/games */
  @Get('games')
  async getGames() {
    return this.gameRepo.find({ order: { name: 'ASC' } });
  }

  /** GET /api/steam/games/:appId/achievements */
  @Get('games/:appId/achievements')
  async getGameAchievements(@Param('appId') appId: number) {
    return this.gameRepo.findOne({
      where: { appId },
      relations: ['achievements', 'playerAchievements'],
    });
  }
}
