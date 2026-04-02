import { PartialType } from '@nestjs/mapped-types';
import { CreateClickDto } from './create-click.dto';

export class UpdateClickDto extends PartialType(CreateClickDto) {}
