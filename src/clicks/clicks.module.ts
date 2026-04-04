import { Module } from '@nestjs/common';
import { ClicksService } from './clicks.service';
import { ClicksController } from './clicks.controller';

@Module({
  controllers: [ClicksController],
  providers: [ClicksService],
  exports: [ClicksService]
})
export class ClicksModule {}
