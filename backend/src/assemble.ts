import show from "./model/show";
import { anilistClass } from "./sources/anilist";
import { aniwatchClass } from "./sources/aniwatch";
import { kitsuClass } from "./sources/kitsu";
import { cleanText, getTitle } from "./utils/utils";

// redis LOL
import redis from "./redis";

import episode from "./model/episode";

// TODO: add the metadata for this page

//TODO: MAJOR on the main api, we need to check if shows and episodes do exist before we start building
export class assemble {
  anilist = new anilistClass();
  aniwatch = new aniwatchClass();
  kitsu = new kitsuClass();

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
  private async fetch_and_or_save_episode_list(show_id: number) {
    // check if episode list is in redis
    const res = await redis.get(`${show_id.toString()}-episode-data`);

    // if not, request data and add for fast access
    if (!res) {
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
    return JSON.parse(res);
  }

  // aggregrate all the data together for show176496
  async build_show(show_id: number) {
    // invoke data methods
    const [anilist_data, aniwatch_data] = await Promise.all([
      this.anilist.getData(show_id),
      this.aniwatch.getData(show_id),
    ]);

    // when the show has been requested add the episode list to redis, this will increase the speed of episode fetching
    // SLIGHT OPTIMIZATION TRICK
    await this.fetch_and_or_save_episode_list(show_id);

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

    let current_number_of_episodes;

    // REMOVE ANY UNWANTED RELATED FORMARTS
    const related_shows = this.anilist
      .formatRelated(relations.edges)
      .filter((show) => show.format != "MANGA" && show.format != "NOVEL");

    // calculate the # of episodes currently (this is used for airing shows)
    if (nextAiringEpisode) {
      current_number_of_episodes = nextAiringEpisode.episode - 1;
    } else {
      current_number_of_episodes = episodes;
    }

    // this is the structured data all aggregrated into one
    return new show({
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
      related: related_shows,
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
      episodes: {
        total: episodes,
        current: current_number_of_episodes,
        data: {
          aniwatch: { subbed: [], dubbed: [] },
        },
      },
    });
  }

  //  build episode
  // TODO: clean description b4 it's added
  async build_episode(show_id: number, episode_number: number) {
    // get data on episode list (aniwatch) and kitsu episode list
    // first check if it's in redis

    // if data isn't in redis we'll need to fetch it
    const redis_res = await this.fetch_and_or_save_episode_list(show_id);
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

    return new episode({
      show_id: show_id,
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
    });
  }
}
