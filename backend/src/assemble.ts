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

type TEpisode_list = {
  show_id: number;
  total_episodes: number;
  latest_episodes_in_database: number;
  [key: string]: unknown;
  providers: {
    aniwatch: {
      sub: string[];
      dub: string[];
    };
    gogoanime: {
      sub: string[];
      dub: string[];
    };
  };
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
    const episode_list = await episode_list_model
      .findOne({ show_id: show_id })
      .populate({
        path: "providers.aniwatch.sub",
        model: episode_model,
        options: {
          sort: { number: 1 }, // Sort the populated episodes by number in descending order
        },
      })
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
  async directly_add_episode(params: {
    show_id: number;
    episode_num: number;
    provider: string;
    episode_type: string;
  }) {
    // check if episode exists
    const episode_list: any = await this.get_episode_list({
      show_id: params.show_id,
      page: 1,
      limit: 1,
    });

    const episode_ = episode_list.providers[params.provider][
      params.episode_type
    ].find((episode: any) => episode.number == params.episode_num);

    if (episode_) {
      if (episode_.number == params.episode_num) {
        console.log("EPISODE IS ALREADY ADDED");
        return episode_;
      }
    }

    // first check if we have show
    const show_res = show_model.findOne({
      "external_id.anilist": params.show_id,
    });

    // build show if it doesn't exist
    if (!show_res) await this.aggregator.aggregate_show(params.show_id);

    // then get episode
    const aggregated_episode: any = await this.aggregator.get_direct_episode(
      params
    );

    // TODO: FIX THIS
    // TODO: work on episode total and currnet
    await episode_model.create(aggregated_episode);

    // add episode to show's episode list
    await episode_list_model.findOneAndUpdate(
      { show_id: params.show_id },
      {
        $addToSet: {
          [`providers.${params.provider}.${params.episode_type}`]:
            aggregated_episode._id,
        },
      },
      { new: true }
    );

    return aggregated_episode;
  }
}
