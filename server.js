const express = require("express");
const { exec } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const TMP_DIR = path.join(__dirname, "tmp");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

// Télécharger l'audio YouTube
app.post("/download", (req, res) => {
  const url = req.body.url;
  const filename = `audio_${Date.now()}.mp3`;
  const output = path.join(TMP_DIR, filename);

  const cmd = `yt-dlp -f bestaudio -x --audio-format mp3 -o "${output}" "${url}"`;

  exec(cmd, (error) => {
    if (error) return res.status(500).json({ error: "Download failed" });

    res.json({ file: "/audio/" + filename });
  });
});

// Trim audio
app.post("/trim", (req, res) => {
  const { file, start, end } = req.body;
  const inputPath = path.join(TMP_DIR, path.basename(file));
  const filename = `trim_${Date.now()}.mp3`;
  const outputPath = path.join(TMP_DIR, filename);

  ffmpeg(inputPath)
    .setStartTime(start)
    .setDuration(end - start)
    .output(outputPath)
    .on("end", () => res.json({ file: "/audio/" + filename }))
    .on("error", () => res.status(500).json({ error: "Trim failed" }))
    .run();
});

// Servir les fichiers audio
app.get("/audio/:filename", (req, res) => {
  const filePath = path.join(TMP_DIR, req.params.filename);
  res.sendFile(filePath);
});

app.listen(8080, () => console.log("Server running on port 8080"));
