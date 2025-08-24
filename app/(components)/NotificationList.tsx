
"use client";
import { useEffect, useState, useCallback } from "react";

// Types for better code organization and type safety
interface Notification {
  id: string;
  type: string;
  actorName: string;
  text: string;
  read: boolean;
  createdAt: string;
  objectId?: string;
  objectType?: string;
}

interface NotificationToast {
  message: string;
  type: 'success' | 'error';
}

// Utility functions
function getUserId() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("insyd_user");
  }
  return null;
}

function formatRelativeTime(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

function truncateText(str: string, n: number) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

// Toast notification system
function useNotificationToast() {
  const [toast, setToast] = useState<NotificationToast | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const Toast = toast ? (
    <div
      className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white 
      transform transition-all duration-300 ease-in-out
      ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
      style={{ animation: 'slideIn 0.3s ease-out' }}
    >
      {toast.message}
    </div>
  ) : null;

  return { Toast, showToast };
}

// Notification content renderer
function NotificationContent({ n }: { n: Notification }) {
  const content = {
    'new_post': <>{n.actorName} created a new post{n.text && <>: <span className="italic">{truncateText(n.text, 60)}</span></>}</>,
    'new_like': <>{n.actorName} liked your post{n.text && <>: <span className="italic">{truncateText(n.text, 60)}</span></>}</>,
    'new_follow': <>{n.actorName} started following you</>,
  }[n.type] || <>{n.text}</>;

  return (
    <div className="flex flex-col">
      <div className="font-medium text-gray-900 leading-snug">{content}</div>
      <div className="text-xs text-gray-500 mt-1">{formatRelativeTime(n.createdAt)}</div>
    </div>
  );
}

// Main component
export default function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sort, setSort] = useState<'chrono' | 'ai'>('chrono');
  const [loading, setLoading] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const { Toast, showToast } = useNotificationToast();

  // Set up user ID from local storage
  useEffect(() => {
    setUserId(getUserId());
  }, []);

  // Fetch notifications with error handling
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/users/${userId}/notifications?sort=${sort}&unreadOnly=${unreadOnly}&limit=50`
      );
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      showToast('Failed to load notifications', 'error');
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, sort, unreadOnly, showToast]);

  // Set up polling for real-time updates
  useEffect(() => {
    fetchNotifications();
    const pollInterval = setInterval(fetchNotifications, 15000); // Poll every 15 seconds
    return () => clearInterval(pollInterval);
  }, [fetchNotifications]);

  // Handle marking notifications as read
  const markRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      if (!response.ok) throw new Error('Failed to mark as read');
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      showToast('Marked as read', 'success');
    } catch (error) {
      showToast('Failed to mark as read', 'error');
      console.error('Error marking as read:', error);
    }
  };

  // Handle demo event creation
  const triggerDemoEvent = async (type: "new_post" | "new_like" | "new_follow") => {
    if (!userId) return;
    setDemoLoading(true);
    try {
      const usersRes = await fetch("/api/seed");
      const usersData = await usersRes.json();
      const users = usersData.users.filter((u: any) => u.id !== userId);
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      let event: any = { type, actorId: userId };
      
      switch (type) {
        case "new_post":
          event = { 
            ...event, 
            objectType: "post", 
            objectId: "", 
            text: `A new post from ${randomUser.name}` 
          };
          break;
        case "new_like":
          const postsRes = await fetch(`/api/users/${randomUser.id}/notifications?sort=chrono&limit=1`);
          const postsData = await postsRes.json();
          event = { 
            ...event, 
            objectType: "post", 
            objectId: postsData.notifications[0]?.objectId || "", 
            text: `Liked a post by ${randomUser.name}` 
          };
          break;
        case "new_follow":
          event = { 
            ...event, 
            objectType: "user", 
            objectId: randomUser.id, 
            text: `Started following ${randomUser.name}` 
          };
          break;
      }

      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });

      if (!response.ok) throw new Error('Failed to create demo event');
      showToast(`Demo ${type.replace('new_', '')} created`, 'success');
      
      // Wait briefly then fetch new notifications
      setTimeout(fetchNotifications, 600);
    } catch (error) {
      showToast('Failed to create demo event', 'error');
      console.error('Error creating demo event:', error);
    } finally {
      setDemoLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="text-center py-12 text-gray-600">
        <div className="text-4xl mb-4">👤</div>
        <p className="font-medium">Please select a user above</p>
        <p className="text-sm mt-2">to view and interact with notifications</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls section */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b pb-4 z-10 px-4 py-3 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-2">
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-full font-medium shadow-sm border transition-all duration-200 
                ${sort === 'chrono' ? 'bg-blue-600 text-white border-blue-600 scale-105' : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50 hover:scale-102'}`}
              onClick={() => setSort('chrono')}
            >
              <span className="flex items-center gap-2">
                <span className="hidden sm:inline">⏱️</span> Chronological
              </span>
            </button>
            <button
              className={`px-4 py-2 rounded-full font-medium shadow-sm border transition-all duration-200 
                ${sort === 'ai' ? 'bg-blue-600 text-white border-blue-600 scale-105' : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50 hover:scale-102'}`}
              onClick={() => setSort('ai')}
            >
              <span className="flex items-center gap-2">
                <span className="hidden sm:inline">🤖</span> AI Ranked
              </span>
            </button>
          </div>
          
          <label className="flex items-center gap-2 ml-0 sm:ml-4">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={e => setUnreadOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm font-medium">Unread only</span>
          </label>

          <div className="flex gap-2 mt-2 sm:mt-0 ml-auto">
            <button
              className="px-3 py-1.5 rounded bg-green-500 text-white text-sm font-medium shadow-sm hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              disabled={demoLoading}
              onClick={() => triggerDemoEvent('new_post')}
            >
              <span className="hidden sm:inline">📝</span> New Post
            </button>
            <button
              className="px-3 py-1.5 rounded bg-blue-500 text-white text-sm font-medium shadow-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              disabled={demoLoading}
              onClick={() => triggerDemoEvent('new_like')}
            >
              <span className="hidden sm:inline">👍</span> Like
            </button>
            <button
              className="px-3 py-1.5 rounded bg-purple-500 text-white text-sm font-medium shadow-sm hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              disabled={demoLoading}
              onClick={() => triggerDemoEvent('new_follow')}
            >
              <span className="hidden sm:inline">👥</span> Follow
            </button>
          </div>
        </div>
      </div>

      {/* Content section */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📭</div>
          <p className="font-medium">No notifications found</p>
          <p className="text-sm mt-2">Try creating some demo interactions!</p>
        </div>
      ) : (
        <ul className="space-y-4 px-4">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`relative rounded-xl shadow-sm border p-4 flex items-center gap-4 
                transition-all duration-200 hover:shadow-md
                ${!n.read 
                  ? 'bg-blue-50/80 border-blue-200 hover:bg-blue-50' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'}`}
            >
              {/* Unread indicator */}
              {!n.read && (
                <span className="absolute left-2 top-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              )}

              {/* Notification icon */}
              <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                ${n.read ? 'bg-gray-100' : 'bg-blue-100'}`}>
                {n.type === 'new_post' && '📝'}
                {n.type === 'new_like' && '👍'}
                {n.type === 'new_follow' && '👥'}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <NotificationContent n={n} />
              </div>

              {/* Action buttons */}
              {!n.read && (
                <button
                  className="shrink-0 ml-4 px-4 py-1.5 text-sm bg-blue-600 text-white rounded-full shadow-sm 
                    hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => markRead(n.id)}
                >
                  Mark as Read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Toast notifications */}
      {Toast}
    </div>
  );
}
