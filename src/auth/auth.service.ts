import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { RefreshToken } from 'src/entities/refresh-token.entity';
import { Response } from 'express';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 12;
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  //  TOKEN GENERATION
  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessSecret = this.configService.get<string>('app.jwtAccessSecret');
    const refreshSecret = this.configService.get<string>(
      'app.jwtRefreshSecret',
    );
    const refreshDays = this.configService.get<number>(
      'app.refreshTokenExpiryDays',
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: '15min',
      }),
      // Refresh token: minimal payload — full validation is done via DB lookup
      this.jwtService.signAsync(
        { sub: userId },
        {
          secret: refreshSecret,
          expiresIn: `${refreshDays}d`,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  //  STORE REFRESH TOKEN (hashed)
  private async storeRefreshToken(userId: string, rawToken: string) {
    const refreshDays = this.configService.get<number>(
      'app.refreshTokenExpiryDays',
    );
    const token_hash = this.hashToken(rawToken);
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + refreshDays);

    try {
      const refreshToken = this.refreshTokenRepository.create({
        token_hash,
        user: { id: userId },
        expireAt,
      });

      await this.refreshTokenRepository.save(refreshToken);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`Failed to store refresh token: ${message}`);
      throw new InternalServerErrorException('Authentication setup failed');
    }
  }

  //  SET HTTP-ONLY COOKIES
  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const isProd = this.configService.get('NODE_ENV') === 'production';

    const refreshMaxAge = this.configService.get<number>(
      'app.refreshTokenExpiryDays',
    );
    // Access token cookie — short-lived
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd, // HTTPS only in production
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes in ms
    });

    // Refresh token cookie — longer-lived, restricted to refresh endpoint
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax', // Allow cross-site in production for refresh endpoint
      path: '/auth/refresh', // only sent to this endpoint
      maxAge: refreshMaxAge * 24 * 60 * 60 * 1000,
    });
  }

  //  UTILITIES
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
