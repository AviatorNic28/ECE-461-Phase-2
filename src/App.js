// This file defines the main frontend interface for the Trustworthy Module Registry.
// It provides functionality to search for existing modules, view a test package,
// and upload a new module with a name and score. The layout is styled for accessibility
// and user experience, including responsive design and debugging support.

import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [registries, setRegistries] = useState([]);
  const [moduleFile, setModuleFile] = useState(null);
  const [moduleName, setModuleName] = useState('');
  const [moduleScore, setModuleScore] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await fetch(
          searchTerm
            ? `http://3.94.252.58:3001/modules?name=${encodeURIComponent(searchTerm)}`
            : `http://3.94.252.58:3001/modules`
        );
        const data = await response.json();
        setRegistries(data);
      } catch (error) {
        console.error('Error fetching modules:', error);
      }
    };

    fetchModules();
  }, [searchTerm]);

  const handleUpload = async () => {
    if (!moduleFile || !moduleName || !moduleScore) {
      setStatusMessage('Please fill out all fields before uploading.');
      return;
    }
    setStatusMessage('Uploading module...');
    try {
      const response = await fetch('http://3.94.252.58:3001/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleName,
          fileName: moduleFile.name,
          fileType: moduleFile.type,
          rating: moduleScore,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get pre-signed URL');
      }

      const data = await response.json();
      const presignedUrl = data.uploadURL;

      await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': moduleFile.type,
        },
        body: moduleFile,
      });

      setStatusMessage('Module uploaded successfully!');
    } catch (error) {
      setStatusMessage('Failed to upload module.');
    }
  };

  return (
    <div className="App" role="main">
      <header>
        <h1 className="header" style={{ fontSize: '2.5rem', marginBottom: '20px' }}>ECE 461 Group 19 - Trustworthy Module Registry</h1>
      </header>
      <main style={{ display: 'flex' }}>
        <section className="search-container" style={{ flex: 3 }}>
          <label htmlFor="searchBar" style={{ fontSize: '1.2rem', marginBottom: '10px', display: 'block' }}>Search existing modules:</label>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <input
              id="searchBar"
              type="text"
              placeholder="Search existing modules ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-bar"
              style={{ width: '90%', height: '2.5rem', fontSize: '1.2rem', padding: '0.5rem' }}
            />
            <button onClick={() => setSearchTerm(searchTerm)} style={{ marginLeft: '15px', padding: '10px 20px', fontSize: '1.2rem' }}>Search</button>
          </div>

          <section className="test-package" aria-label="Test Package">
            <div className="test-package-box" style={{
              border: '3px solid black',
              borderRadius: '12px',
              padding: '20px',
              margin: '20px 0',
              fontSize: '1.2rem'
            }}>
              <h2>Example Module</h2>
              <p>Module Name: Example Module</p>
              <p>Score: 50</p>
              <button onClick={() => alert('Download Example Module')} style={{ padding: '12px 25px', fontSize: '1.2rem', marginRight: '10px' }}>Download</button>
              <button onClick={() => alert('Check Score for Example Module')} style={{ padding: '12px 25px', fontSize: '1.2rem' }}>Rate Module</button>
            </div>
          </section>

          {registries.map((registry) => (
            <div className="registry-box" key={registry.id} style={{
              border: '2px solid gray',
              borderRadius: '8px',
              padding: '15px',
              margin: '10px 0',
              fontSize: '1.2rem'
            }}>
              <h3>{registry.name}</h3>
              <p>Score: {registry.score}</p>
              <button onClick={() => alert(`Download ${registry.name}`)} style={{ padding: '10px 20px', fontSize: '1.2rem', marginRight: '10px' }}>Download</button>
            </div>
          ))}
        </section>

        <div
          style={{
            width: '2px',
            backgroundColor: 'black',
            margin: '0 20px',
            height: '100vh',
          }}
        ></div>

        <section className="upload-container" style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>Upload a New Module</h2>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="fileUpload" style={{ fontSize: '1.2rem', marginBottom: '10px', display: 'block' }}>Select a file:</label>
            <input
              id="fileUpload"
              type="file"
              onChange={(e) => setModuleFile(e.target.files[0])}
              style={{ display: 'block', marginTop: '10px', fontSize: '1.2rem' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="moduleName" style={{ fontSize: '1.2rem', marginBottom: '10px', display: 'block' }}>Module Name:</label>
            <input
              id="moduleName"
              type="text"
              placeholder="Module Name"
              onChange={(e) => setModuleName(e.target.value)}
              style={{ display: 'block', marginTop: '10px', fontSize: '1.2rem', padding: '0.5rem', width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="moduleScore" style={{ fontSize: '1.2rem', marginBottom: '10px', display: 'block' }}>Module Score:</label>
            <input
              id="moduleScore"
              type="number"
              placeholder="Module Score"
              onChange={(e) => setModuleScore(e.target.value)}
              style={{ display: 'block', marginTop: '10px', fontSize: '1.2rem', padding: '0.5rem', width: '100%' }}
            />
          </div>

          <button onClick={handleUpload} style={{ marginTop: '20px', padding: '15px 30px', fontSize: '1.2rem' }}>Upload New Module</button>
        </section>
      </main>
      <div role="status" aria-live="polite" style={{ marginTop: '30px', fontSize: '1.2rem' }}>
        {statusMessage}
      </div>
    </div>
  );
};

export default App;
