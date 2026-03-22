import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from '../entities/game.entity';
import { Achievement } from '../entities/achievement.entity';
import { PlayerAchievement } from '../entities/player-achievement.entity';
import { SteamApiClient, SteamOwnedGame } from './steam-api.client';

export interface RefreshResult {
  steamId: string;
  gamesProcessed: number;
  gamesWithAchievements: number;
  totalAchievementsSynced: number;
  durationMs: number;
}

@Injectable()
export class SteamSyncService {
  private readonly logger = new Logger(SteamSyncService.name);

  constructor(
    private readonly steamApi: SteamApiClient,
    private readonly config: ConfigService,
    @InjectRepository(Game)
    private readonly gameRepo: Repository<Game>,
    @InjectRepository(Achievement)
    private readonly achievementRepo: Repository<Achievement>,
    @InjectRepository(PlayerAchievement)
    private readonly playerAchievementRepo: Repository<PlayerAchievement>,
  ) {}

  async refresh(steamIdOverride?: string): Promise<RefreshResult> {
    const start = Date.now();
    const steamId =
      steamIdOverride ?? this.config.getOrThrow<string>('STEAM_ID');

    this.logger.log(`Starting refresh for Steam ID: ${steamId}`);

    // 1. Fetch all owned games
    const ownedGames = await this.steamApi.getOwnedGames(steamId);
    this.logger.log(`Found ${ownedGames.length} owned games`);

    let gamesWithAchievements = 0;
    let totalAchievementsSynced = 0;

    for (const ownedGame of ownedGames) {
      // 2. Upsert the game record
      const game = await this.upsertGame(ownedGame);

      // 3. Fetch achievement schema
      const schema = await this.steamApi.getSchemaForGame(game.appId);
      if (schema.length === 0) {
        game.hasAchievements = false;
        game.totalAchievements = 0;
        game.completionPercentage = 0;
        await this.gameRepo.save(game);
        continue; // Skip games with no achievements
      }

      game.hasAchievements = true;
      game.totalAchievements = schema.length;

      // 4. Fetch global stats + player progress in parallel
      const [globalStats, playerStats] = await Promise.all([
        this.steamApi.getGlobalAchievementPercentages(game.appId),
        this.steamApi.getPlayerAchievements(steamId, game.appId),
      ]);

      // Build lookup maps for fast access
      const globalMap = new Map(globalStats.map((g) => [g.name, g.percent]));
      const playerMap = new Map(playerStats.map((p) => [p.apiname, p]));

      // 5. Upsert each achievement + player status
      for (const ach of schema) {
        await this.achievementRepo.upsert(
          {
            appId: game.appId,
            apiName: ach.name,
            displayName: ach.displayName,
            description: ach.description ?? null,
            icon: ach.icon,
            iconGray: ach.icongray,
            globalPercentage: globalMap.get(ach.name) ?? 0,
          },
          ['appId', 'apiName'], // conflict columns
        );

        const playerAch = playerMap.get(ach.name);
        await this.playerAchievementRepo.upsert(
          {
            steamId,
            appId: game.appId,
            apiName: ach.name,
            achieved: playerAch?.achieved === 1,
            unlockTime: playerAch?.unlocktime ?? 0,
          },
          ['steamId', 'appId', 'apiName'],
        );
      }

      // 6. Compute and save completion %
      const unlockedCount = playerStats.filter((p) => p.achieved === 1).length;
      game.completionPercentage =
        schema.length > 0 ? (unlockedCount / schema.length) * 100 : 0;
      await this.gameRepo.save(game);

      gamesWithAchievements++;
      totalAchievementsSynced += schema.length;

      this.logger.log(
        `Synced ${game.name}: ${unlockedCount}/${schema.length} (${game.completionPercentage.toFixed(1)}%)`,
      );
    }

    const durationMs = Date.now() - start;
    this.logger.log(`Refresh complete in ${(durationMs / 1000).toFixed(1)}s`);

    return {
      steamId,
      gamesProcessed: ownedGames.length,
      gamesWithAchievements,
      totalAchievementsSynced,
      durationMs,
    };
  }

  private async upsertGame(ownedGame: SteamOwnedGame): Promise<Game> {
    let game = await this.gameRepo.findOneBy({ appId: ownedGame.appid });
    if (!game) {
      game = this.gameRepo.create({ appId: ownedGame.appid });
    }
    game.name = ownedGame.name;
    game.imgIconUrl = ownedGame.img_icon_url;
    game.imgLogoUrl = ownedGame.img_logo_url ?? null;
    game.playtimeForeverMinutes = ownedGame.playtime_forever;
    game.playtimeRecentMinutes = ownedGame.playtime_2weeks ?? 0;
    return this.gameRepo.save(game);
  }
}
