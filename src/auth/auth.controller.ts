import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from 'src/common/decorators/public.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { RegisterUserDto } from './dto/register-user.dto';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { LoginUserDto } from './dto/login-user.dto';
import { GetUser } from 'src/common/decorators/user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiOperation({
    summary: 'User Register',
  })
  @Post('register/user')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 req/min
  async registerUser(
    @Body() registerCustomerDto: RegisterUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.registerUser(registerCustomerDto, res);
  }

  /**
   * POST /auth/login
   * Rate limited: 10 requests per minute per IP (brute-force protection)
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'login a user' })
  @ApiResponse({ status: 409, description: 'Invalid password' })
  @ApiBody({ type: LoginUserDto })
  async login(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.loginUser(dto, res);
  }

  /**
   * GET /auth/me
   * Protected — requires valid access_token cookie
   * Returns the currently authenticated user's profile
   * @GetUser() pulls userId from the JWT payload attached by JwtAuthGuard
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth('cookie-auth') // tells Swagger this endpoint needs the cookie
  @ApiOperation({
    summary: 'Get All User Details for logged user',
  })
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@GetUser('userId') userId: string) {
    return this.authService.getMe(userId);
  }

  ////refresh token //////////
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 req/min (less strict than login)
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiCookieAuth('cookie-auth')
  @ApiResponse({ status: 200, description: 'New access token issued' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refreshTokens(req, res);
  }

  /**
   * POST /auth/logout
   * Protected — requires valid access_token cookie
   * Revokes all refresh tokens for the user and clears auth cookies
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth('cookie-auth')
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 req/min
  @ApiOperation({ summary: 'Logout current user and revoke all tokens' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @GetUser('userId') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.logout(userId, res);
  }
}
