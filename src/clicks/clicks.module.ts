import { Module } from '@nestjs/common';
import { ClicksService } from './clicks.service';
import { ClicksController } from './clicks.controller';

@Module({
  controllers: [ClicksController],
  providers: [ClicksService],
})
export class ClicksModule {}
