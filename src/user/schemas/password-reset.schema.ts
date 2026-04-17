import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Role } from "src/auth/role.enum";

export type PasswordResetDocument = HydratedDocument<PasswordReset>;

@Schema({ timestamps: true })
export class PasswordReset {
    @Prop({ required: true })
    token!: string

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user_id?: Types.ObjectId

    @Prop({ type: Date, default: Date.now(), expires:  300}) //3600
    createdAt!: Date;
}

export const PasswordResetSchema = SchemaFactory.createForClass(PasswordReset)
