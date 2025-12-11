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

// ➤ Télécharger audio YouTube
app.post("/download", (req, res) => {
  const url = req.body.url;
  const output = path.join(TMP_DIR, `audio_${Date.now()}.mp3`);

  const cmd = `yt-dlp -f bestaudio -x --audio-format mp3 -o "${output}" "${url}"`;

  exec(cmd, (error) => {
    if (error) return res.status(500).json({ error: "Download failed" });
    res.json({ file: output.replace(__dirname, "") });
  });
});

// ➤ Couper (trim)
app.post("/trim", (req, res) => {
  const { file, start, end } = req.body;

  const inputPath = path.join(__dirname, file);
  const outputPath = path.join(TMP_DIR, `trim_${Date.now()}.mp3`);

  ffmpeg(inputPath)
    .setStartTime(start)
    .setDuration(end - start)
    .output(outputPath)
    .on("end", () => res.json({ file: outputPath.replace(__dirname, "") }))
    .on("error", (err) => res.status(500).json({ error: "Trim failed" }))
    .run();
});

// ➤ Télécharger le fichier résultant
app.get("/audio/:filename", (req, res) => {
  const filePath = path.join(TMP_DIR, req.params.filename);
  res.sendFile(filePath);
});

app.listen(8080, () => console.log("Server running on port 8080"));

