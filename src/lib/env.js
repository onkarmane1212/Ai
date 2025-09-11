export function validateEnv() {
  const requiredVars = ['OPENAI_API_KEY'];
  const missingVars = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease add them to your .env.local file and restart the server.');
    process.exit(1);
  }

  console.log('✅ Environment variables validated successfully');
}
