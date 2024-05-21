import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';
import VideoThumbnail from './VideoThumbnail';

const socket = io();

function App() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  /*const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState('');*/
  const playerRef = useRef(null);

  useEffect(() => {
    console.log('Adding YouTube Iframe API script');
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      console.log('YouTube Iframe API is ready');
      playerRef.current = new window.YT.Player('videoPlayer', {
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange
        }
      });
    };
  }, []);

  useEffect(() => {
    socket.on('sync', data => {
      console.log('Sync event received:', data);
      setSelectedVideo(data.videoId);
      if (playerRef.current && playerRef.current.loadVideoById) {
        playerRef.current.loadVideoById(data.videoId, data.timestamp);
      } else {
        console.error('Player is not ready');
      }
    });

    socket.on('play', () => {
      console.log('Play event received');
      if (playerRef.current && playerRef.current.playVideo) {
        playerRef.current.playVideo();
      } else {
        console.error('Player is not ready');
      }
    });

    socket.on('pause', () => {
      console.log('Pause event received');
      if (playerRef.current && playerRef.current.pauseVideo) {
        playerRef.current.pauseVideo();
      } else {
        console.error('Player is not ready');
      }
    });

    socket.on('seek', data => {
      console.log('Seek event received:', data);
      if (playerRef.current && playerRef.current.seekTo) {
        playerRef.current.seekTo(data.currentTime, true);
      } else {
        console.error('Player is not ready');
      }
    });

    return () => {
      socket.off('sync');
      socket.off('play');
      socket.off('pause');
      socket.off('seek');
    };
  }, []);

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
    console.log('Playing video:', videoId);
    socket.emit('synchronize', { videoId: videoId, timestamp: 0 });
    if (playerRef.current) {
      playerRef.current.loadVideoById(videoId);
    } else {
      console.error('Player is not ready');
    }
  };

  const onPlayerReady = (event) => {
    console.log('Player is ready');
    event.target.playVideo();
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

  /*const askChatbot = () => {
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: chatInput })
    })
      .then(response => response.json())
      .then(data => {
        setChatResponse(data.choices[0].text);
      });
  };*/

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
          {selectedVideo}
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
