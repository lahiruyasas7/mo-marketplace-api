import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { RefreshToken } from 'src/entities/refresh-token.entity';
import { Response, Request } from 'express';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 12;
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  //  REGISTER
  async registerUser(dto: RegisterUserDto, res: Response) {
    // 1. Check for existing user (timing-safe: always hash even if user exists)
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
      select: ['id'],
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    // 2. Hash password
    const password_hash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    const user = this.userRepository.create({
      name: dto.full_name,
      email: dto.email,
      password: password_hash,
    });
    await this.userRepository.save(user);
    this.logger.log(`New user registered: ${user.id}`);

    // 4. Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
    );

    // 5. Store hashed refresh token in DB
    await this.storeRefreshToken(user.id, refreshToken);

    // 6. Set HTTP-only cookies
    this.setAuthCookies(res, accessToken, refreshToken);

    // 7. Return safe user data (never return tokens in body)
    return {
      message: 'Registration successful',
      user: {
        id: user.id,
        full_name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    };
  }

  //  LOGIN
  async loginUser(dto: LoginUserDto, res: Response) {
    // 1. Find user by email — select only needed fields
    const user = await this.userRepository.findOne({
      where: { email: dto.email, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });

    // 2. Always run bcrypt compare even if user not found
    //    This prevents timing attacks that reveal whether an email exists
    const dummyHash =
      '$2b$12$invalidhashfortimingprotectiononly000000000000000000000';
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user?.password ?? dummyHash,
    );

    // 3. Reject with a generic message — never reveal which field is wrong
    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 4. Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
    );

    // 5. Store hashed refresh token in DB
    await this.storeRefreshToken(user.id, refreshToken);

    // 6. Set HTTP-only cookies
    this.setAuthCookies(res, accessToken, refreshToken);

    this.logger.log(`User logged in: ${user.id}`);

    // 7. Return safe user info — never return tokens in body
    return {
      message: 'Login successful',
      user: {
        id: user.id,
        full_name: user.name,
        email: user.email,
      },
    };
  }

  //GET USER INFO
  async getMe(userId: string) {
    try {
      if (!userId) throw new UnauthorizedException('Invalid token');
      const user = await this.userRepository.findOne({
        where: { id: userId, isActive: true },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        // Token was valid but user was deleted after token was issued
        throw new UnauthorizedException('Account not found');
      }

      return user;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  /////////refresh token //////////
  async refreshTokens(req: Request, res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    try {
      // 1. Verify JWT signature and expiration
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('app.jwtRefreshSecret'),
      });

      // 2. Validate user exists and is active
      const user = await this.userRepository.findOne({
        where: { id: payload.sub, isActive: true },
        select: { id: true, email: true },
      });

      if (!user) {
        throw new UnauthorizedException('Account not found or inactive');
      }

      // 3. Validate refresh token against database (check hash and expiration)
      const tokenHash = this.hashToken(refreshToken);
      const storedToken = await this.refreshTokenRepository.findOne({
        where: {
          token_hash: tokenHash,
          user: { id: user.id },
        },
      });

      if (!storedToken || storedToken.expireAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // 4. Generate new tokens
      const newTokens = await this.generateTokens(user.id, user.email);

      // 5. Revoke old refresh token (optional but recommended)
      await this.refreshTokenRepository.remove(storedToken);

      // 6. Store new refresh token in DB
      await this.storeRefreshToken(user.id, newTokens.refreshToken);

      // 7. Set new refresh token in HttpOnly cookie
      this.setAuthCookies(res, newTokens.accessToken, newTokens.refreshToken);

      this.logger.log(`Tokens refreshed for user: ${user.id}`);

      return { accessToken: newTokens.accessToken };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Invalid or expired refresh token';
      this.logger.error(`Token refresh failed: ${errorMessage}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  //  TOKEN GENERATION
  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

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
      path: '/api/v1/auth/refresh', // must match actual API prefix + endpoint path
      maxAge: refreshMaxAge * 24 * 60 * 60 * 1000,
    });
  }

  //  LOGOUT
  async logout(userId: string, res: Response) {
    try {
      // Revoke all refresh tokens for this user from database
      await this.refreshTokenRepository.delete({ user: { id: userId } });

      this.logger.log(`User logged out: ${userId}`);

      // Clear cookies from response
      res.clearCookie('access_token');
      res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });

      return {
        message: 'Logout successful',
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`Failed to logout user: ${message}`);
      throw new InternalServerErrorException('Logout failed');
    }
  }

  //  UTILITIES
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
