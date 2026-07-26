import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CookieOptions, Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  @Post('register')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @ApiOperation({ summary: 'Criar uma conta de cliente' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.register(dto);
    this.setSessionCookies(response, session.accessToken, session.refreshToken);
    return { csrfToken: session.csrfToken, user: session.user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @ApiOperation({ summary: 'Entrar no sistema' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.login(dto);
    this.setSessionCookies(response, session.accessToken, session.refreshToken);
    return { csrfToken: session.csrfToken, user: session.user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.refresh(request.cookies?.refresh_token as string | undefined);
    this.setSessionCookies(response, session.accessToken, session.refreshToken);
    return { csrfToken: session.csrfToken, user: session.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<void> {
    await this.auth.logout(request.cookies?.refresh_token as string | undefined);
    response.clearCookie('access_token', { path: '/' });
    response.clearCookie('refresh_token', { path: '/' });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  async me(@CurrentUser('sub') userId: string, @CurrentUser('csrf') csrfToken: string) {
    return { user: await this.auth.me(userId), csrfToken };
  }

  private setSessionCookies(response: Response, accessToken: string, refreshToken: string): void {
    const secure = this.config.get<string>('COOKIE_SECURE') === 'true';
    const sameSite = (this.config.get<string>('COOKIE_SAME_SITE') ?? 'lax') as CookieOptions['sameSite'];
    const common: CookieOptions = { httpOnly: true, secure, sameSite, path: '/' };
    const accessMinutes = this.config.get<number>('ACCESS_TOKEN_MINUTES') ?? 15;
    const refreshDays = this.config.get<number>('REFRESH_TOKEN_DAYS') ?? 7;
    response.cookie('access_token', accessToken, { ...common, maxAge: accessMinutes * 60 * 1000 });
    response.cookie('refresh_token', refreshToken, { ...common, maxAge: refreshDays * 24 * 60 * 60 * 1000 });
  }
}
