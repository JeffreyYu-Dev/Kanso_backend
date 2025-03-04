// MODELS
import show_model from "./model/show";
import episode_model from "./model/episode";
import episode_list_model from "./model/episode_list";

// sources
import anilist from "./anime_sources/anilist";
import aniwatch from "./anime_sources/aniwatch";
import kitsu from "./anime_sources/kitsu";

// utils
import { cleanText, getTitle } from "./utils/utils";

// redis LOL
import redis from "./redis";

export default class aggregator {
  anilist = new anilist();
  aniwatch = new aniwatch();
  kitsu = new kitsu();

  //   TTL calculator for episoe lists
  private calculate_TTL_episode_list(episode_list: any[]): number {
    // 12 hours per episode
    const TTL_per_episode = 12 * 60;

    // 60 day max
    const MAX_TTL = 24 * 60 * 60 * 60;

    // calculate total TTL for entire episode list
    const total_TTL = episode_list.length * TTL_per_episode;

    // return min time
    return Math.min(total_TTL, MAX_TTL);

    // example: 24 episode list * 12 hours_per_episode = 12 days TTL
  }

  // fetch and/or save episode list and GET KITSU data, kitsu if for individual episode data but doesn't provide streaming links
  private async fetch_and_or_save_episode_list_source_data(show_id: number) {
    // check if episode list is in redis
    const cached_episode_list = await redis.get(
      `${show_id.toString()}-episode-data`
    );

    // if not, request data and add for fast access
    if (!cached_episode_list) {
      console.log(`Fetching show ${show_id} episode data from source`);

      const aniwatch_episode_list = await this.aniwatch.getEpisodeList(show_id);

      // fetch kitsu data for episodes
      const title = await getTitle(show_id);
      const kitsu_episode_list = await this.kitsu.getEpisodeListData(title);

      // combine both lists into one json string
      const combined_list = { aniwatch_episode_list, kitsu_episode_list };

      // calculate the ttl for the show
      // probably use kitsu because it's will have all the episodes(even the ones that aren't aired yetr)
      const TTL = this.calculate_TTL_episode_list(kitsu_episode_list);
      await redis.set(
        `${show_id.toString()}-episode-data`,
        JSON.stringify(combined_list),
        "EX",
        TTL
      );
      return combined_list;
    }

    // else return data if in cache
    console.log(`Fetching show ${show_id} episode data from cache`);
    return JSON.parse(cached_episode_list);
  }

  // aggregrate all the data together for show176496
  async aggregate_show(show_id: number) {
    // invoke data methods
    const [anilist_data, aniwatch_data] = await Promise.all([
      this.anilist.getData(show_id),
      this.aniwatch.getData(show_id),
    ]);

    // when the show has been requested add the episode list to redis, this will increase the speed of episode fetching
    // SLIGHT OPTIMIZATION TRICK
    await this.fetch_and_or_save_episode_list_source_data(show_id);

    // anilist values
    const {
      title: { english, native, romaji },
      duration,
      description,
      coverImage: { color, large },
      id,
      idMal,
      season,
      siteUrl,
      countryOfOrigin,
      averageScore,
      isAdult,
      status,
      episodes,
      genres,
      format,
      seasonYear,
      nextAiringEpisode,
      startDate,
      endDate,
      recommendations,
      studios,
      externalLinks,
      trailer,
      relations,
    } = anilist_data;

    // aniwatch data
    const { seasons } = aniwatch_data;

    // REMOVE ANY UNWANTED RELATED FORMARTS
    const filtered_related_shows = this.anilist
      .formatRelated(relations.edges)
      .filter((show) => show.format != "MANGA" && show.format != "NOVEL");

    // create the show's episode list and add to database
    const episode_list = await episode_list_model.create({
      show_id: show_id.toString(),
      total_episodes: episodes,
      // TODO: fix current episode
      latest_episode_in_database: null,
    });

    // this is the structured data all aggregrated into one
    return new show_model({
      title: {
        english: english,
        native: native,
        romaji: romaji,
      },
      description: cleanText(description),
      duration: duration,
      season_quarter: season,
      cover_image: {
        color: color,
        url: large,
      },
      status: status,
      rating: averageScore,
      season_year: seasonYear,
      format: format,
      adult: isAdult,
      country: countryOfOrigin,
      start_date: startDate,
      end_date: endDate,
      seasons: seasons,
      genres: genres,
      airing_schedule: nextAiringEpisode,
      studios: this.anilist.formatStudios(studios.edges),
      recommendations: this.anilist
        .formatRecommendations(recommendations.edges)
        .slice(0, 5),
      related: filtered_related_shows,
      external_links: {
        anilist: siteUrl,
        mal: this.anilist.buildMalUrl(idMal),
        official_site: this.anilist.getOfficialSite(externalLinks),
        trailer: {
          id: trailer.id,
          site: trailer.site,
        },
      },
      external_id: {
        mal: idMal,
        anilist: id,
      },
      episode_list: episode_list._id,
    });
  }

  //  build episode
  async aggregate_episode(show_id: number, episode_number: number) {
    // get data on episode list (aniwatch) and kitsu episode list
    // first check if it's in redis

    // if data isn't in redis we'll need to fetch it
    const redis_res = await this.fetch_and_or_save_episode_list_source_data(
      show_id
    );
    const { aniwatch_episode_list, kitsu_episode_list } = redis_res;

    // get streaming link based on show_id and episode_number and other relavent data

    // find data on this episode (KITSU)
    const episode_data_kitsu = kitsu_episode_list.find(
      (episode: any) => episode.number == episode_number
    );

    // find data on this episode (aniwatch)
    const episode_data_aniwatch = aniwatch_episode_list.find(
      (episode: any) => episode.number == episode_number
    );

    // kitsu episode data
    const {
      titles: kitsu_title,
      airdate,
      length,
      thumbnail,
      synopsis,
    } = episode_data_kitsu;

    // aniwatch episode data
    const {
      title: aniwatch_title,
      episodeId,
      number,
      isFiller,
    } = episode_data_aniwatch;

    // ANIWATCH SOURCE
    // need to pass in aniwatch episode id
    const stream_aniwatch = await this.aniwatch.getEpisode(episodeId);
    const { tracks, intro, outro, sources } = stream_aniwatch;

    return new episode_model({
      title: {
        english: kitsu_title?.en || kitsu_title?.en_us,
        native: kitsu_title?.en_jp,
        romaji: kitsu_title?.ja_jp,
      },
      number: number,
      episode_id: episodeId,
      description: cleanText(synopsis),
      filler: isFiller,
      air_date: airdate,
      // TODO: fix thumbnails
      thumbnail: thumbnail?.original || thumbnail?.large,
      time_stamps: {
        type: {
          intro: intro,
          outro: outro,
        },
      },
      stream_links: sources,
      subtitle_links: tracks,

      // TODO: we don't know episode length, this might be needed for keep tracking of users watch history(idk bro)
    });
  }

  // aniwatch episode fetch
  private async aniwatch_episode_fetch({
    show_id,
    episode_num,
    episode_type,
  }: {
    show_id: number;
    episode_num: number;
    episode_type: string;
  }) {
    // for aniwatch first we get the episode list to get the id's
    // second look for the id of the epsiode
    // third do fetch request
    // fetch episode list
    const cached_episode_list_data =
      await this.fetch_and_or_save_episode_list_source_data(show_id);

    const { aniwatch_episode_list, kitsu_episode_list } =
      cached_episode_list_data;

    // aniwatch data
    const aniwatch_episode_data = aniwatch_episode_list.find(
      (episode: any) => episode.number == episode_num
    );

    // kitsu data
    const kitsu_episode_data = kitsu_episode_list.find(
      (episode: any) => episode.number == episode_num
    );

    // kitsu episode data
    const {
      titles: kitsu_title,
      airdate,
      length,
      thumbnail,
      synopsis,
    } = kitsu_episode_data;

    // aniwatch episode data
    const {
      title: aniwatch_title,
      episodeId,
      number,
      isFiller,
    } = aniwatch_episode_data;

    // ANIWATCH SOURCE
    // need to pass in aniwatch episode id
    const stream_aniwatch = await this.aniwatch.getEpisode(
      episodeId,
      episode_type
    );
    const { tracks, intro, outro, sources } = stream_aniwatch;

    return new episode_model({
      title: {
        english: kitsu_title?.en || kitsu_title?.en_us,
        native: kitsu_title?.en_jp,
        romaji: kitsu_title?.ja_jp,
      },
      number: number,
      episode_id: episodeId,
      description: cleanText(synopsis),
      filler: isFiller,
      air_date: airdate,
      // TODO: fix thumbnails
      thumbnail: thumbnail?.original || thumbnail?.large,
      time_stamps: {
        type: {
          intro: intro,
          outro: outro,
        },
      },
      stream_links: sources,
      subtitle_links: tracks,

      // TODO: we don't know episode length, this might be needed for keep tracking of users watch history(idk bro)
    });
  }

  private async gogoanime_episode_fetch() {}

  private async zoro_episode_fetch() {}

  // get direct episode # from certain provider
  async get_direct_episode({
    show_id,
    episode_num,
    provider,
    episode_type = "sub",
  }: {
    show_id: number;
    episode_num: number;
    provider: string;
    episode_type: string;
  }) {
    // current available providers?
    type EpisodeFetchFunction = (params: {
      show_id: number;
      episode_num: number;
      episode_type: string;
    }) => Promise<any>;

    const providers: Record<string, EpisodeFetchFunction> = {
      //  gogoanime: (params) => this.gogoanime_episode_fetch(params),
      aniwatch: async (params) => await this.aniwatch_episode_fetch(params),
      //  zoro: (params) => this.zoro_episode_fetch(params),
    };

    // TODO: fix this
    // check if provider is one of the providers
    if (!Object.keys(providers).includes(provider.toLowerCase())) return null;

    // actually we need to check what provider we're tryna get from
    const res = providers[provider]({
      show_id: show_id,
      episode_num: episode_num,
      episode_type: episode_type,
    });

    return res;
  }

  // get all available providers of episode #
  async get_episode() {}
}
