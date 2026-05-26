import mongoose, { HydratedDocument, ObjectId } from 'mongoose';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Url } from 'src/urls/schemas/url.schema';
import { User } from 'src/user/schemas/user.schema';


export type ClickDocument = HydratedDocument<Click>;

@Schema({ timestamps: true })
export class Click {

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Url", required: true, index: true })
    url!: Url

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true })
    owner!: User;

    // persistent identity
    @Prop({
        required: true,
        index: true
    })
    visitorId!: string;

    @Prop()
    ip!: string;

    @Prop()
    country!: string;

    @Prop()
    city!: string;

    @Prop()
    device!: string;

    @Prop()
    browser!: string;

    @Prop()
    os!: string;



}

export const ClickSchema = SchemaFactory.createForClass(Click)


