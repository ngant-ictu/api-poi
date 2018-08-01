import * as convict from "convict";
import * as dotenv from "dotenv";
import * as yaml from "js-yaml";

const dotLoad = dotenv.config({ path: `.${process.env.NODE_ENV}.env` });
if (dotLoad.error) {
    throw dotLoad.error;
}

convict.addParser({ extension: ["yml", "yaml"], parse: yaml.safeLoad });
const schema = convict({});

export const config = schema.loadFile(`${process.cwd()}/src/appconfig.yml`);
