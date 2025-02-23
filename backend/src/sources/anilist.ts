import ky from "ky";
const show_details_query = `
query show_details($id: Int = 101280) {
  Media(id: $id) {
       title {
      english
      native
      romaji
    }
    
    duration
    description
    id
    idMal
    season
    siteUrl
    countryOfOrigin
    averageScore
    isAdult
    status
    episodes
    genres
    format
    seasonYear
    nextAiringEpisode {
      timeUntilAiring
      airingAt
      episode
    }
    startDate {
      day
      month
      year
    }
    endDate {
      day
      month
      year
    }

    recommendations {
      edges {
        node {
          mediaRecommendation {
            id
            title {
              english
              native
              romaji
            }
            coverImage {
              large
              color
            }
            status
            format
          }
        }
      }
    }
    relations {
      edges {
        node {
          id
          title{
            english
            native
            romaji
          }
          coverImage {
            large
            color
          }
          status
          format
        }
      }
    }
    studios {
      edges {
        node {
          name
        }
      }
    }
  
    externalLinks {
      url
      site
    }
    coverImage {
      color
      large
    }
    trailer {
      id
      site
    }
  }
}

`;

type link = {
  url: string;
  site: string;
};

type recommendations = {
  node: {
    mediaRecommendation: {
      id: number;
      title: {
        english: string;
        native: string;
        romaji: string;
      };
      coverImage: {
        large: string;
        color: string;
      };
      status: string;
      format: string;
    };
  };
};

export class anilistClass {
  async getData(id: number) {
    const data = await ky
      .post("https://graphql.anilist.co", {
        json: {
          query: show_details_query,
          variables: {
            id: id,
          },
        },
      })
      .json()
      .then((res: any) => res.data.Media);

    return data;
  }

  // find site in arr provided from anilist
  getOfficialSite(arr: link[]) {
    const site = arr.find((link: link) => link.site == "Official Site");

    return site?.url || null;
  }

  // format studios
  formatStudios(arr: { node: { name: string } }[]) {
    return arr.map((studio) => studio.node.name);
  }

  // MUST PASS MAL ID
  buildMalUrl(id: string) {
    return `https://myanimelist.net/anime/${id}`;
  }

  // format recommendations
  formatRecommendations(arr: recommendations[]) {
    return arr.map(
      (recommendation: recommendations) =>
        recommendation.node.mediaRecommendation
    );
  }

  // format recommendations
  formatRelated(arr: any[]) {
    return arr.map((related: any) => related.node);
  }
}
