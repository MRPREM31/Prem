fetch('https://prem-backend-9icx.onrender.com/api/projects')
  .then(res => res.json())
  .then(data => console.log('Success:', data))
  .catch(err => console.error('Error:', err));
