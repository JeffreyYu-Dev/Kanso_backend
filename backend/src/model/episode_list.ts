import mongoose from "mongoose";
const { Schema, model } = mongoose;

const episode_list = new Schema(
  {
    current_page: { type: Number, default: 0 },
    total_pages: { type: Number },
    show_id: { type: String },
    total_episodes: { type: Number },
    current: { type: Number },
    providers: {
      aniwatch: {
        subbed: [{ type: Schema.Types.ObjectId, ref: "episode" }],
        dubbed: [{ type: Schema.Types.ObjectId, ref: "episode" }],
        total_episodees: { type: Number },
        current: { type: Number },
      },
      gogoanime: {
        subbed: [{ type: Schema.Types.ObjectId, ref: "episode" }],
        dubbed: [{ type: Schema.Types.ObjectId, ref: "episode" }],
        total_episodees: { type: Number },
        current: { type: Number },
      },
      // add more providers later on?
    },
  },
  { timestamps: true }
);

const episode = model("episode_list", episode_list);
export default episode;
