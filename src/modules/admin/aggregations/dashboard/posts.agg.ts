import { PipelineStage } from "mongoose";

export const PostsViewsAgg: Array<PipelineStage> = [
  {
    $addFields: {
      year_document: {
        $year: "$createdAt"
      },
      year_date: {
        $year: new Date("Sun, 10 Apr 2022 11:21:35 GMT")
      }
    }
  },
  {
    $match: {
      $expr: {
        $eq: ["$year_document", "$year_date"]
      }
    }
  },
  {
    $project: {
      year: {
        $year: "$createdAt"
      },
      views: 1,
      topicId: 1
    }
  },
  {
    $lookup: {
      from: "topics",
      localField: "topicId",
      foreignField: "_id",
      as: "topic"
    }
  },
  {
    $unwind: {
      path: "$topic"
    }
  },
  {
    $project: {
      topicId: 1,
      views: 1,
      name: "$topic.name"
    }
  },
  {
    $group: {
      _id: {
        name: "$name"
      },
      No_of_Views: {
        $sum: "$views"
      }
    }
  }
];

export const PostsViewsSumAgg: Array<PipelineStage> = [
  { $group: { _id: null, views_Sum: { $sum: "$views" } } }
];
