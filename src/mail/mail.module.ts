import { Module } from '@nestjs/common';
import { MailerModule } from "@nestjs-modules/mailer"
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { MailService } from './mail.service';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';


@Module({
    imports: [
        ConfigModule.forRoot(),
        MailerModule.forRootAsync({
            useFactory: async () => ({
                transport: {
                    host: process.env.SMPT_HOST,
                    port: 1025,
                    secure: false,
                    ignoreTLS: true,
                },
                defaults: {
                    from: '"No replay" <no-replay@zipurl.com>',
                },
                template: {
                    dir: join(__dirname, "./templates"),
                    adapter: new HandlebarsAdapter(),

                },
            })
        })
    ],
    providers: [MailService],
    exports: [MailService]
})
export class MailModule { }
