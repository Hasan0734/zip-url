import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Role } from "src/auth/role.enum";

export type UserDocument = HydratedDocument<User>;

@Schema({timestamps: true})
export class User {
    @Prop({ required: true })
    first_name!: string;

    @Prop({ required: true })
    last_name!: string;

    @Prop({ required: true, unique: true })
    email!: string;

    @Prop({ required: true })
    password!: string;

    @Prop({ default: Role.User })
    role!: string

}

export const UserSchema = SchemaFactory.createForClass(User)
