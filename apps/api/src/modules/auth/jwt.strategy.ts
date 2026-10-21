import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UserContext } from '@markethub/shared';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret') || 'markethub_default_access_secret_2026',
    });
  }

  async validate(payload: any): Promise<UserContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        vendorProfile: {
          select: { id: true, status: true, storeName: true },
        },
        deliveryProfile: {
          select: { id: true, status: true },
        },
      },
    });

    if (!user || user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
      throw new UnauthorizedException('User account is invalid or suspended');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as any,
      name: user.name,
      vendorId: user.vendorProfile?.id,
      deliveryPartnerId: user.deliveryProfile?.id,
    };
  }
}
