import { Hono } from "hono";
import { assemble } from "./assemble";
import mongoose from "./mongoDB";

const PORT = 9000;

const app = new Hono();

const assembler = new assemble();

app.get("/", (c) => {
  return c.json(
    { show: "*/show/:id", episode: "*/show/:showID/episode/:episodeID" },
    200
  );
});

// async function start() {
//   const mongoose_connection_url: string = "mongodb://127.0.0.1:27017/kanso";

//   // connect to mongoose
//   await mongoose
//     .connect(mongoose_connection_url)
//     .then(() => {
//       console.log("Connected to db!");
//     })
//     .catch(() => {
//       console.log(
//         "NOT CONNECTED TO DB!!!!!!!(could be because i forgot to start mongodb oops"
//       );
//     });
// }
// start()

// show route
app.get("/show/:showId", async (c) => {
  // get id from uri
  const id = c.req.param("showId");

  // check if id is a number
  if (isNaN(parseInt(id))) {
    return c.text("id is not a number");
  }

  // build show
  const data = await assembler.build_show(parseInt(id));

  // return data
  return c.json(data, 200);
});

app.get("/show/:showId/episode/:episodeId", async (c) => {
  const show_id = c.req.param("showId");
  const episode_id = c.req.param("episodeId");

  // check if id is a number
  if (isNaN(parseInt(show_id)) && isNaN(parseInt(episode_id))) {
    return c.text("id is not a number");
  }

  // build episode
  const data = await assembler.build_episode(
    parseInt(show_id),
    parseInt(episode_id)
  );

  return c.json(data, 200);
});

export default {
  port: PORT,
  fetch: app.fetch,
};
