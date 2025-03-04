import aggregator from "./aggregator";

// models
import show_model from "./model/show";
import episode_list_model from "./model/episode_list";
import episode_model from "./model/episode";

// TODO: add episode
type TAdd_episode = {
  show_id: number;
  episode_num: number;
  provider: string;
  subbed: boolean;
};

export default class assemble {
  aggregator = new aggregator();

  // THIS SECTION WILL BUILD SHOW
  //------------------------------------------------------------------

  async get_show_details(show_id: number) {
    // query database for show
    const show_res = await show_model.findOne({
      "external_id.anilist": show_id.toString(),
    });

    // if show exists return data
    if (show_res) {
      console.log(`getting anime ${show_id} from database `);
      return show_res;
    }

    // get data
    const show_data = await this.aggregator.aggregate_show(show_id);

    // if there is no show data
    if (!show_data) return null;

    // if there is show data
    // 1. save to data to database
    await show_model.create(show_data);

    return show_data;
  }

  // get the episode list from show
  // todo: add pagination
  async get_episode_list({
    show_id,
    page,
    limit,
  }: {
    show_id: number;
    page: number;
    limit: number;
  }) {
    // get episode list
    const episode_list = await episode_list_model
      .findOne({ show_id: show_id })
      .populate({ path: "providers.aniwatch.sub._id", model: episode_model })
      .exec();

    // if the show doesn't exist yet (so no episode list than)
    if (!episode_list) {
      await this.get_show_details(show_id);
      return await episode_list_model.findOne({ show_id: show_id });
    }

    return episode_list;
  }

  // add episode from all providers?
  // TODO: ts too complicated for me rn
  // !important this function is used by the bot
  // TODO: NOT GOOD NEEDS REWORK
  async add_episode({ show_id, episode_num, provider, subbed }: TAdd_episode) {
    // first we need to check if the episode exists

    // get episode list
    const episode_list = await this.get_episode_list({
      show_id: show_id,
      page: 1,
      limit: 1,
    });

    // check latest episode stored in database
    // TODO: im not really sure what to do here, since episode list will for sure exist
    if (!episode_list) return null;

    // check if latest_episode_in_database is not null
    // null means there have been no episodes added
    if (!episode_list.latest_episode_in_database) return "no episodes";

    // if episode is in database already
    if (episode_list.latest_episode_in_database <= episode_num)
      return "episode in database";

    //add episode now

    // we need to know if all providers have the episode of the subbed and dubbed version
  }

  // get dubbed or subbed episode from show from specific provider
  // TODO: check if episode is in database already
  async direct_add_episode(params: {
    show_id: number;
    episode_num: number;
    provider: string;
    episode_type: string;
  }) {
    // check if episode exists
    // const episode_in_database = await episode.find()

    // first check if we have show
    const show = show_model.findOne({ "external_id.anilist": params.show_id });

    // build show if it doesn't exist
    if (!show) await this.aggregator.aggregate_show(params.show_id);

    // then add episode
    const episode: any = await this.aggregator.get_direct_episode(params);

    // TODO: FIX THIS
    // // update episode count
    // const currentList = await episode_list_model.findOne({ params.show_id });
    // const currentLatest = currentList?.latest_episode_in_database || 0;

    // add episode to episode collection
    await episode_model.create(episode);

    // add episode to show's episode list
    await episode_list_model.findOneAndUpdate(
      { show_id: params.show_id },
      {
        // $set: {

        // },
        $set: {
          // latest_episode_in_database: Math.max(currentLatest, params.episode_num),
          // [`providers.${params.provider}.total_episodes`]: Math.max(
          //   currentLatest,
          //   params.episode_num
          // ),
          [`providers.${params.provider}.${params.episode_type}`]: {
            _id: episode._id,
          },
        },
      },
      { new: true }
    );

    return episode;
  }
}
