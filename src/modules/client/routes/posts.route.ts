import express from "express";
import * as postsController from "../controllers/posts.controller";

const router = express.Router({ mergeParams: true });
router.get("/", postsController.postsList);
router.get("/:id", postsController.findPost);
router.post("/", postsController.createPost);

export default router;
