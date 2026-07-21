import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { AppException } from '../common/exceptions/app.exception';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type SafeUser = Pick<User, 'id' | 'name' | 'email' | 'role' | 'createdAt'>;

type SessionResult = {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  user: SafeUser;
};

type RefreshPayload = {
  sub: string;
  jti: string;
  familyId: string;
  type: 'refresh';
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<SessionResult> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppException('EMAIL_ALREADY_IN_USE', 'Este e-mail já está cadastrado.', HttpStatus.CONFLICT);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        passwordHash: await argon2.hash(dto.password, { type: argon2.argon2id }),
        role: Role.CUSTOMER,
        cart: { create: {} },
      },
    });

    return this.issueSession(user);
  }

  async login(dto: LoginDto): Promise<SessionResult> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.trim().toLowerCase() } });
    if (!user || !user.isActive || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new AppException('INVALID_CREDENTIALS', 'E-mail ou senha inválidos.', HttpStatus.UNAUTHORIZED);
    }
    return this.issueSession(user);
  }

  async refresh(rawToken?: string): Promise<SessionResult> {
    if (!rawToken) throw new AppException('REFRESH_TOKEN_REQUIRED', 'Sessão de renovação não encontrada.', HttpStatus.UNAUTHORIZED);

    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(rawToken, { secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET') });
      if (payload.type !== 'refresh') throw new Error('Invalid token type');
    } catch {
      throw new AppException('INVALID_REFRESH_TOKEN', 'A sessão não pode ser renovada.', HttpStatus.UNAUTHORIZED);
    }

    const stored = await this.prisma.refreshToken.findUnique({ where: { id: payload.jti }, include: { user: true } });
    if (!stored || stored.userId !== payload.sub || stored.expiresAt <= new Date()) {
      throw new AppException('INVALID_REFRESH_TOKEN', 'A sessão não pode ser renovada.', HttpStatus.UNAUTHORIZED);
    }

    const tokenMatches = await argon2.verify(stored.tokenHash, rawToken).catch(() => false);
    if (!tokenMatches) {
      await this.revokeFamily(payload.familyId);
      throw new AppException('TOKEN_REUSE_DETECTED', 'A sessão foi encerrada por segurança.', HttpStatus.UNAUTHORIZED);
    }

    if (stored.revokedAt) {
      await this.revokeFamily(payload.familyId);
      throw new AppException('TOKEN_REUSE_DETECTED', 'A sessão foi encerrada por segurança.', HttpStatus.UNAUTHORIZED);
    }

    if (!stored.user.isActive) throw new AppException('USER_DISABLED', 'Usuário desativado.', HttpStatus.FORBIDDEN);

    const next = await this.issueSession(stored.user, payload.familyId);
    const nextPayload = this.jwt.decode(next.refreshToken) as RefreshPayload;
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date(), replacedByTokenId: nextPayload.jti } });
    return next;
  }

  async logout(rawToken?: string): Promise<void> {
    if (!rawToken) return;
    try {
      const payload = await this.jwt.verifyAsync<RefreshPayload>(rawToken, { secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'), ignoreExpiration: true });
      await this.prisma.refreshToken.updateMany({ where: { id: payload.jti, revokedAt: null }, data: { revokedAt: new Date() } });
    } catch {
      return;
    }
  }

  async me(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true, createdAt: true, isActive: true } });
    if (!user || !user.isActive) throw new AppException('USER_NOT_FOUND', 'Usuário não encontrado.', HttpStatus.NOT_FOUND);
    const { isActive: _isActive, ...safe } = user;
    return safe;
  }

  private async issueSession(user: User, familyId = randomUUID()): Promise<SessionResult> {
    const csrfToken = randomUUID();
    const accessMinutes = this.config.get<number>('ACCESS_TOKEN_MINUTES') ?? 15;
    const refreshDays = this.config.get<number>('REFRESH_TOKEN_DAYS') ?? 7;
    const refreshId = randomUUID();

    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role, csrf: csrfToken },
      { secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'), expiresIn: accessMinutes * 60 },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, jti: refreshId, familyId, type: 'refresh' },
      { secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'), expiresIn: refreshDays * 24 * 60 * 60 },
    );

    await this.prisma.refreshToken.create({
      data: {
        id: refreshId,
        familyId,
        userId: user.id,
        tokenHash: await argon2.hash(refreshToken, { type: argon2.argon2id }),
        expiresAt: new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      csrfToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    };
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({ where: { familyId, revokedAt: null }, data: { revokedAt: new Date() } });
  }
}
