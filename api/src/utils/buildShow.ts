// THIS IS OLD CODE most dependencies and stuff have been removed or moved somewhere else or in a different project

// import { show, episode } from "../models/show";
// import { aniwatchClass } from "../sources/aniwatch";
// import { anilistClass } from "../sources/anilist";
// import { kitsuClass } from "../../../backend/src/sources/kitsu";
// import { getTitle } from "./utils";

// // intialize classes
// const aniwatch = new aniwatchClass();
// const anilist = new anilistClass();
// const kitsu = new kitsuClass();

// async function doesEpisodeExist(id: number, episodeNumber: number) {
//   const series = await show.findOne({ "external_id.anilist": id });
//   if (series) {
//     const ep = series?.episodes.data.aniwatch.subbed.find(
//       (episode: any) => episode.number == episodeNumber
//     );
//     return ep;
//   }
//   return null;
// }

// async function doesShowExist(id: number) {
//   const series = await show.findOne({ "external_id.anilist": id });
//   if (series) return true;
//   return false;
// }

// // build episode list
// // TODO: fetch multiple instead of one
// // TODO: ADD DUBBED AND FIX SPEED, and optimize super slow.
// // IMPROPER STORING OF EPISODE
// export async function buildEpisodeAndSave(id: number, episodeNumber: number) {
//   const ifEpisodeExist = await doesEpisodeExist(id, episodeNumber);
//   const ifShowExist = await doesShowExist(id);

//   // check if episode exists
//   if (ifEpisodeExist) {
//     return ifEpisodeExist;
//   }

//   // build show first b4 adding episode
//   if (!ifShowExist) {
//     console.log("building show first");
//     await buildShowAndSave(id);
//   }

//   const title = await getTitle(id);

//   const kitsuList = await kitsu.getEpisodeListData(title);

//   const aniwatchList = (await aniwatch.getData(id))?.episodeList;

//   const { episodeId, number, isFiller } = aniwatchList.find((episode: any) => {
//     return episode.number == episodeNumber;
//   });

//   const { tracks, intro, outro, sources } = await aniwatch.getEpisode(
//     episodeId
//   );

//   // construct detailed list
//   const { titles, description, thumbnail, airdate } = kitsuList.find(
//     (episode: any) => {
//       return episode.number == episodeNumber;
//     }
//   );
//   // episode
//   const ep = new episode({
//     title: titles,
//     number: number,
//     episode_id: episodeId,
//     description: description,
//     filler: isFiller,
//     air_date: airdate,
//     thumbnail: thumbnail?.original || null,
//     time_stamps: {
//       intro: intro,
//       outro: outro,
//     },
//     stream_links: sources,
//     subtitle_links: tracks,
//   });

//   // add to database
//   await show.findOneAndUpdate(
//     {
//       "external_id.anilist": id,
//     },
//     { $addToSet: { "episodes.data.aniwatch.subbed": ep } },
//     { new: true }
//   );

//   return ep;
// }

// // todo: remove site for trailer

// export async function buildShowAndSave(showId: number) {
//   // get data from sources
//   const [anilistData, aniwatchData] = await Promise.all([
//     anilist.getData(showId),
//     aniwatch.getData(showId),
//   ]);

//   // THERES A BUNCH MORE INFO but I will only use seasons for now
//   const { seasons } = aniwatchData?.moreInfo;

//   const {
//     title,
//     duration,
//     description,
//     coverImage,
//     id,
//     idMal,
//     season,
//     siteUrl,
//     countryOfOrigin,
//     averageScore,
//     isAdult,
//     status,
//     episodes,
//     genres,
//     format,
//     seasonYear,
//     nextAiringEpisode,
//     startDate,
//     endDate,
//     recommendations,
//     studios,
//     externalLinks,
//     trailer,
//   } = anilistData;

//   // TODO: forgot to add cover image
//   const series = new show({
//     title: title,
//     seasonYear: seasonYear,
//     description: description,
//     format: format,
//     cover_image: {
//       color: coverImage?.color || null,
//       url: coverImage.large || null,
//     },
//     // EMPTY for now
//     clear_logo: "",
//     start_date: startDate,
//     end_date: endDate,
//     status: status,
//     rating: averageScore,
//     studios: anilist.formatStudios(studios.edges),
//     duration: duration,
//     season: season,
//     country: countryOfOrigin,
//     adult: isAdult,
//     airing_schedule: nextAiringEpisode,
//     genres: genres,
//     external_id: {
//       mal: idMal,
//       anilist: id,
//     },
//     seasons: seasons,
//     episodes: {
//       current: 12,
//       total: episodes,
//       data: {
//         aniwatch: {
//           subbed: [],
//           dubbed: [],
//         },
//       },
//     },
//     recommendations: anilist.formatRecommendations(recommendations.edges),
//     external_links: {
//       anilist: siteUrl,
//       mal: anilist.buildMalUrl(idMal),
//       official_site: anilist.getOfficalSite(externalLinks),
//       trailer: {
//         id: trailer.id,
//         site: trailer.site,
//       },
//     },
//   });

//   await show
//     .create(series)
//     .then(() =>
//       console.log(`added ${title.english || title.romaji || title.native}`)
//     );

//   // RETURN THE SERIES
//   return series;
// }
