import mongoose from "mongoose";
const { Schema, model } = mongoose;

const episode_schema = new Schema(
  {
    title: {
      english: { type: String, default: null },
      native: { type: String, default: null },
      romaji: { type: String, default: null },
    },
    number: { type: Number, required: true },
    episode_id: { type: String, required: true },
    description: { type: String, default: null },
    filler: { type: Boolean, default: null },
    air_date: { type: Date, default: null },
    thumbnail: { type: String, default: null },
    time_stamps: {
      type: {
        intro: {
          start: { type: Number },
          end: { type: Number },
        },
        outro: {
          start: { type: Number },
          end: { type: Number },
        },
      },
    },
    stream_links: [
      {
        url: { type: String },
        type: { type: String },
      },
    ],
    subtitle_links: [
      {
        file: { type: String },
        label: { type: String },
        kind: { type: String },
        default: { type: Boolean },
      },
    ],
  },
  { timestamps: true }
);

const episode_model = model("episode", episode_schema);
export default episode_model;
