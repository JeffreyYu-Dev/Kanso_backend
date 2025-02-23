import ky from "ky";
import { normalizeTitle, calculateSimilarity } from "../utils/utils";

type headers = {
  Accept: string;
  "Content-Type": string;
};

export class kitsuClass {
  // VARIABLES
  baseUrl: string = "https://kitsu.io/api/edge";
  headers: headers = {
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
  };

  episodeList: any = [];

  //   find best match
  private findBestMatchShow(searchTitle: string, shows: any) {
    if (!shows.length) return null;

    const normalizedSearch = normalizeTitle(searchTitle);
    let bestMatch;
    let bestSimilarity = 0;

    // ENGLISH
    for (const show of shows) {
      const normalizedName = normalizeTitle(
        show.attributes.titles?.en || show.attributes.titles?.en_us || ""
      );
      const similarity = calculateSimilarity(normalizedSearch, normalizedName);

      // Update best match if we find a better similarity score
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = show;
      }
    }

    // JAPANESE
    for (const show of shows) {
      const normalizedName = normalizeTitle(
        show.attributes.titles?.en_jp || ""
      );
      const similarity = calculateSimilarity(normalizedSearch, normalizedName);

      // Update best match if we find a better similarity score
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = show;
      }
    }

    // Only return a match if it's similar enough (threshold can be adjusted)
    return bestSimilarity > 0.7 ? bestMatch : null;
  }

  // search anime
  private async search(title: string) {
    // params
    const params = new URLSearchParams({
      "filter[text]": title,
      "page[limit]": "4",
    });

    // link test
    // console.log(`${this.baseUrl}/anime?${params}`);
    const results = await ky
      .get(`${this.baseUrl}/anime?${params}`, { headers: this.headers })
      .json()
      .then((res: any) => res.data);

    const show = this.findBestMatchShow(title, results);
    return show;
  }

  private async concatList(page: number, limit: number, url: string) {
    // params
    const params = new URLSearchParams({
      "page[limit]": limit.toString(),
      "page[offset]": (page * limit).toString(),
    });
    // console.log(`${url}?${params}`);

    const results = await ky
      .get(`${url}?${params}`, {
        headers: this.headers,
      })
      .json()
      .then((res: any) => res.data.map((episode: any) => episode.attributes));

    this.episodeList = [...this.episodeList, ...results];
  }

  // THIS WILL GET DATA FOR EPISODES
  async getEpisodeListData(title: string) {
    const limit = 20;
    // get series first
    const series = await this.search(title);
    const url = series.relationships.episodes.links.related;
    const episodeCount = series.attributes.episodeCount;

    // build list
    for (let page = 0; page < episodeCount / limit; page++) {
      await this.concatList(page, limit, url);
      // quick return if less than 20 episodes
      if (episodeCount < limit) break;
    }

    // reset episode list
    const temp = this.episodeList;
    this.episodeList = [];

    return temp;
  }
}
