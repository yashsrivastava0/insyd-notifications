(
  async () => {
  try {
    const res = await fetch('http://localhost:3000/api/seed');
    const body = await res.json();
    console.log('status', res.status);
    console.log(JSON.stringify(body, null, 2));
  } catch (e) {
    console.error('fetch error', e);
  }
})();
