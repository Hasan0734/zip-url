import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UrlDocument = HydratedDocument<Url>;

@Schema({ timestamps: true })
export class Url {
    @Prop({ required: true, })
    original_url: string;

    @Prop({ required: false, unique: true })
    custom_alias: string;

    @Prop({ requireed: false })
    password: string;

    @Prop({ required: false })
    expires_at: Date;

    @Prop({ required: true, default: true })
    isActive: boolean;

    @Prop({ required: true, unique: true })
    short_code: string;

}


export const UrlSchema = SchemaFactory.createForClass(Url)