import React, { useState, useEffect } from "react";
import { FiCheckCircle, FiClock, FiBell, FiAlertCircle } from "react-icons/fi";
import { markAsRead } from "../services/notificationService";
import { NotificationsProvider, useNotifications } from "../contexts/NotificationsContext";
import { useNavigate } from "react-router-dom";

function UserNotificationsContent() {
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { notifications: rawNotifications, unreadCount, setNotifications, reload } = useNotifications();
  const notifications = Array.isArray(rawNotifications) ? rawNotifications : [];

  useEffect(() => {
    console.log("UserNotifications payload:", notifications);
  }, [notifications]);

  const handleNavigation = (path) => {
    navigate(`/${path}`);
    setNotificationsOpen(false);
  };

  const formatNotifTime = (notif) => {
    const ts = notif.time || notif.sentAt || notif.createdAt || notif.timestamp;
    if (!ts) return "";
    const maybeDate = new Date(ts);
    if (!isNaN(maybeDate)) return maybeDate.toLocaleString();
    return String(ts);
  };

  const handleMarkNotificationAsRead = async (notification) => {
    const notificationId = notification._id || notification.id;
    if (!notificationId) {
      console.warn("markAsRead: missing id", notification);
      return;
    }
    if (notification.read) return;

    const previous = Array.isArray(notifications) ? [...notifications] : [];
    setNotifications(prev => (Array.isArray(prev) ? prev : []).map(n => {
      const id = n._id || n.id;
      return id === notificationId ? { ...n, read: true } : n;
    }));

    try {
      await markAsRead(notificationId);
      // optionally reload for canonical state
      // await reload();
    } catch (err) {
      console.error('Error marking as read:', err);
      setNotifications(previous);
    }
  };

  return (
    <div>
      {/* Toggle button (you may incorporate it in your layout instead) */}
      <button onClick={() => setNotificationsOpen(v => !v)}>Toggle Notifications</button>

      {notificationsOpen && (
        <>
          <div className="dropdown-overlay" onClick={() => setNotificationsOpen(false)} />
          <div className="notifications-dropdown">
            <div className="dropdown-header-text">
              <h3>Notifications</h3>
              <span className="notif-count">{unreadCount ?? 0} new</span>
            </div>
            <div className="notifications-list-dropdown">
              {notifications.length === 0 ? (
                <div style={{ padding: "1rem", textAlign: "center", color: "#999" }}>
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.slice(0, 3).map(notif => {
                  const id = notif._id || notif.id;
                  return (
                    <div key={id}
                      className="notification-item-dropdown"
                      onClick={() => handleMarkNotificationAsRead(notif)}
                      style={{ cursor: notif.read ? "default" : "pointer" }}>
                      <div className={`notif-icon ${notif.type || "info"}`}>
                        {(notif.type === "success" || !notif.type) && <FiCheckCircle />}
                        {notif.type === "warning" && <FiClock />}
                        {notif.type === "info" && <FiBell />}
                        {notif.type === "error" && <FiAlertCircle />}
                      </div>
                      <div className="notif-content-dropdown">
                        <p>{notif.message}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.25rem" }}>
                          <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{formatNotifTime(notif)}</span>
                          {notif.priority && (
                            <span style={{
                              fontSize: "0.7rem", fontWeight: "600", padding: "0.15rem 0.5rem",
                              borderRadius: "10px",
                              backgroundColor:
                                notif.priority === "high" ? "#fee2e2" : notif.priority === "medium" ? "#fef3c7" : "#dbeafe",
                              color: notif.priority === "high" ? "#991b1b" : notif.priority === "medium" ? "#92400e" : "#1e40af"
                            }}>
                              {notif.priority.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <button className="view-all-btn" onClick={() => handleNavigation("notifications")}>View All</button>
          </div>
        </>
      )}

      {/* Full list */}
      <div className="notifications-section">
        <h2 className="section-title">Notifications</h2>
        <p className="section-subtitle">Stay updated</p>
        <div className="notifications-list-full">
          {notifications.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#999" }}>
              <FiBell style={{ fontSize: "3rem", marginBottom: "1rem" }} />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map(notif => {
              const id = notif._id || notif.id;
              return (
                <div key={id}
                  className={`notification-item-full ${notif.read ? "read" : "unread"}`}
                  onClick={() => handleMarkNotificationAsRead(notif)}
                  style={{ cursor: notif.read ? "default" : "pointer" }}>
                  <div className={`notif-icon-wrapper ${notif.type || "info"}`}>
                    {(notif.type === "success" || !notif.type) && <FiCheckCircle />}
                    {notif.type === "warning" && <FiClock />}
                    {notif.type === "info" && <FiBell />}
                    {notif.type === "error" && <FiAlertCircle />}
                  </div>
                  <div className="notif-content-full">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.25rem' }}>
                      <p className="notif-message">{notif.message}</p>
                      {notif.priority && (
                        <span style={{
                          fontSize: '0.75rem', fontWeight: '600', padding: '0.25rem 0.6rem', borderRadius: '12px',
                          marginLeft: '1rem', whiteSpace: 'nowrap',
                          backgroundColor: notif.priority === 'high' ? '#fee2e2' : notif.priority === 'medium' ? '#fef3c7' : '#dbeafe',
                          color: notif.priority === 'high' ? '#991b1b' : notif.priority === 'medium' ? '#92400e' : '#1e40af'
                        }}>
                          {notif.priority.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="notif-time">{formatNotifTime(notif)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function UserNotifications({ mongoIdProp }) {
  // prefer prop, then localStorage as fallback
  const mongoId = mongoIdProp || localStorage.getItem('userMongoId') || null;

  return (
    <NotificationsProvider mongoId={mongoId}>
      <UserNotificationsContent />
    </NotificationsProvider>
  );
}
