
"use client";
import { useState } from 'react';

export default function DigestPage() {
  const [digest, setDigest] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function formatRelativeTime(dateStr: string | null) {
    if (!dateStr) return 'never';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  }

  async function generateDigest() {
    setLoading(true);
    setError('');
    setDigest('');
    const userId = typeof window !== 'undefined' ? localStorage.getItem('insyd_user') : null;
    if (!userId) {
      setError('Select a user first.');
      setLoading(false);
      return;
    }
    const [notifRes, activityRes] = await Promise.all([
      fetch(`/api/users/${userId}/notifications?sort=ai&unreadOnly=true&limit=100`),
      fetch(`/api/users/${userId}/activity?days=7`),
    ]);
    const [data, activity] = await Promise.all([notifRes.json(), activityRes.json()]);
    if (!data.notifications) {
      setError('No notifications.');
      setLoading(false);
      return;
    }
    // Group by type
    const counts: Record<string, number> = {};
    for (const n of data.notifications) {
      counts[n.type] = (counts[n.type] || 0) + 1;
    }
    const summary = `Today: ${counts['new_follow'] || 0} new follows, ${counts['new_like'] || 0} likes, ${counts['new_comment'] || 0} comments, ${counts['new_post'] || 0} new posts.`
      + `\nActions performed (last 7 days): ${activity.postsMade || 0} posts made (last: ${formatRelativeTime(activity.lastPostAt || null)}), ${activity.likesMade || 0} likes given (last: ${formatRelativeTime(activity.lastLikeAt || null)}), ${activity.followsMade || 0} follows made (last: ${formatRelativeTime(activity.lastFollowAt || null)}).`;
    setDigest(summary);
    setLoading(false);
  }

  return (
    <main className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-xl font-bold mb-4">Digest</h1>
      <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={generateDigest} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Digest'}
      </button>
      {digest && <div className="mt-4 p-3 bg-gray-100 rounded">{digest}</div>}
      {error && <div className="mt-4 text-red-600">{error}</div>}
    </main>
  );
}
