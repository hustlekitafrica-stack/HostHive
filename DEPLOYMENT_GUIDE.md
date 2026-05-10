# Deployment Guide — HostBooks KE

## Pre-Deployment Checklist

### Code Quality
- [ ] Run `npm run lint` — Fix all linting errors
- [ ] Run `npm test` — All tests passing
- [ ] Run `npm run build` — Build succeeds without errors
- [ ] Review console for warnings

### Environment Setup
- [ ] Create production Supabase project
- [ ] Set up production database
- [ ] Configure RLS policies
- [ ] Create storage buckets
- [ ] Generate API keys

### Security
- [ ] Review `.env.local` — Never commit secrets
- [ ] Enable HTTPS on production domain
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable authentication

### Performance
- [ ] Optimize images
- [ ] Enable caching headers
- [ ] Minify CSS/JS
- [ ] Set up CDN
- [ ] Monitor bundle size

---

## Environment Variables

### Production (.env.production)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_APP_URL=https://hostbooks-ke.com

# Analytics (optional)
NEXT_PUBLIC_GA_ID=your_google_analytics_id

# Error Tracking (optional)
SENTRY_DSN=your_sentry_dsn
```

### Development (.env.local)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Deployment Options

### Option 1: Vercel (Recommended)

**Advantages:**
- Zero-config Next.js deployment
- Automatic deployments from Git
- Built-in analytics and monitoring
- Free tier available
- Automatic HTTPS

**Steps:**
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Select your repository
5. Add environment variables
6. Click "Deploy"

**Environment Variables in Vercel:**
- Go to Settings → Environment Variables
- Add all production variables
- Redeploy after adding

### Option 2: Netlify

**Advantages:**
- Easy Git integration
- Built-in CI/CD
- Form handling
- Serverless functions
- Free tier available

**Steps:**
1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "New site from Git"
4. Select your repository
5. Set build command: `npm run build`
6. Set publish directory: `.next`
7. Add environment variables
8. Deploy

### Option 3: Self-Hosted (AWS, DigitalOcean, etc.)

**Advantages:**
- Full control
- Custom configurations
- Scalability options
- Cost optimization

**Steps:**
1. Set up server (Ubuntu 22.04 recommended)
2. Install Node.js and npm
3. Clone repository
4. Install dependencies: `npm install`
5. Build app: `npm run build`
6. Set up PM2 for process management
7. Configure Nginx as reverse proxy
8. Set up SSL with Let's Encrypt
9. Configure domain DNS

**PM2 Setup:**
```bash
npm install -g pm2
pm2 start npm --name "hostbooks-ke" -- start
pm2 save
pm2 startup
```

**Nginx Configuration:**
```nginx
server {
    listen 443 ssl http2;
    server_name hostbooks-ke.com;

    ssl_certificate /etc/letsencrypt/live/hostbooks-ke.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hostbooks-ke.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Database Migration

### 1. Backup Production Database
```bash
# Using Supabase CLI
supabase db pull --db-url postgresql://...
```

### 2. Run Migrations
```bash
# All migrations are in sql/ folder
# Apply them in order:
# 01_core_tables.sql
# 02_rls_policies.sql
# 03_storage_and_seed.sql
```

### 3. Verify Data
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check row counts
SELECT COUNT(*) FROM properties;
SELECT COUNT(*) FROM bookings;
SELECT COUNT(*) FROM payments;
```

---

## Monitoring & Logging

### Application Monitoring
- **Vercel Analytics** — Built-in performance metrics
- **Sentry** — Error tracking and reporting
- **LogRocket** — Session replay and debugging

### Database Monitoring
- **Supabase Dashboard** — Real-time metrics
- **Query Performance** — Slow query logs
- **Backups** — Automated daily backups

### Health Checks
```bash
# Check app is running
curl https://hostbooks-ke.com/api/health

# Check database connection
curl https://hostbooks-ke.com/api/db-health

# Check Supabase status
curl https://status.supabase.com
```

---

## Scaling Considerations

### Database
- Enable connection pooling
- Add read replicas for reporting
- Archive old data
- Optimize indexes

### Application
- Enable caching (Redis)
- Use CDN for static assets
- Implement rate limiting
- Add load balancing

### Storage
- Use S3 for file uploads
- Enable CloudFront CDN
- Set expiration policies
- Monitor storage costs

---

## Rollback Plan

### If Deployment Fails
1. Check error logs
2. Revert to previous version
3. Fix issues locally
4. Test thoroughly
5. Redeploy

### Vercel Rollback
- Go to Deployments
- Click previous deployment
- Click "Promote to Production"

### Manual Rollback
```bash
git revert <commit-hash>
git push origin main
# Redeploy automatically
```

---

## Post-Deployment

### Verification
- [ ] Test all features work
- [ ] Check performance metrics
- [ ] Verify email notifications
- [ ] Test payment processing
- [ ] Check file uploads
- [ ] Verify API endpoints

### Monitoring
- [ ] Set up alerts
- [ ] Monitor error rates
- [ ] Track performance metrics
- [ ] Review user feedback
- [ ] Check server logs

### Optimization
- [ ] Analyze performance
- [ ] Optimize slow queries
- [ ] Reduce bundle size
- [ ] Improve caching
- [ ] Update dependencies

---

## Maintenance Schedule

### Daily
- Monitor error logs
- Check uptime status
- Review user reports

### Weekly
- Review performance metrics
- Update dependencies
- Run security scans
- Backup database

### Monthly
- Full system audit
- Performance optimization
- Security review
- Cost analysis

### Quarterly
- Major version updates
- Architecture review
- Capacity planning
- Disaster recovery test

---

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Error
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Test connection
psql postgresql://user:password@host/database
```

### High Memory Usage
```bash
# Check Node process
ps aux | grep node

# Increase memory limit
NODE_OPTIONS=--max-old-space-size=4096 npm start
```

### Slow Performance
```bash
# Check database queries
SELECT query, calls, mean_time FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;

# Check API response times
# Use Vercel Analytics or Sentry
```

---

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database backups enabled
- [ ] RLS policies configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Dependencies updated
- [ ] Security headers set
- [ ] API authentication required
- [ ] Sensitive data encrypted

---

## Cost Optimization

### Supabase
- Use appropriate plan
- Monitor storage usage
- Optimize queries
- Archive old data

### Vercel/Netlify
- Monitor bandwidth
- Use edge caching
- Optimize images
- Reduce bundle size

### Storage
- Use S3 lifecycle policies
- Compress files
- Delete old backups
- Monitor costs

---

## Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **Netlify Docs:** https://docs.netlify.com
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **HostBooks KE Docs:** See PHASE_*.md files

---

**Status:** Deployment guide complete ✅

Ready to deploy your app!
