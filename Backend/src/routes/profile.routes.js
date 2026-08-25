const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const profileController = require("../controllers/profile.controller");

const profileRouter = express.Router();

/**
 * @route GET /api/profile
 * @description Get authenticated student's profile
 * @access private
 */
profileRouter.get("/", authMiddleware.authUser, profileController.getProfileController);

/**
 * @route PUT /api/profile
 * @description Update authenticated student's profile
 * @access private
 */
profileRouter.put("/", authMiddleware.authUser, profileController.updateProfileController);

module.exports = profileRouter;
