import mongoose from "mongoose";
import DeletedModel from "./deleted.model";
const Schema = mongoose.Schema;

export interface Posts {
  title: string;
  content: string;
  image: string;
  views: number;
  active: boolean | true;
  topicId: string;
}
const postsSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    image: {
      type: String,
      default: "https://source.unsplash.com/1220x700/?agriculture"
    },
    views: {
      type: Number,
      default: 1
    },
    active: {
      type: Boolean,
      default: true
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "topic"
    }
  },
  { timestamps: true }
);

postsSchema.post(/Delete/, function (doc) {
  if (doc)
    return DeletedModel.create({
      recordId: doc._id,
      collectionName: "post",
      data: doc
    });
  return;
});

export const PostsModel = mongoose.model("post", postsSchema);

export default PostsModel;
