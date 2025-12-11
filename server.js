const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { exec } = require("child_process");

const app = express();
app.use(express.json());
app.use(cors());

// Stockage rapide en RAM
const TMP_DIR = "/dev/shm/audio-trimmer";
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

app.use("/tmp", express.static(TMP_DIR));


// ---------------------
//  1️⃣ DOWNLOAD (yt-dlp)
// ---------------------
app.post("/download", async (req, res) => {
  const { url } = req.body;

  const filename = `audio_${Date.now()}.webm`;
  const outputPath = path.join(TMP_DIR, filename);

  // yt-dlp 140 = audio-only medium (très rapide)
  const command = `yt-dlp -f 140 -o "${outputPath}" "${url}"`;

  exec(command, (err) => {
    if (err) {
      console.error("yt-dlp error:", err);
      return res.status(500).json({ error: "Download failed" });
    }
    res.json({ file: `/tmp/${filename}` });
  });
});


// ---------------------
//  2️⃣ TRIM (ffmpeg)
// ---------------------
app.post("/trim", (req, res) => {
  const { file, start, end } = req.body;

  const inputPath = path.join(TMP_DIR, path.basename(file));
  const outputFilename = `trim_${Date.now()}.mp3`;
  const outputPath = path.join(TMP_DIR, outputFilename);

  const duration = end - start;

  ffmpeg(inputPath)
    .setStartTime(start)
    .setDuration(duration)
    .audioCodec("libmp3lame")
    .audioBitrate("128k")
    .format("mp3")
    .on("end", () => res.json({ file: `/tmp/${outputFilename}` }))
    .on("error", (err) => {
      console.error(err);
      res.status(500).json({ error: "Trim failed" });
    })
    .save(outputPath);
});


// Serve frontend
app.use("/", express.static("public"));

app.listen(8080, () =>
  console.log("🔥 yt-dlp Optimized Server running on port 8080")
);
