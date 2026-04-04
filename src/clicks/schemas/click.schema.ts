import mongoose, { HydratedDocument, ObjectId } from 'mongoose';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";


export type ClickDocument = HydratedDocument<Click>;

@Schema({ timestamps: true })
export class Click {

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Url" })
    url_id: mongoose.Types.ObjectId;

    @Prop({ required: true })
    ip_address: string;

    @Prop({ required: true })
    user_agent: string;

    @Prop({ required: true })
    country: string;

    @Prop({ required: true })
    city: string;

    @Prop({ required: true })
    device: string;

    @Prop({ required: true })
    browser: string;

    @Prop({ required: true })
    referrer: string;

}

export const ClickSchema = SchemaFactory.createForClass(Click)


