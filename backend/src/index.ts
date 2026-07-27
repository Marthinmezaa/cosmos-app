import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Cosmostrak API escuchando en el puerto ${env.PORT} (${env.NODE_ENV})`);
});
