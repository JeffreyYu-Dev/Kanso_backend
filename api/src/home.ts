import ky from "ky";
import {
  latest_aired_query,
  top_airing_query,
  trending_Query,
  upcoming_query,
} from "./query/query";
import {
  getAiringPeriod,
  getCurrentSeason,
  getCurrentYear,
} from "./utils/utils";
import redis from "./redis";

type dataStructure = {
  data: {
    Page: {
      media: [];
      airingSchedules: [];
    };
  };
};

type showDetails = {
  isAdult: boolean;
  genres: string[];
  bannerImage: String;
  averageScore: number;
  media: {
    coverImage: string;
    isAdult: boolean;
  };
};

// Define a type for valid category names
type CategoryName = "trending" | "topAiring" | "latestAired" | "upcoming";

// Define the type for category queries
type CategoryQueries = {
  [K in CategoryName]: string;
};

// get trending anime
async function getCategoryData(category: CategoryName) {
  // queries
  const category_queries: CategoryQueries = {
    trending: trending_Query,
    topAiring: top_airing_query,
    latestAired: latest_aired_query,
    upcoming: upcoming_query,
  };

  // airing period
  const { startTime, endTime } = getAiringPeriod();

  // variables for the queries
  const category_variables = {
    trending: {
      page: 1,
      perPage: 20,
      season: getCurrentSeason(),
      seasonYear: getCurrentYear(),
      status: "RELEASING",
    },
    topAiring: {
      page: 1,
      perPage: 20,
      season: getCurrentSeason(),
      seasonYear: getCurrentYear(),
    },
    latestAired: {
      page: 1,
      perPage: 30,
      airingAtGreater: endTime,
      airingAtLesser: startTime,
    },
    upcoming: {
      page: 1,
      perPage: 20,
      type: "ANIME",
      sort: "POPULARITY_DESC",
      status: "NOT_YET_RELEASED",
    },
  };

  // make fetch requests
  const res: dataStructure = await ky
    .post("https://graphql.anilist.co", {
      json: {
        query: category_queries[category],
        variables: category_variables[category],
      },
    })
    .json();

  // filter out nsfw stuff

  // THIS IS NEEDED FOR LATEST-AIRED (cuz diff format)
  if (category == "latestAired") {
    const data: showDetails[] = res.data.Page.airingSchedules.filter(
      (show: showDetails) => {
        return !show.media.isAdult && show.media.coverImage != null;
      }
    );

    return data;
  }

  if (category == "trending") {
    return res.data.Page.media.filter((show: showDetails) => {
      return !show.isAdult && show.bannerImage && show.averageScore > 65;
    });
  }

  if (category == "topAiring") {
    return res.data.Page.media.filter((show: showDetails) => {
      return !show.isAdult;
    });
  }

  if (category == "upcoming") {
    return res.data.Page.media.filter((show: showDetails) => {
      return !show.isAdult;
    });
  }

  return [];
}

// fetch and/or cache the data into redis
export async function fetchAndOrCache(
  category: CategoryName
): Promise<showDetails[]> {
  // categories
  const categories = ["trending", "topAiring", "latestAired", "upcoming"];

  // key
  const key: string = category;

  // get data from cache
  const cache: string | null = await redis.get(key);

  // get categories
  if (categories.includes(category)) {
    // if data isn't in cache
    if (cache == null) {
      console.log(`\ncache miss for ${category}, fetching anime from source`);
      const data: showDetails[] = await getCategoryData(category);

      // latest aired will have to change more frequently compared to the others
      if (category == "latestAired") {
        // add to cache
        // expire in an one minute
        await redis.set(key, JSON.stringify(data), "EX", 60);
        return data;
      }

      // add to cache
      // expire in an hour
      await redis.set(key, JSON.stringify(data), "EX", 60 * 60);
      return data;
    }

    // json-fy the data
    const data: showDetails[] = JSON.parse(cache);
    return data;
  }

  throw new Error("Not a category");
}
