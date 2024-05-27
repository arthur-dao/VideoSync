import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';
import VideoThumbnail from './VideoThumbnail';

const socket = io();

function App() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const playerRef = useRef(null);

  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('youtubePlayer', {
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange
        }
      });
    };
  }, []);

  useEffect(() => {
    socket.on('sync', data => {
      setSelectedVideo(data.videoId);
      if (playerRef.current) {
        playerRef.current.loadVideoById(data.videoId, data.timestamp);
      }
    });

    socket.on('play', () => {
      if (playerRef.current) {
        playerRef.current.playVideo();
      }
    });

    socket.on('pause', () => {
      if (playerRef.current) {
        playerRef.current.pauseVideo();
      }
    });

    socket.on('seek', data => {
      if (playerRef.current) {
        playerRef.current.seekTo(data.currentTime, true);
      }
    });

    return () => {
      socket.off('sync');
      socket.off('play');
      socket.off('pause');
      socket.off('seek');
    };
  }, []);

  useEffect(() => {
    if (selectedVideo && playerRef.current) {
      playerRef.current.loadVideoById(selectedVideo);
    }
  }, [selectedVideo]);

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

  const onPlayerReady = (event) => {
    console.log('Player is ready');
    if (selectedVideo) {
      event.target.loadVideoById(selectedVideo);
    }
  };

  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      socket.emit('play', { currentTime: event.target.getCurrentTime() });
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      socket.emit('pause', { currentTime: event.target.getCurrentTime() });
    } else if (event.data === window.YT.PlayerState.BUFFERING || event.data === window.YT.PlayerState.CUED) {
      socket.emit('seek', { currentTime: event.target.getCurrentTime() });
    }
  };

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
          <div id="youtubePlayer"></div>
        </div>
      </div>
    </div>
  );
}

export default App;
