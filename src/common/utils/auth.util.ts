import * as crypto from 'crypto'

export const handleHash = (item: string) => {
    return crypto.createHash('sha256').update(item).digest('hex')
}

export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit
}

export const generatePayload = (user) => {
    const payload = {
        sub: user._id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_verified: user.is_verified
    }

    return payload;
}