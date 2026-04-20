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