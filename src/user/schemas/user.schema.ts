import { Prop, Schema, SchemaFactory, Virtual } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Role } from "src/auth/enum/role.enum";
import { Status } from "src/auth/enum/status.enum";

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class User {
    @Prop({ required: true, trim: true })
    first_name!: string;

    @Prop({ required: true, trim: true })
    last_name!: string;

    @Prop({ required: true, unique: true, trim: true, lowercase: true })
    email!: string;

    @Prop({ required: true, trim: true })
    password!: string;

    @Prop({ default: false })
    is_verified!: boolean

    @Prop({ default: false })
    two_factor_enabled!: boolean

    @Prop({ default: Role.User })
    role!: string

    @Prop({ default: Status.PENDING })
    status!: string

    @Virtual({
        options: {
            ref: "Url",
            localField: "_id",
            foreignField: "owner_id",
            count: true
        }
    })
    totalLink!: number

}



export const UserSchema = SchemaFactory.createForClass(User)



// UserSchema.virtual('totalLink', {
//     ref: 'Url',            // Make sure this matches the string name of your Url model exactly
//     localField: '_id',
//     foreignField: 'owner_id',
//     count: true            // Tells Mongoose to return an integer count instead of an array
// });