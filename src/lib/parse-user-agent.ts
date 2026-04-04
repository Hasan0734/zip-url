import { UAParser } from "ua-parser-js";


export const parseUserAgent = (ua: string) => {
    const parser = new UAParser(ua);
    const r = parser.getResult();

    return {
        device_type: r.device.type ?? "desktop",
        os: r.os.name?.toLowerCase() ?? "unknown",
        os_version: r.os.version ?? null,
        browser: r.browser.name?.toLowerCase() ?? "unknown",
        browser_version: r.browser.version ?? null,
        isBot: /bot|crawler|spider|crawling/i.test(ua),
    };

}