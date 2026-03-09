cat > src/main.jsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);
EOF
git add src/main.jsx
git commit -m "Fix corrupted main.jsx"
git push
