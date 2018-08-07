import * as crypto from "crypto";

export const hashPassword = (password) => {
    let hash = crypto.createHmac("sha512", process.env.PASSWORD_SALT);
    hash.update(password);
    const value = hash.digest('hex');

    return value;
};
