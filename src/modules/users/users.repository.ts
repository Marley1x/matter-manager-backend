import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, User } from '@prisma/client';
import { EmailService } from 'src/services/email.service';

@Injectable()
export class UserRepository {
  constructor(
    private readonly prismaClient: PrismaClient,
    private readonly emailService: EmailService,
  ) {}

  findActiveByUsername(username: string): Promise<User> {
    return this.prismaClient.user.findFirst({
      where: { username, deletedAt: null },
    });
  }

  findAll(): Promise<User[]> {
    return this.prismaClient.user.findMany();
  }

  create(userData: Prisma.UserCreateInput): Promise<User> {
    return this.prismaClient.user.create({ data: userData });
  }

  update(userId: string, userData: Prisma.UserUpdateInput): Promise<User> {
    return this.prismaClient.user.update({
      where: { id: userId },
      data: userData,
    });
  }

  async delete(userId: string): Promise<User> {
    await this.emailService.send();
    return this.prismaClient.user.update({
      where: { id: userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
