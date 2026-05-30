const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

app.set("trust proxy", 1);

app.use(helmet({
  crossOriginResourcePolicy: false
}));

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json({ limit: "1mb" }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: "Too many requests. Please try again later."
  }
});

app.use(limiter);

const allowedExtensions = [
  ".mp4",
  ".webm",
  ".mov",
  ".m4v",
  ".avi",
  ".mkv"
];

const blockedPlatforms = [
  "youtube.com",
  "youtu.be",
  "facebook.com",
  "fb.watch",
  "tiktok.com",
  "instagram.com"
];

function normalizeUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== "string") {
    return null;
  }

  return inputUrl.trim();
}

function isValidHttpUrl(inputUrl) {
  try {
    const parsedUrl = new URL(inputUrl);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

function isBlockedPlatform(inputUrl) {
  try {
    const parsedUrl = new URL(inputUrl);
    const hostname = parsedUrl.hostname.replace("www.", "").toLowerCase();

    return blockedPlatforms.some(platform => hostname.includes(platform));
  } catch (error) {
    return false;
  }
}

function isDirectVideoUrl(inputUrl) {
  try {
    const parsedUrl = new URL(inputUrl);
    const pathname = parsedUrl.pathname.toLowerCase();

    return allowedExtensions.some(extension => pathname.endsWith(extension));
  } catch (error) {
    return false;
  }
}

function getFileType(inputUrl) {
  try {
    const parsedUrl = new URL(inputUrl);
    const pathname = parsedUrl.pathname.toLowerCase();
    const parts = pathname.split(".");
    return parts.length > 1 ? parts.pop().toUpperCase() : "VIDEO";
  } catch (error) {
    return "VIDEO";
  }
}

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    app: "FastVid Downloader Backend",
    status: "running",
    version: "1.0.0"
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is healthy."
  });
});

app.post("/api/download", async (req, res) => {
  try {
    const videoUrl = normalizeUrl(req.body.url);

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: "Please paste a video URL."
      });
    }

    if (!isValidHttpUrl(videoUrl)) {
      return res.status(400).json({
        success: false,
        message: "Invalid URL. Please paste a valid video link."
      });
    }

    if (isBlockedPlatform(videoUrl)) {
      return res.status(400).json({
        success: false,
        message: "This version does not download YouTube, Facebook, TikTok, or Instagram links. Only direct video file links are supported."
      });
    }

    if (!isDirectVideoUrl(videoUrl)) {
      return res.status(400).json({
        success: false,
        message: "Only direct video links are supported: .mp4, .webm, .mov, .m4v, .avi, .mkv"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Download link generated successfully.",
      type: getFileType(videoUrl),
      downloadUrl: videoUrl
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later."
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found."
  });
});

app.use((error, req, res, next) => {
  res.status(500).json({
    success: false,
    message: "Internal server error."
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`FastVid Backend running on port ${PORT}`);
});
