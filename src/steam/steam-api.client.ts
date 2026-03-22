import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

// Define interfaces for Steam API responses
export interface SteamOwnedGame {
  appid: number;
  name: string;
  img_icon_url: string;
  img_logo_url: string;
  playtime_forever: number;
  playtime_2weeks?: number;
}

export interface SteamAchievementSchema {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  icongray: string;
}

export interface SteamPlayerAchievement {
  apiname: string;
  achieved: number;
  unlocktime: number;
}

export interface SteamGlobalAchievement {
  name: string;
  percent: number;
}

@Injectable()
export class SteamApiClient {
  private readonly http: AxiosInstance;
  private readonly apiKey: string;
  private readonly logger = new Logger(SteamApiClient.name);

  constructor(private config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>('STEAM_API_KEY');
    this.http = axios.create({
      baseURL: 'https://api.steampowered.com',
      timeout: 15_000,
    });
  }

  /** Get all games owned by a player */
  async getOwnedGames(steamId: string): Promise<SteamOwnedGame[]> {
    this.logger.log(`Fetching owned games for ${steamId}`);
    const { data } = await this.http.get(
      '/IPlayerService/GetOwnedGames/v0001/',
      {
        params: {
          key: this.apiKey,
          steamid: steamId,
          include_appinfo: true,
          include_played_free_games: true,
          format: 'json',
        },
      },
    );
    return data?.response?.games ?? [];
  }

  /** Get the achievement schema (definitions) for a game */
  async getSchemaForGame(appId: number): Promise<SteamAchievementSchema[]> {
    try {
      const { data } = await this.http.get(
        '/ISteamUserStats/GetSchemaForGame/v2/',
        { params: { key: this.apiKey, appid: appId, format: 'json' } },
      );
      return data?.game?.availableGameStats?.achievements ?? [];
    } catch (err) {
      this.logger.warn(`No schema for appId ${appId}: ${err.message}`);
      return [];
    }
  }

  /** Get a player's unlock status for a game's achievements */
  async getPlayerAchievements(
    steamId: string,
    appId: number,
  ): Promise<SteamPlayerAchievement[]> {
    try {
      const { data } = await this.http.get(
        '/ISteamUserStats/GetPlayerAchievements/v0001/',
        {
          params: {
            key: this.apiKey,
            steamid: steamId,
            appid: appId,
            format: 'json',
          },
        },
      );
      return data?.playerstats?.achievements ?? [];
    } catch (err) {
      this.logger.warn(
        `No player achievements for appId ${appId}: ${err.message}`,
      );
      return [];
    }
  }

  /** Get global unlock percentages for a game */
  async getGlobalAchievementPercentages(
    appId: number,
  ): Promise<SteamGlobalAchievement[]> {
    try {
      const { data } = await this.http.get(
        '/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/',
        { params: { gameid: appId, format: 'json' } },
      );
      return data?.achievementpercentages?.achievements ?? [];
    } catch (err) {
      this.logger.warn(`No global stats for appId ${appId}: ${err.message}`);
      return [];
    }
  }
}
