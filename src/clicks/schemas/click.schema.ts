import mongoose, { HydratedDocument, ObjectId } from 'mongoose';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";


export type ClickDocument = HydratedDocument<Click>;

@Schema({ timestamps: true })
export class Click {

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Url" })
    url_id: mongoose.Types.ObjectId;

    @Prop()
    ip: string;

    @Prop()
    country: string;

    @Prop()
    city: string;

    @Prop()
    device: string;

    @Prop()
    browser: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Url" })
    owner_id: mongoose.Types.ObjectId;

}

export const ClickSchema = SchemaFactory.createForClass(Click)


