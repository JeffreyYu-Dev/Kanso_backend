import mongoose from "mongoose";

const { Schema, model } = mongoose;

const show_schema = new Schema(
  {
    title: {
      english: { type: String, default: null },
      romaji: { type: String, default: null },
      native: { type: String, default: null },
    },
    season_year: { type: Number, default: null },
    description: { type: String, default: null },
    format: { type: String, default: null },
    cover_image: {
      color: { type: String, default: null },
      url: { type: String, default: null },
    },
    clear_logo: { type: String, default: null },
    start_date: {
      day: { type: Number, default: null },
      month: { type: Number, default: null },
      year: { type: Number, default: null },
    },
    end_date: {
      day: { type: Number, default: null },
      month: { type: Number, default: null },
      year: { type: Number, default: null },
    },
    status: { type: String, required: true },
    rating: { type: Number, default: null },
    studios: [{ type: String, required: true }],
    duration: { type: Number, default: null },
    season_quarter: { type: String, default: null },
    country: { type: String, default: null },
    adult: { type: String, default: null },
    airing_schedule: {
      timeUntilAiring: Number,
      episode: Number,
      airingAt: Number,
    },
    genres: [String],
    external_id: {
      mal: Number,
      anilist: Number,
    },
    seasons: [
      {
        id: { type: String, default: null },
        name: { type: String, default: null },
        title: { type: String, default: null },
        isCurrent: { type: String, default: null },
        poster: { type: String, default: null },
      },
    ],
    // episodes: {
    //   total: { type: Number, default: null },
    //   current: { type: Number, default: null },
    //   data: {
    //     aniwatch: {
    //       subbed: [
    //         {
    //           type: Schema.Types.ObjectId,
    //           ref: "episode",
    //         },
    //       ],
    //       dubbed: [
    //         {
    //           type: Schema.Types.ObjectId,
    //           ref: "episode",
    //         },
    //       ],
    //     },
    //   },
    // },
    episode_list: { type: Schema.Types.ObjectId, ref: "episode_list" },

    recommendations: [
      {
        id: { type: Number, required: true },
        title: {
          english: { type: String, default: null },
          romaji: { type: String, default: null },
          native: { type: String, default: null },
        },
        coverImage: {
          color: { type: String, default: null },
          large: { type: String, default: null },
        },
        status: { type: String, default: null },
        format: { type: String, default: null },
      },
    ],

    related: [
      {
        id: { type: Number, required: true },
        title: {
          english: { type: String, default: null },
          romaji: { type: String, default: null },
          native: { type: String, default: null },
        },
        coverImage: {
          color: { type: String, default: null },
          large: { type: String, default: null },
        },
        status: { type: String, default: null },
        format: { type: String, default: null },
      },
    ],
    external_links: {
      anilist: { type: String, default: null },
      mal: { type: String, default: null },
      official_site: { type: String, default: null },
      trailer: {
        id: { type: String, default: null },
        site: { type: String, default: null },
      },
    },
  },
  { timestamps: true }
);

const show = model("show", show_schema);

export default show;
