import show from "../model/show";
import episode from "../model/episode";
import ky from "ky";

const baseUrl = "localhost:9000";

// grab all episodes
async function get_all_details(show_id: Number) {
  return await show
    .findOne({ "external_id.anilist": show_id.toString() })
    .populate("episodes.data.aniwatch.subbed")
    .exec();
}

// NEED TO CHECK IF SHOW EXIST BEFORE GETTING FROM SOURCE
export async function get_show(show_id: number) {
  // check if show exist
  const res: any = await get_all_details(show_id);

  // if data exist return data
  // TODO: we need to check if the show is still airing and update the current number of episodes
  // and update the database
  if (res) {
    console.log("Retrieved show from database");

    const nextAiringEpisode = res.airing_schedule;

    // calculate the # of episodes currently (this is used for airing shows)
    if (nextAiringEpisode) {
      res.episodes.current = nextAiringEpisode.episode - 1;
    } else {
      res.episodes.current = res.episodes.total;
    }

    // update database
    await show.findOneAndUpdate(
      { "external_id.anilist": show_id.toString() },
      { $set: { "episodes.current": res.episodes.current } }
    );

    return res;
  }

  // else ...
  // get data from source
  const data = await ky.get(`${baseUrl}/show/${show_id.toString()}`).json();

  // if there is no data
  // TODO: make this better
  if (!data) return "NO DATA FOUND WTF";

  // add this data into mongo
  const series = new show(data);
  await series.save().then(() => {
    console.log(`Successfully added show ${show_id.toString()}`);
  });

  return data;
}

// TODO: add other servers and subbed and dubbed
export async function get_episode(show_id: number, episode_number: number) {
  // make sure the show exists
  await get_show(show_id);

  const res = await get_all_details(show_id).then(
    (res: any) => res.episodes.data
  );

  // IF WE HAVE DATA
  if (res) {
    const ep = res.aniwatch.subbed.find(
      (ep: any) => ep.number == episode_number
    );

    // if we have the episode
    if (ep) return ep;
  }
  // else...
  // create episode and upload to database and send to user

  const data = await ky
    .get(
      `${baseUrl}/show/${show_id.toString()}/episode/${episode_number.toString()}`
    )
    .json();

  // add episode to database
  const ep = await episode.create(data);

  // link episode
  await show.findOneAndUpdate(
    { "external_id.anilist": show_id.toString() },
    {
      $push: {
        "episodes.data.aniwatch.subbed": ep._id,
      },
    }
  );

  return ep;
}
