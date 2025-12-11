const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");

const app = express();
app.use(express.json());
app.use(cors());

const TMP_DIR = "/dev/shm/audio-trimmer"; // stocke en RAM → ultra rapide

if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

app.use("/tmp", express.static(TMP_DIR));


// -----------------------------------------
// 1️⃣ Téléchargement optimisé
// -----------------------------------------
app.post("/download", async (req, res) => {
  try {
    const { url } = req.body;

    const filename = `audio_${Date.now()}.webm`; // opus dans webm
    const outputPath = path.join(TMP_DIR, filename);

    const { exec } = require("child_process");

    exec(`yt-dlp -f 140 -o "${outputPath}" "${url}"`, (err) => {
      if (err) return res.status(500).json({ error: "Download failed" });
      res.json({ file: `/tmp/${filename}` });
    });

    const file = fs.createWriteStream(outputPath);
    audioStream.pipe(file);

    file.on("finish", () => {
      res.json({ file: `/tmp/${filename}` });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Download failed" });
  }
});


// -----------------------------------------
// 2️⃣ Trim ultra rapide (copy si possible, sinon MP3 128k)
// -----------------------------------------
app.post("/trim", async (req, res) => {
  try {
    const { file, start, end } = req.body;
    const inputPath = path.join(TMP_DIR, path.basename(file));
    const outputFilename = `trim_${Date.now()}.mp3`;
    const outputPath = path.join(TMP_DIR, outputFilename);

    const duration = end - start;

    // YouTube = souvent opus → mp3 obligatoire
    ffmpeg(inputPath)
      .setStartTime(start)
      .setDuration(duration)
      .audioBitrate("128k")        // optimise qualité/poids/vitesse
      .audioCodec("libmp3lame")
      .format("mp3")
      .on("end", () => res.json({ file: `/tmp/${outputFilename}` }))
      .on("error", e => {
        console.error(e);
        res.status(500).json({ error: "Trim failed" });
      })
      .save(outputPath);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Trim failed" });
  }
});


app.use("/", express.static("public"));

// Server
const PORT = 8080;
app.listen(PORT, () =>
  console.log(`Optimized Server running on port ${PORT}`)
);
