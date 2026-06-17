import { Global, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit,OnModuleDestroy {
    
    constructor() {
        if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing');
}
        const adapter = new PrismaPg(
            {connectionString: process.env.DATABASE_URL!}
        );
        super({
            adapter,
            log: ['query', 'error', 'warn', 'info'],
        });
        
        
    }
    
    async onModuleInit() {
        await this.$connect();
        console.log('Prisma Client connected');
        
    }
    async onModuleDestroy() {
        await this.$disconnect();
        console.log('Prisma Client disconnected');
    }

    async cleanCatabase() {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Cannot clean database in production');
        }   
        const models = Reflect.ownKeys(this).filter(key => typeof key  === 'string' && !key.startsWith('_') );
        return Promise.all(models.map(model => {
            if (typeof model === 'string') {
                return this[model].deleteMany({});
            }
        }));
    }
}
