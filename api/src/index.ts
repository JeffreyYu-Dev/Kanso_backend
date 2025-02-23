import { Hono } from "hono";
import { fetchAndOrCache } from "./home";
import { cors } from "hono/cors";
import mongoose from "./mongodb";
import { get_episode, get_show } from "./utils/assembleShow";

const PORT = 8000;
const app = new Hono();

// create connection to database
async function start() {
  const mongoose_connection_url: string = "mongodb://127.0.0.1:27017/kanso";

  await mongoose
    .connect(mongoose_connection_url)
    .then(() => {
      console.log("Connected to db!");
    })
    .catch(() => {
      console.log(
        "NOT CONNECTED TO DB!!!!!!!(could be because i forgot to start mongodb oops"
      );
    });
}
start();

// HOME
app.get("/", (c) => {
  return c.text(`Kanso api : D`);
});

// trending route
app.get("/trending", async (c) => {
  const data = await fetchAndOrCache("trending");
  return c.json({ data: data }, 200);
});

// latest aired route
app.get("/latest-aired", async (c) => {
  const data = await fetchAndOrCache("latestAired");
  return c.json({ data: data }, 200);
});

// upcoming route
app.get("/upcoming", async (c) => {
  const data = await fetchAndOrCache("upcoming");
  return c.json({ data: data }, 200);
});

// top airing route
app.get("/top-airing", async (c) => {
  const data = await fetchAndOrCache("topAiring");
  return c.json({ data: data }, 200);
});

// THIS WILL GET THE SHOW
app.get("/show/:showId", async (c) => {
  // thIS WILL BE THE SHOW ID ON ANILIST
  const id = c.req.param("showId");

  // if not number
  if (isNaN(parseInt(id))) {
    return c.text("NOT A NUMBER");
  }
  const data = await get_show(parseInt(id));

  return c.json(data, 200);
});

// THIS WILL GET THE EPISODE
app.get("/show/:showId/episode/:episodeNumber", async (c) => {
  const show_id = parseInt(c.req.param("showId"));
  const episode_number = parseInt(c.req.param("episodeNumber"));

  // if not number
  if (isNaN(show_id) && isNaN(episode_number)) {
    return c.text("NOT A NUMBER");
  }

  const data = await get_episode(show_id, episode_number);

  return c.json(data, 200);
});

// testing stuff
app.get("/test", async (c) => {
  return c.json({ title: "shows i've watched" }, 200);
});

export default {
  port: PORT,
  fetch: app.fetch,
};
