import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClickDto } from './dto/create-click.dto';
import { Click } from './schemas/click.schema';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class ClicksService {

  constructor(@InjectModel(Click.name) private clickModel) { }

  async create(createClickDto: CreateClickDto) {
    try {
      const result = await this.clickModel.create(createClickDto)
      return result;

    } catch (error) {
      throw error;
    }
  }

  async findAll(owner_id: string, url_id?: string) {
    try {
      const result = await this.clickModel.find({ $or: [{ owner_id }, { url_id }] }).exec()
      return result;
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const result = await this.clickModel.findOne({ _id: id }).exec()

      if (!result) {
        throw new NotFoundException()
      }
      return result;
    } catch (err) {
      const error = err as { kind?: string }

      if (error.kind === "ObjectId") {
        throw new NotFoundException({ message: "Invalid _id", status: 404 })
      }
      throw error;
    }
  }
}
