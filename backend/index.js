//This file is used as a backend and has functions that are called from the fronend.
//This in turn calls API gateway functions that referenc lambdas to accomplish tasks.


const cors = require('cors');
const express = require('express');
const mysql = require('mysql2/promise');
const axios = require('axios');
const multer = require('multer');

const app = express();
const PORT = 3001;

app.use(express.json());

// Configure MySQL database connection
const dbConfig = {
  host: 'database-1.c9qy26ca8k3g.us-east-1.amazonaws.com',
  user: 'abeuerle',
  password: '461RDSpassword',
  database: '461Database',
};

app.use(cors({
  origin: 'http://461frontend.s3-website-us-east-1.amazonaws.com', // Frontend URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Route to get all modules or search modules by name
app.get('/modules', async (req, res) => {
  const { name } = req.query;
  console.log("Received a GET request to '/modules'");
  console.log("Search query:", name ? `Searching for modules with name: ${name}` : "Fetching all modules");

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("Database connection established");

    const [rows] = name
      ? await connection.execute('SELECT * FROM modules WHERE name LIKE ?', [`%${name}%`])
      : await connection.execute('SELECT * FROM modules');

    console.log("Query executed successfully. Number of modules found:", rows.length);
    await connection.end();
    console.log("Database connection closed");

    res.json(rows);
  } catch (err) {
    console.error("Database error in '/modules':", err.message);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// Route to get presigned URL from Lambda via API Gateway
app.post('/presigned-url', async (req, res) => {
    const { moduleName, fileName, fileType, rating } = req.body;
  
    if (!moduleName || !fileName || !fileType || !rating) {
      console.error('Missing required fields in the request body');
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    console.log("Received a POST request to '/presigned-url'");
    console.log("Module name:", moduleName, "File name:", fileName, "File type:", fileType, "Rating:", rating);
  
    try {
      // Prepare the payload for the Lambda function
      const payload = {
        moduleName,
        fileName,
        fileType,
        rating,
      };
      console.log("Payload to send to Lambda:", JSON.stringify(payload, null, 2));
  
      // Request pre-signed URL from Lambda via API Gateway
      const presignedUrlResponse = await axios.post(
        'https://qpzws2yebl.execute-api.us-east-1.amazonaws.com/prod/package',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Authorization': 'your-auth-token-here', // Replace with your actual token
          },
        }
      );
  
      const presignedUrl = presignedUrlResponse.data.uploadURL;
      console.log("Obtained pre-signed URL:", presignedUrl);
  
      res.status(200).json({ uploadURL: presignedUrl });
    } catch (err) {
      console.error("Error in '/presigned-url':", err.message);
      if (err.response) {
        console.error("Error details:", err.response.data);
      }
      res.status(500).json({ error: 'Error: ' + err.message });
    }
  });

  // Upload route with integration to S3 pre-signed URL
app.post('/upload', multer().single('file'), async (req, res) => {
    const { name, score } = req.body;
    console.log("Received a POST request to '/upload'");
    console.log("Module name:", name, "Score:", score);
    console.log("File info:", req.file ? `Original name: ${req.file.originalname}, Mime type: ${req.file.mimetype}` : "No file received");
  
    if (!req.file) {
      console.error("No file found in the request");
      return res.status(400).json({ error: 'No file uploaded' });
    }
  
    try {
      // Get pre-signed URL from the local endpoint to avoid direct Lambda invocation
      const payload = {
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
      };
      console.log("Payload to send to API Gateway for presigned URL:", JSON.stringify(payload));
  
      const presignedUrlResponse = await axios.post(
        'http://localhost:3001/presigned-url',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
  
      const presignedUrl = presignedUrlResponse.data.uploadURL;
      console.log("Obtained pre-signed URL:", presignedUrl);
  
      // Use pre-signed URL to upload file to S3
      console.log("Uploading file to S3 using pre-signed URL...");
      const uploadResponse = await axios.put(presignedUrl, req.file.buffer, {
        headers: {
          'Content-Type': req.file.mimetype,
        },
      });
  
      console.log("Upload response status:", uploadResponse.status);
      if (uploadResponse.status === 200) {
        console.log("File uploaded successfully to S3");
      } else {
        console.error("File upload to S3 failed with status:", uploadResponse.status);
        return res.status(500).json({ error: 'Failed to upload file to S3' });
      }
  
      // Insert module details into the database
      const connection = await mysql.createConnection(dbConfig);
      console.log("Database connection established");
  
      await connection.execute(
        'INSERT INTO modules (name, score, s3_url) VALUES (?, ?, ?)',
    );

    console.log(`Module uploaded and saved in database. Name: ${name}, Score: ${score}`);
    await connection.end();
    console.log("Database connection closed");

    res.status(200).json({ name, score });
  } catch (err) {
    console.error("Error in '/upload':", err.message);
    if (err.response) {
      console.error("Error details:", err.response.data);
    }
    res.status(500).json({ error: 'Error: ' + err.message });
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

                                                 