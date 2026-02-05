import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { bootstrap } from "./bootstrap";

async function run() {
  console.log("Starting debug_main...");
  try {
    // @ts-expect-error
    const app = await NestFactory.create(AppModule, {
      logger: ["log", "error", "warn", "debug", "verbose"],
      bufferLogs: false,
    });
    console.log("App created.");

    bootstrap(app);
    console.log("App bootstrap done. Initializing...");

    await app.init();
    console.log("App init done. Listening...");

    const port = process.env.API_PORT || 5555;
    await app.listen(port, "0.0.0.0");
    console.log(`Application started locally on port: ${port}`);
  } catch (error) {
    console.error("Application crashed", error);
  }
}

run();
