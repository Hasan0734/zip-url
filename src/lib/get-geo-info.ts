import axios from "axios"

export const getGeoData = async (ip: string) => {
    if (ip === '::1' || '127:0.0.1') {
        const res = await axios(`http://ip-api.com/json/`)
        return res.data;
    }
    const res = await axios(`http://ip-api.com/json/${ip}`);
    return res.data;
}