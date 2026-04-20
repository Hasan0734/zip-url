import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { TokenType } from "src/auth/tokentype.enum";

export type TokensDocument = HydratedDocument<Tokens>;

@Schema({ timestamps: true })
export class Tokens {
    @Prop({ required: true })
    token!: string          //hashed

    @Prop({ required: true })
    type!: TokenType

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user_id?: Types.ObjectId

    @Prop({ type: Date, default: Date.now(), expires: 3600 }) //3600
    expires_at!: Date
}

export const TokensSchema = SchemaFactory.createForClass(Tokens)


