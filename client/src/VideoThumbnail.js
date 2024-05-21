import React from 'react';
import './App.css';

const VideoThumbnail = ({ video, onClick }) => {
  return (
    <div className="videoThumbnail" onClick={() => {
      console.log('Thumbnail clicked:', video.id.videoId);
      onClick(video.id.videoId);
    }}>
      <img src={video.snippet.thumbnails.medium.url} alt={video.snippet.title} />
      <h3>{video.snippet.title}</h3>
    </div>
  );
};

export default VideoThumbnail;
