import "dotenv/config";
import { createApplication } from "./composition/create-application";
import { loadAppConfig } from "./config/app-config";

const application = createApplication(loadAppConfig());

application.app.listen(application.config.port, () => {
  console.log(
    `API listening on port ${application.config.port} in ${application.config.nodeEnv} mode`,
  );
});
