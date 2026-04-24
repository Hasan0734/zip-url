import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { TokenType } from "src/auth/enum/tokentype.enum";

export type TokensDocument = HydratedDocument<Tokens>;

@Schema({ timestamps: true })
export class Tokens {
    @Prop({ required: true })
    token!: string          //hashed

    @Prop({ required: true })
    type!: TokenType

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user_id?: Types.ObjectId

    @Prop({ type: Date, required: true })
    expires_at!: Date
}

export const TokensSchema = SchemaFactory.createForClass(Tokens);

TokensSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 })


