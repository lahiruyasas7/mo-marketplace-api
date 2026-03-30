import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterUserDto } from './dto/register-user.dto';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { LoginUserDto } from './dto/login-user.dto';

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
    @Req() req: Request,
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
}
