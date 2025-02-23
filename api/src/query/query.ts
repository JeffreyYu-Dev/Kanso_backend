export const trending_Query = `
query ($page: Int, $perPage: Int, $season: MediaSeason, $status: MediaStatus,$seasonYear: Int) {
  Page(page: $page, perPage: $perPage) {
    media(type: ANIME, sort: [TRENDING_DESC], season: $season, status: $status,seasonYear: $seasonYear) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        color
      }
      bannerImage
      averageScore
      duration
      episodes
      isAdult
      format
      description
      genres
      seasonYear
      nextAiringEpisode {
        episode
      }
      
    }
  }
}
`;

export const top_airing_query = `
query($page: Int, $perPage: Int, $seasonYear: Int, $season: MediaSeason){
  Page(page: $page, perPage: $perPage){
    media(type:ANIME, status: RELEASING, seasonYear: $seasonYear, sort: POPULARITY_DESC, season: $season) {
     isAdult
      id
      title{
        english
        native
        romaji
      }
      coverImage {
        color
        large
      }
      averageScore
      episodes
      format
      status
      genres
         characters(page: 1, perPage: 1) {

           edges {
            id
            voiceActors {
              languageV2
            }
            node {
              __typename
            }
            role
          }
        }
    nextAiringEpisode {
      episode
    }
    }
  
  }
}
`;

export const upcoming_query = `
query($perPage: Int, $page: Int, $type: MediaType, $status: MediaStatus, $sort: [MediaSort]){
  Page(perPage: $perPage, page: $page) {
    media(type: $type, sort: $sort,status: $status) {
     isAdult
       id
      title{
        english
        native
        romaji
      }
      coverImage {
        color
        large
      }
      averageScore
      episodes
      format
      status
         characters(page: 1, perPage: 1) {

           edges {
            id
            voiceActors {
              languageV2
            }
            node {
              __typename
            }
            role
          }
        }
    nextAiringEpisode {
      episode
    }
    }
  }
}`;

export const latest_aired_query = `query($page: Int, $perPage: Int, $airingAtGreater: Int, $airingAtLesser: Int){
        Page(page: $page, perPage: $perPage ) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          airingSchedules(
            sort: TIME_DESC, 
            airingAt_greater: $airingAtGreater, 
            airingAt_lesser: $airingAtLesser
          ) {
            media {
              id
              title {
                english
                romaji
                native
              }
              format
              seasonYear
              averageScore
              coverImage {
                large
                color
              }
              episodes
              nextAiringEpisode {
                episode
              }
              status
              characters(page: 1, perPage: 1) {
                edges {
                  id
                  voiceActors {
                    languageV2
                  }
                  node {
                    __typename
                  }
                  role
                }
              }
            isAdult
            }
          }
        }
      }`;
