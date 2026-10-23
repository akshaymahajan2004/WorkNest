import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Enterprise EMS Backend server is running on port ${PORT}`);
  console.log(`👉 Health check: http://localhost:${PORT}/api/health`);
});
