const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const bodyParser = require('body-parser');
const ytdl = require('ytdl-core');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
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
    return res
      .status(400)
      .json({ status: 'failure', error: 'Invalid YouTube link' });
  }

  try {
    const videoInfo = await ytdl.getInfo(videoUrl);
    const title = videoInfo?.videoDetails.title;
    const audioFile = path.join(musicFolderPath, `${title}.mp3`);

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

    // Fetch the video stream without downloading the video file
    const videoStream = ytdl(videoUrl, {
      filter: 'audioonly',
      quality: 'highestaudio',
    });

    // Convert the video stream to MP3 using fluent-ffmpeg
    ffmpeg(videoStream)
      .toFormat('mp3')
      .on('end', () => {
        res.status(200).json({ status: 'success' });
      })
      .on('error', (error) => {
        console.error('Error during conversion:', error.stack);
        res.status(500).json({ status: 'failure', error: 'Conversion failed' });

        // Perform cleanup tasks (like deleting temporary files)
        if (fs.existsSync(audioFile)) {
          fs.unlink(audioFile, (err) => {
            if (err) {
              console.error('Error deleting audio file:', err);
            }
          });
        }
      })
      .save(audioFile);
  } catch (error) {
    console.error(`Error downloading video: ${error.message}`);
    res.status(500).json({ status: 'failure', error: 'Download failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
