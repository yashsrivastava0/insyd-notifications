import NotificationList from '../(components)/NotificationList';

export default function NotificationsPage() {
  return (
    <main className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-xl font-bold mb-4">Notifications</h1>
      <NotificationList />
    </main>
  );
}
