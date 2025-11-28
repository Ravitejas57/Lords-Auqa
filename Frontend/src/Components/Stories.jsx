import React from 'react';
import { FiCircle } from 'react-icons/fi';

const Stories = ({ stories, onStoryPress, showDelete = false, onDelete }) => {
  if (!stories || stories.length === 0) {
    return null;
  }

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getFirstMediaUrl = (files) => {
    if (!files || files.length === 0) return null;
    return files[0].url || files[0];
  };

  return (
    <div style={{
      display: 'flex',
      gap: '1rem',
      overflowX: 'auto',
      padding: '0.5rem 0',
      scrollbarWidth: 'thin',
      scrollbarColor: '#5B7C99 #e5e7eb'
    }}>
      {stories.map((story, index) => {
        const mediaUrl = getFirstMediaUrl(story.files);
        const isVideo = story.files && story.files[0] && (story.files[0].mimetype?.startsWith('video') || story.files[0].url?.includes('.mp4'));

        return (
          <div
            key={story._id || index}
            style={{
              position: 'relative',
              flexShrink: 0,
              cursor: 'pointer'
            }}
          >
            <div
              onClick={() => onStoryPress(index)}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                border: `3px solid ${story.read ? '#e5e7eb' : '#5B7C99'}`,
                padding: '3px',
                background: 'white',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                overflow: 'hidden',
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {mediaUrl ? (
                  isVideo ? (
                    <video
                      src={mediaUrl}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <img
                      src={mediaUrl}
                      alt="Story"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  )
                ) : (
                  <FiCircle size={24} color="#9ca3af" />
                )}
              </div>
            </div>

            {/* Time indicator */}
            <div style={{
              position: 'absolute',
              bottom: '-4px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'white',
              padding: '2px 6px',
              borderRadius: '8px',
              fontSize: '10px',
              fontWeight: '600',
              color: '#6b7280',
              border: '1px solid #e5e7eb',
              whiteSpace: 'nowrap'
            }}>
              {getTimeAgo(story.createdAt)}
            </div>

            {/* Delete button for admin */}
            {showDelete && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(story._id);
                }}
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: '2px solid white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '700',
                  padding: 0,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Stories;
