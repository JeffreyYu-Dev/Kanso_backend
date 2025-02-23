import ky from "ky";

import { getTitle, normalizeTitle, calculateSimilarity } from "../utils/utils";

interface AnimeShow {
  jname: string;
  [key: string]: any; // for other properties
}

export class aniwatchClass {
  baseUrl: string = "http://localhost:4000/api/v2/hianime/";
  episodeListMetadata: any = null;

  // search up show based on title
  private async search(showTitle: String) {
    return await ky
      .get(this.baseUrl + `search?q=${showTitle}`)
      .json()
      .then((data: any) => data.data.animes);
  }

  // MUST PASS IN ANIWATCH ID NOT ANILIST
  private async fetchEpisodeList(id: String) {
    const data = await ky
      .get(this.baseUrl + `anime/${id}/episodes`)
      .json()
      .then((data: any) => data.data.episodes);
    return data;
  }

  // TODO: ADD DIFFERENT SERVERS AVAILABILITY AND CATEGORIES
  async getEpisode(episodeId: string) {
    const server = "server=hd-1";
    const category = ["sub", "dub"];

    return ky
      .get(`${this.baseUrl}episode/sources?animeEpisodeId=${episodeId}`)
      .json()
      .then((res: any) => res.data);
  }
  //   get more details
  private async getMoreDetails(id: number) {
    return await ky
      .get(this.baseUrl + `anime/${id}`)
      .json()
      .then((res: any) => res.data);
  }

  // gets best matched title
  private findBestMatchShow(
    searchTitle: string,
    shows: AnimeShow[]
  ): AnimeShow | null {
    if (!shows.length) return null;

    const normalizedSearch = normalizeTitle(searchTitle);
    let bestMatch: AnimeShow | null = null;
    let bestSimilarity = 0;

    // japanese
    for (const show of shows) {
      const normalizedJname = normalizeTitle(show.jname);
      const similarity = calculateSimilarity(normalizedSearch, normalizedJname);

      // Update best match if we find a better similarity score
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = show;
      }
    }

    //  english
    for (const show of shows) {
      const normalizedName = normalizeTitle(show.name);
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

  public async getData(id: number) {
    try {
      // get title from id
      const title = await getTitle(id);

      // get show from title
      const showsFromSearch = (await this.search(title)).slice(0, 10);

      // find the best matched show
      const series = this.findBestMatchShow(title, showsFromSearch);

      // get more detail information on the show
      const moreInfo = await this.getMoreDetails(series?.id);

      // return details about show and episode list
      return moreInfo;
    } catch (error) {
      console.log(error);
    }
  }

  // get episode list
  public async getEpisodeList(id: number) {
    try {
      // get title from id
      const title = await getTitle(id);

      // get show from title
      const showsFromSearch = (await this.search(title)).slice(0, 10);

      // find the best matched show
      const series = this.findBestMatchShow(title, showsFromSearch);
      // now we can the list of episodes
      const episodeList = await this.fetchEpisodeList(series?.id);

      // return details about show and episode list
      return episodeList;
    } catch (error) {
      console.log(error);
    }
  }
}
