export default () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiUrl: process.env.API_URL || 'http://localhost:4000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/markethub?schema=public',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'markethub_default_access_secret_2026',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'markethub_default_refresh_secret_2026',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  platform: {
    defaultCommissionBps: parseInt(process.env.DEFAULT_COMMISSION_RATE_BPS || '1000', 10),
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    localDir: process.env.LOCAL_UPLOAD_DIR || './uploads',
    s3Endpoint: process.env.S3_ENDPOINT,
    s3Bucket: process.env.S3_BUCKET || 'markethub-uploads',
    s3Region: process.env.S3_REGION || 'ap-south-1',
    s3AccessKey: process.env.S3_ACCESS_KEY,
    s3SecretKey: process.env.S3_SECRET_KEY,
  },
  payment: {
    provider: process.env.PAYMENT_PROVIDER || 'mock',
    publicKey: process.env.PAYMENT_PUBLIC_KEY || 'mock_pk_test',
    secretKey: process.env.PAYMENT_SECRET_KEY || 'mock_sk_test',
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || 'mock_whsec_test',
  },
});
