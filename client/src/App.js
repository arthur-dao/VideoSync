import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const socket = io();

function App() {
  const [url, setUrl] = useState('');
  const [videoQueue, setVideoQueue] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);

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

  const addVideoToQueue = () => {
    const videoId = url.split('v=')[1] || url.split('/').pop();
    setVideoQueue([...videoQueue, videoId]);
    setUrl('');
  };

  const playVideo = (videoId) => {
    setCurrentVideo(videoId);
    socket.emit('synchronize', { videoId: videoId, timestamp: 0 });

    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(videoId);
    }
  };

  const deleteQueueItem = (index) => {
    const newQueue = [...videoQueue];
    newQueue.splice(index, 1);
    setVideoQueue(newQueue);
  };

  const onPlayerReady = (event) => {
    event.target.playVideo();
  };

  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      socket.emit('play', {});
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      socket.emit('pause', {});
    } else if (event.data === window.YT.PlayerState.BUFFERING || event.data === window.YT.PlayerState.CUED) {
      socket.emit('seek', { currentTime: event.target.getCurrentTime() });
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(videoQueue);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setVideoQueue(items);
  };

  useEffect(() => {
    socket.on('sync', data => {
      setCurrentVideo(data.videoId);
      if (playerRef.current && playerRef.current.loadVideoById) {
        playerRef.current.loadVideoById(data.videoId, data.timestamp);
      }
    });

    socket.on('play', () => {
      if (playerRef.current && playerRef.current.playVideo) {
        playerRef.current.playVideo();
      }
    });

    socket.on('pause', () => {
      if (playerRef.current && playerRef.current.pauseVideo) {
        playerRef.current.pauseVideo();
      }
    });

    socket.on('seek', data => {
      if (playerRef.current && playerRef.current.seekTo) {
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

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className="App">
      <div className={`sidebar ${sidebarVisible ? '' : 'hidden'}`}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Add video URL..."
          className="urlInput"
        />
        <button onClick={addVideoToQueue} className='addButton'>+</button>
      
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="videoQueue">
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                style={{ minHeight: '100px' }}
              >
                {videoQueue.map((videoId, index) => (
                  <Draggable key={videoId} draggableId={videoId} index={index}>
                    {(provided) => (
                      <div
                        className="queueItem"
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <span onClick={() => playVideo(videoId)}>{videoId}</span>
                        <button className="deleteButton" onClick={() => deleteQueueItem(index)}>Delete</button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      
      <div className="main">
        <header>
          <h1>Video Sync App</h1>

          <button onClick={toggleSidebar} className='toggleSidebar'>
            {sidebarVisible ? 'Hide' : 'Show'}
          </button>
        </header>

        <div id="videoPlayer">
          <div id="youtubePlayer"></div>
        </div>
      </div>
    </div>
  );
}

export default App;
