const express = require('express');
const path = require('path');
const os = require('os');
const fs = require('fs');
const bodyParser = require('body-parser');
const ytdl = require('ytdl-core');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const homeDirectory = os.homedir();

// Assuming the music folder is named "Music" under the home directory
const musicFolderPath = path.join(homeDirectory, 'Music');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/views/index.html');
});

app.post('/convert-mp3', async (req, res) => {
  const videoUrl = req.body.videoURL;

  if (!videoUrl || !ytdl.validateURL(videoUrl)) {
    return res.status(400).json({ status: 'failure', error: 'Invalid link' });
  }

  try {
    const videoInfo = await ytdl.getInfo(videoUrl);
    const video_url = videoInfo?.videoDetails.video_url;
    const title = videoInfo?.videoDetails.title;
    const outputMP3FilePath = path.join(musicFolderPath, `${title}.mp3`);

    if (!videoInfo || !videoInfo.formats || videoInfo.formats.length === 0) {
      return res.status(400).json({
        status: 'failure',
        error: 'Video is not available for download',
      });
    }

    const hasAudioStreams = videoInfo.formats.some((format) => format.hasAudio);
    if (!hasAudioStreams) {
      return res.status(400).json({
        status: 'failure',
        error: 'Video does not contain audio streams',
      });
    }

    ytdl(video_url, {
      filter: 'audioonly',
      quality: 'highestaudio',
      format: 'mp3',
    })
      .pipe(fs.createWriteStream(outputMP3FilePath))
      .on('finish', () => {
        res.status(200).json({
          status: 'success',
          message: 'Conversion Successful',
        });
      })
      .on('error', () => {
        res.status(500).json({ status: 'failure', error: 'Converted Failed' });
      });
  } catch (error) {
    console.error(`Error converting video: ${error.message}`);
    res.status(500).json({ status: 'failure', error: 'Convert failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
