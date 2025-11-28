import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiChevronLeft, FiChevronRight, FiPause, FiPlay } from 'react-icons/fi';

const StoryViewer = ({ visible, stories, initialIndex = 0, onClose, onStoryViewed }) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialIndex);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const STORY_DURATION = 5000; // 5 seconds for images

  useEffect(() => {
    if (visible) {
      setCurrentStoryIndex(initialIndex);
      setCurrentMediaIndex(0);
      setProgress(0);
      setIsPaused(false);
    }
  }, [visible, initialIndex]);

  useEffect(() => {
    if (!visible || isPaused) return;

    const currentStory = stories[currentStoryIndex];
    if (!currentStory) return;

    const currentMedia = currentStory.files[currentMediaIndex];
    const isVideo = currentMedia?.mimetype?.startsWith('video') || currentMedia?.url?.includes('.mp4');

    if (isVideo && videoRef.current) {
      // For videos, update progress based on video currentTime
      const updateVideoProgress = () => {
        if (videoRef.current) {
          const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
          setProgress(percent);
        }
      };

      videoRef.current.addEventListener('timeupdate', updateVideoProgress);
      videoRef.current.addEventListener('ended', handleNext);

      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('timeupdate', updateVideoProgress);
          videoRef.current.removeEventListener('ended', handleNext);
        }
      };
    } else {
      // For images, use interval
      const startTime = Date.now();
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const percent = Math.min((elapsed / STORY_DURATION) * 100, 100);
        setProgress(percent);

        if (percent >= 100) {
          handleNext();
        }
      }, 50);

      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      };
    }
  }, [visible, currentStoryIndex, currentMediaIndex, isPaused, stories]);

  // Mark story as viewed when opening
  useEffect(() => {
    if (visible && stories[currentStoryIndex] && onStoryViewed) {
      onStoryViewed(stories[currentStoryIndex]._id);
    }
  }, [visible, currentStoryIndex]);

  const handleNext = () => {
    const currentStory = stories[currentStoryIndex];

    // Check if there are more media items in current story
    if (currentMediaIndex < currentStory.files.length - 1) {
      setCurrentMediaIndex(prev => prev + 1);
      setProgress(0);
    }
    // Check if there are more stories
    else if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setCurrentMediaIndex(0);
      setProgress(0);
    }
    // No more stories, close viewer
    else {
      onClose();
    }
  };

  const handlePrevious = () => {
    // Check if there are previous media items in current story
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(prev => prev - 1);
      setProgress(0);
    }
    // Check if there are previous stories
    else if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      const prevStory = stories[currentStoryIndex - 1];
      setCurrentMediaIndex(prevStory.files.length - 1);
      setProgress(0);
    }
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  if (!visible || !stories || stories.length === 0) {
    return null;
  }

  const currentStory = stories[currentStoryIndex];
  if (!currentStory) return null;

  const currentMedia = currentStory.files[currentMediaIndex];
  const isVideo = currentMedia?.mimetype?.startsWith('video') || currentMedia?.url?.includes('.mp4');
  const mediaUrl = currentMedia?.url || currentMedia;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      {/* Story Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '500px',
          height: '90vh',
          backgroundColor: '#000',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bars */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          gap: '4px',
          padding: '12px',
          zIndex: 2
        }}>
          {currentStory.files.map((_, index) => (
            <div
              key={index}
              style={{
                flex: 1,
                height: '3px',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: index < currentMediaIndex ? '100%' : index === currentMediaIndex ? `${progress}%` : '0%',
                  height: '100%',
                  backgroundColor: 'white',
                  transition: index === currentMediaIndex ? 'none' : 'width 0.3s'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div style={{
          position: 'absolute',
          top: '48px',
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 2
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'white'
          }}>
            {currentStory.message || 'Admin Update'}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white'
            }}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Media Content */}
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000'
        }}>
          {isVideo ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              autoPlay
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Story"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
          )}
        </div>

        {/* Navigation Areas */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '30%',
          cursor: 'pointer',
          zIndex: 1
        }}
        onClick={(e) => {
          e.stopPropagation();
          handlePrevious();
        }}
        />

        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '30%',
          cursor: 'pointer',
          zIndex: 1
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        />

        {/* Center Pause Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePause();
          }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.5)',
            border: 'none',
            borderRadius: '50%',
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white',
            opacity: isPaused ? 1 : 0,
            transition: 'opacity 0.2s',
            zIndex: 2
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
          onMouseLeave={(e) => e.currentTarget.style.opacity = isPaused ? 1 : 0}
        >
          {isPaused ? <FiPlay size={32} /> : <FiPause size={32} />}
        </button>

        {/* Navigation Arrows */}
        {currentMediaIndex > 0 || currentStoryIndex > 0 ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0, 0, 0, 0.5)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              zIndex: 2
            }}
          >
            <FiChevronLeft size={24} />
          </button>
        ) : null}

        {currentMediaIndex < currentStory.files.length - 1 || currentStoryIndex < stories.length - 1 ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0, 0, 0, 0.5)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              zIndex: 2
            }}
          >
            <FiChevronRight size={24} />
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default StoryViewer;
