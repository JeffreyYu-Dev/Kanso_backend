import { Hono } from "hono";
import mongoose from "./mongoDB";

import assemble from "./assemble";

const PORT = 9000;

const app = new Hono();

const assembler = new assemble();

app.get("/", (c) => {
  return c.json(
    { show: "*/show/:id", episode: "*/show/:showID/episode/:episode_num" },
    200
  );
});

async function start() {
  const mongoose_connection_url: string = "mongodb://127.0.0.1:27017/kanso";

  // connect to mongoose
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

// show route
app.get("/show/:id", async (c) => {
  // get id from uri
  const show_id = c.req.param("id");

  // check if id is a number
  if (isNaN(parseInt(show_id))) {
    return c.text("id is not a number");
  }

  // get show
  const data = await assembler.get_show_details(parseInt(show_id));
  return c.json(data, 200);
});

// TODO: work in progress
app.get("/show/:id/episode/:num", async (c) => {
  const show_id = c.req.param("id");
  const episode_num = c.req.param("num");

  // check if id is a number
  if (isNaN(parseInt(show_id)) && isNaN(parseInt(episode_num))) {
    return c.text("id is not a number");
  }

  // build episode

  // return c.json(data, 200);
  return c.json({ msg: "work in progess" }, 200);
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

  const data = await assembler.directly_add_episode({
    show_id: show_id,
    episode_num: episode_num,
    provider: provider[0],
    episode_type: type[0],
  });

  return c.json(data, 200);
});

// todo: fix ts
app.get("/show/:id/list", async (c) => {
  const show_id = c.req.param("id") || "";

  // if not number
  if (isNaN(parseInt(show_id))) {
    return c.text("NOT A NUMBER");
  }

  const data = await assembler.get_episode_list({
    show_id: parseInt(show_id),
    page: 1,
    limit: 1,
  });
  return c.json(data, 200);
});

export default {
  port: PORT,
  fetch: app.fetch,
};
