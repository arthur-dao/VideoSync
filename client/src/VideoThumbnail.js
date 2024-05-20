import React from 'react';
import './App.css';

const VideoThumbnail = ({ video, onClick }) => {
  return (
    <div className="videoThumbnail" onClick={() => onClick(video.id.videoId)}>
      <img src={video.snippet.thumbnails.default.url} alt={video.snippet.title} />
      <h3>{video.snippet.title}</h3>
    </div>
  );
};

export default VideoThumbnail;
