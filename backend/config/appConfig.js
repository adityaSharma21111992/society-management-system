import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_SOCIETY_NAME = 'Orion Pride Society';

const appConfig = {
  societyName: process.env.SOCIETY_NAME || DEFAULT_SOCIETY_NAME,
};

export default appConfig;
