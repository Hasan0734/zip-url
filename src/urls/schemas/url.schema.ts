import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type UrlDocument = HydratedDocument<Url>;

@Schema({ timestamps: true })
export class Url {
    @Prop({ required: true, })
    original_url: string;

    @Prop({ unique: true, sparse: true, default: undefined })
    custom_alias: string;

    @Prop({ default: undefined })
    password: string;

    @Prop({ required: false, default: undefined })
    expires_at: Date;

    @Prop({ required: true, default: true })
    is_active: boolean;

    @Prop({ required: true, unique: true })
    short_code: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User" })
    owner_id: mongoose.Types.ObjectId;

}


export const UrlSchema = SchemaFactory.createForClass(Url)