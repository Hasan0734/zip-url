import { IsNotEmpty, IsStrongPassword } from "class-validator";
import { Match } from "src/decorators/match.decorator";

export class ChangePasswordDto {
    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    }, { message: "Password is not strong enough." })
    password!: string;

    @IsNotEmpty({ message: "Please confirm your password." })
    @Match("password", { message: "Confirm password do not match." })
    confirm_password!: string;

}


