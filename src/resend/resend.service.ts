import { Inject, Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class ResendService {

    private resend = new Resend(process.env.RESEND_API_KEY);

    async sendWelcomeEmail(to: string) {
        return await this.resend.emails.send({
            from: process.env.EMAIL_FROM!,
            to,
            subject: 'Welcome',
            html: `
        <h1>Welcome to our app</h1>
        <p>Your account created successfully.</p>
      `,
        });
    }
}
