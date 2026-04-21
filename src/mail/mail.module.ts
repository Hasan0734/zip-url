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
                    port: 2525,
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASSWORD,
                    },
                },
                defaults: {
                    from: process.env.SMTP_EMAIL,
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

