import mongoose, { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema } from "mongoose";

export type UrlDocument = HydratedDocument<Url>;

@Schema({ timestamps: true })
export class Url {
    @Prop({ required: true, trim: true })
    original_url!: string;

    @Prop({ unique: true, sparse: true, default: undefined, trim: true })
    custom_alias!: string;

    @Prop({ default: undefined, trim: true })
    password!: string;

    @Prop({ required: false, default: undefined })
    expires_at!: Date;

    @Prop({ required: true, default: true })
    is_active!: boolean;


    @Prop({ required: true, unique: true, trim: true })
    short_code!: string;

    @Prop({ default: 0 })
    click_count!: number;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true })
    owner_id!: MongooseSchema.Types.ObjectId;

    @Prop({ required: true })
    owner_name!: string
}

export const UrlSchema = SchemaFactory.createForClass(Url)

