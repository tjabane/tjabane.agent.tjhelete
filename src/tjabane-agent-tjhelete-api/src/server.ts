import "dotenv/config";
import { createApp } from "./app";
import { loadAppConfig } from "./config/app-config";

const config = loadAppConfig();
const app = createApp();

app.listen(config.port, () => {
  console.log(`API listening on port ${config.port} in ${config.nodeEnv} mode`);
});
