import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { MailDto } from './dto/mail.dto';

@Injectable()
export class MailService {

    constructor(private readonly mailerService: MailerService) { }

    async sendEmail(mailDto: MailDto) {
        console.log(mailDto)

        try {
            await this.mailerService.sendMail(mailDto);

            return { status: 'success', message: "Mail was sent" }
        } catch (error) {
            console.log(error)
        }

    }
}
