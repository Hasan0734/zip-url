import mongoose, { HydratedDocument, ObjectId } from 'mongoose';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Url } from 'src/urls/schemas/url.schema';
import { User } from 'src/user/schemas/user.schema';


export type ClickDocument = HydratedDocument<Click>;

@Schema({ timestamps: true })
export class Click {

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Url" })
    url: Url

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

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User" })
    owner: User;

}

export const ClickSchema = SchemaFactory.createForClass(Click)


