import { Hono } from "hono";
import { fetchAndOrCache } from "./home";
import ky from "ky";

const PORT = 8000;
const app = new Hono();

const backend_url = "localhost:9000";

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
app.get("/show/:id", async (c) => {
  // thIS WILL BE THE SHOW ID ON ANILIST
  const show_id = c.req.param("id");

  // if not number
  if (isNaN(parseInt(show_id))) {
    return c.text("NOT A NUMBER");
  }
  const data: any = await ky.get(`${backend_url}/show/${show_id}`).json();
  return c.json(data, 200);
});

// THIS WILL GET THE EPISODE(from all providers)
// TODO: work in progress
app.get("/show/:id/episode/:num", async (c) => {
  // params
  const show_id = parseInt(c.req.param("id"));
  const episode_num = parseInt(c.req.param("num"));

  // if not number
  if (isNaN(show_id) && isNaN(episode_num)) {
    return c.text("NOT A NUMBER");
  }

  const data: any = await ky
    .get(`${backend_url}/show/${show_id}/episode/${episode_num}`)
    .json();

  return c.json(data, 200);
});

// THIS WILL GET THE EPISODE(from one provider)
app.get("/show/:id/episode/direct/:num", async (c) => {
  // params
  const show_id = parseInt(c.req.param("id"));
  const episode_num = parseInt(c.req.param("num"));

  const { provider, type } = c.req.queries();

  // if no queries(required)
  if (!provider || !type) {
    return c.text("Must include provider and episode type queries!");
  }

  // if not number
  if (isNaN(show_id) && isNaN(episode_num)) {
    return c.text("NOT A NUMBER");
  }

  const data: any = await ky
    .get(
      `${backend_url}/show/${show_id}/episode/direct/${episode_num}?provider=${provider}&type=${type}`
    )
    .json();

  return c.json(data, 200);
});

// returns episode list
// TODO: add query params for pagination
app.get("/show/:id/list", async (c) => {
  const show_id = parseInt(c.req.param("id"));
  const page = c.req.query("page") || 1;
  let limit = c.req.query("limit");

  if (isNaN(show_id)) return c.text("NOT A NUMBER");

  const data: any = await ky.get(`${backend_url}/show/${show_id}/list`).json();
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
