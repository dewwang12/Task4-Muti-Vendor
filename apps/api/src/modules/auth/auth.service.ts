import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole, VendorStatus, DeliveryPartnerStatus } from '@markethub/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('A user with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const role = dto.role || UserRole.CUSTOMER;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          name: dto.name,
          phone: dto.phone,
          role: role as any,
        },
      });

      // If user signed up as vendor, create initial vendor application
      if (role === UserRole.VENDOR) {
        const storeName = dto.storeName || `${dto.name}'s Store`;
        const slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);
        await tx.vendor.create({
          data: {
            userId: user.id,
            storeName,
            slug,
            description: dto.storeDescription,
            businessEmail: user.email,
            businessPhone: dto.phone || '',
            status: VendorStatus.PENDING_APPROVAL as any,
            commissionRateBps: this.configService.get<number>('platform.defaultCommissionBps') || 1000,
          },
        });
      }

      // If user signed up as delivery partner, create initial profile
      if (role === UserRole.DELIVERY_PARTNER) {
        await tx.deliveryPartnerProfile.create({
          data: {
            userId: user.id,
            vehicleType: dto.vehicleType || 'BIKE',
            licenseNumber: dto.licenseNumber || `DL-${Date.now().toString().slice(-6)}`,
            status: DeliveryPartnerStatus.AVAILABLE as any,
          },
        });
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        ...tokens,
      };
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        vendorProfile: true,
        deliveryProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Your account has been suspended by an administrator');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        vendor: user.vendorProfile
          ? {
              id: user.vendorProfile.id,
              storeName: user.vendorProfile.storeName,
              status: user.vendorProfile.status,
              commissionRateBps: user.vendorProfile.commissionRateBps,
            }
          : null,
        deliveryProfile: user.deliveryProfile
          ? {
              id: user.deliveryProfile.id,
              vehicleType: user.deliveryProfile.vehicleType,
              status: user.deliveryProfile.status,
            }
          : null,
      },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const existingToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!existingToken || existingToken.revokedAt || existingToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    // Revoke the old refresh token (Token Family Rotation)
    await this.prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens(
      existingToken.user.id,
      existingToken.user.email,
      existingToken.user.role,
    );
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret') || 'markethub_default_access_secret_2026',
      expiresIn: '15m',
    });

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 900, // 15 mins in seconds
    };
  }
}
