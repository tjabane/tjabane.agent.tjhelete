import "dotenv/config";
import { createApplication } from "./composition/create-application";
import { loadAppConfig } from "./config/app-config";

const application = createApplication(loadAppConfig());

const server = application.app.listen(application.config.port, () => {
  console.log(
    `API listening on port ${application.config.port} in ${application.config.nodeEnv} mode`,
  );
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    server.close(() => {
      void application.dispose().finally(() => process.exit(0));
    });
  });
}
