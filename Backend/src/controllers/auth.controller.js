const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const tokenBlacklistModel = require("../models/blacklist.model");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const isProduction = process.env.NODE_ENV === "production" || (process.env.CLIENT_URL && process.env.CLIENT_URL.startsWith("https://"));

function getCookieOptions() {
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    };
}

/**
 * @name registerUserController
 * @description register a new user, expects username, email and password in the request body
 * @access Public
 */
async function registerUserController(req, res) {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            message: "Please provide username, email and password"
        });
    }

    const isUserAlreadyExists = await userModel.findOne({
        $or: [{ username }, { email }]
    });

    if (isUserAlreadyExists) {
        return res.status(400).json({
            message: "Account already exists with this email address or username"
        });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await userModel.create({
        username,
        email,
        password: hash
    });

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    res.cookie("token", token, getCookieOptions());

    res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar
        }
    });
}

/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 */
async function loginUserController(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Please provide email and password"
        });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password"
        });
    }

    if (!user.password) {
        return res.status(400).json({
            message: "This account was registered with Google. Please use Google Sign-In."
        });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(400).json({
            message: "Invalid email or password"
        });
    }

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    res.cookie("token", token, getCookieOptions());

    // Track user login in learning history (non-qualifying, does not increase streak)
    try {
        const journeyService = require("../services/journey.service");
        journeyService.logUserLogin({ userId: user._id });
    } catch (logErr) {
        console.warn("[Auth] Login activity log skipped:", logErr.message);
    }

    res.status(200).json({
        message: "User loggedIn successfully.",
        token,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar
        }
    });
}

/**
 * @name googleAuthController
 * @description Verify Google credential, find/create/link user, and issue standard JWT
 * @access Public
 */
async function googleAuthController(req, res) {
    try {
        const { credential } = req.body;

        if (!credential || typeof credential !== "string") {
            return res.status(400).json({
                message: "Google credential is required"
            });
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            return res.status(500).json({
                message: "Google authentication is not configured on the server."
            });
        }

        // Verify ID token with Google's public keys
        let payload;
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: clientId
            });
            payload = ticket.getPayload();
        } catch (verifyErr) {
            console.error("Google token verification failed:", verifyErr.message);
            return res.status(401).json({
                message: "Google sign-in failed. Please try again."
            });
        }

        if (!payload || !payload.sub || !payload.email) {
            return res.status(401).json({
                message: "Invalid Google credential."
            });
        }

        if (!payload.email_verified) {
            return res.status(401).json({
                message: "Google email is not verified."
            });
        }

        const googleId = payload.sub;
        const email = payload.email.toLowerCase().trim();
        const name = payload.name || email.split("@")[0];
        const picture = payload.picture || "";

        // 1. Check if user with this googleId already exists
        let user = await userModel.findOne({ googleId });

        if (!user) {
            // 2. Check if user with this email exists (local account)
            user = await userModel.findOne({ email });

            if (user) {
                // Safe account linking: link googleId and avatar, preserve existing password
                user.googleId = googleId;
                if (!user.avatar && picture) {
                    user.avatar = picture;
                }
                await user.save();
            } else {
                // 3. Create new user with verified Google identity
                let baseUsername = name.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
                if (!baseUsername || baseUsername.length < 3) {
                    baseUsername = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
                }

                let username = baseUsername;
                let count = 1;
                while (await userModel.findOne({ username })) {
                    username = `${baseUsername}_${count}`;
                    count++;
                }

                user = await userModel.create({
                    username,
                    email,
                    googleId,
                    avatar: picture
                });
            }
        } else {
            // Existing Google user: update avatar if newly provided
            if (!user.avatar && picture) {
                user.avatar = picture;
                await user.save();
            }
        }

        // Issue standard application JWT
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("token", token, getCookieOptions());

        // Track user login in learning history
        try {
            const journeyService = require("../services/journey.service");
            journeyService.logUserLogin({ userId: user._id });
        } catch (logErr) {
            console.warn("[Auth] Google login activity log skipped:", logErr.message);
        }

        return res.status(200).json({
            message: "Google sign-in successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar
            }
        });
    } catch (err) {
        console.error("googleAuthController error:", err.message);
        return res.status(500).json({
            message: "Google sign-in failed. Please try again."
        });
    }
}

/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */
async function logoutUserController(req, res) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const token = req.cookies?.token || bearerToken;

    if (token) {
        await tokenBlacklistModel.create({ token });
    }

    res.clearCookie("token", getCookieOptions());

    res.status(200).json({
        message: "User logged out successfully"
    });
}

/**
 * @name getMeController
 * @description get the current logged in user details.
 * @access private
 */
async function getMeController(req, res) {
    const user = await userModel.findById(req.user.id);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
        message: "User details fetched successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar
        }
    });
}

module.exports = {
    registerUserController,
    loginUserController,
    googleAuthController,
    logoutUserController,
    getMeController
};