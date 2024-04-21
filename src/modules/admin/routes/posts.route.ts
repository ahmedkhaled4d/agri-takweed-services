import express from "express";
import * as postsController from "../controllers/posts.controller";

const router = express.Router({ mergeParams: true });

router.get("/", postsController.postsList);
router.get("/:id", postsController.findPost);
router.put("/:id", postsController.updatePost);
router.put("/active/:id", postsController.activePost);
router.put("/deactive/:id", postsController.deactivePost);
router.post("/", postsController.createPost);
router.delete("/:id", postsController.deletePost);

export default router;
