const express = require('express');
const multer = require('multer');
const fs = require('fs');

const app = express();
const port = 3000;

const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('video'), (req, res) => {
  const { file } = req;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const videoPath = `uploads/${file.filename}`;

  res.json({ videoPath });
});

app.get('/video/:videoPath', (req, res) => {
  const { videoPath } = req.params;
  const path = `uploads/${videoPath}`;

  fs.exists(path, (exists) => {
    if (!exists) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const stat = fs.statSync(path);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;
      const file = fs.createReadStream(path, { start, end });

      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      };

      res.writeHead(206, headers);
      file.pipe(res);
    } else {
      const headers = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };

      res.writeHead(200, headers);
      fs.createReadStream(path).pipe(res);
    }
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
