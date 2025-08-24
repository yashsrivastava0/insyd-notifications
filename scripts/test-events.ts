const base = 'http://localhost:3000';

async function postEvent(body: any) {
  const res = await fetch(`${base}/api/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();
  console.log('POST', body.type, '=>', res.status, data);
}

async function getNotifications(userId: string) {
  const res = await fetch(`${base}/api/users/${userId}/notifications?sort=chrono&limit=10`);
  const data = await res.json();
  console.log('NOTIFS for', userId, JSON.stringify(data, null, 2));
}

(async () => {
  try {
    await postEvent({ type: 'new_post', actorId: 'cmepat7aw003jyc737ctko6ug', text: 'Hello from Alice (test)' });
    await postEvent({ type: 'new_like', actorId: 'cmepat7aw003kyc73mntv4egv', targetUserId: 'cmepat7aw003jyc737ctko6ug', text: 'Nice post' });
    await postEvent({ type: 'new_follow', actorId: 'cmepat7aw003lyc73imaskfl5', followeeId: 'cmepat7aw003myc73cnuhzlcr' });
    await getNotifications('cmepat7aw003jyc737ctko6ug');
  } catch (e) {
    console.error(e);
  }
})();
