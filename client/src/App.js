import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';
import VideoThumbnail from './VideoThumbnail';

const socket = io();

function App() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState('');

  const searchVideos = () => {
    fetch(`/api/search?query=${query}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setVideos(data.items);
      })
      .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
      });
  };

  const playVideo = (videoId) => {
    setSelectedVideo(videoId);
    socket.emit('synchronize', { videoId: videoId, timestamp: 0 });
  };

  useEffect(() => {
    socket.on('sync', data => {
      setSelectedVideo(data.videoId);
    });
  }, []);

  {/*const askChatbot = () => {
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: chatInput })
    })
      .then(response => response.json())
      .then(data => {
        setChatResponse(data.choices[0].text);
      });
  };*/}

  return (
    <div className="App">
      <div className="sidebar">
        <div className="searchContainer">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for videos..."
            className="searchInput"
          />
          <button onClick={searchVideos} className='searchButton'>Search</button>
        </div>
      
        <div id="videoList">
          {videos.map((video) => (
            <VideoThumbnail key={video.id.videoId} video={video} onClick={playVideo} />
          ))}
        </div>
      </div>
      
      <div className="main">
        <header>
          <h1>Video Sync App</h1>
        </header>

        <div id="videoPlayer">
          {selectedVideo && (
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo}`}
              style={{ border: 'none' }}
              allowFullScreen
            ></iframe>
          )}
        </div>
        {/*<input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Ask something..."
        />
        <button onClick={askChatbot}>Send</button>
        <div id="chatResponse">{chatResponse}</div>*/}
      </div>
    </div>
  );
}

export default App;
