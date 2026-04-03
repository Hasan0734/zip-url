import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UrlsModule } from './urls/urls.module';
import { ClicksModule } from './clicks/clicks.module';
import { RedirectModule } from './redirect/redirect.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.DATABASE_URI as string),
    AuthModule,
    UserModule,
    ClicksModule,
    UrlsModule,
    RedirectModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
