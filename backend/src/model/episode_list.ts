import mongoose from "mongoose";
const { Schema, model } = mongoose;

const provider_format = {
  sub: [
    {
      _id: { type: Schema.Types.ObjectId, ref: "episode" },
    },
  ],
  dub: [
    {
      _id: { type: Schema.Types.ObjectId, ref: "episode" },
    },
  ],
  total_episodes: { type: Number, default: null },
  current: { type: Number, default: null },
};

const episode_list_schema = new Schema(
  {
    show_id: { type: Number, required: true },
    total_episodes: { type: Number },
    latest_episode_in_database: { type: Number },
    providers: {
      aniwatch: provider_format,
      gogoanime: provider_format,
      // TODO: add more providers later on?
    },
  },
  { timestamps: true }
);

const episode_list_model = model("episode_list", episode_list_schema);
export default episode_list_model;
