# Deployment Guide - Log Sentinel Watcher

## Deploying to Vercel

### Prerequisites
- Node.js 18+ installed
- Vercel CLI installed (`npm i -g vercel`)
- Git repository set up

### Step 1: Prepare Your Application

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Test the build locally:**
   ```bash
   npm run build
   ```

3. **Verify the build output:**
   ```bash
   npm run preview
   ```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI
1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Follow the prompts:**
   - Link to existing project or create new
   - Confirm build settings
   - Deploy

#### Option B: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Configure build settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Deploy

### Step 3: Environment Variables (Optional)

If you need environment variables in production:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add any required variables (see `env.example`)

### Step 4: Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Navigate to Settings > Domains
3. Add your custom domain
4. Configure DNS settings as instructed

### Step 5: Verify Deployment

1. Check that your application loads correctly
2. Test all major features:
   - CSV file upload
   - Log parsing
   - Threat detection
   - Analytics
   - Reports generation

## Production Considerations

### Performance
- The app is optimized with code splitting
- Static assets are cached
- Bundle size is minimized

### Security
- Security headers are configured in `vercel.json`
- No sensitive data is exposed in client-side code
- File uploads are limited to safe formats

### Monitoring
- Consider adding error tracking (Sentry, LogRocket)
- Monitor performance with Vercel Analytics
- Set up uptime monitoring

## Troubleshooting

### Build Failures
- Check Node.js version (requires 18+)
- Verify all dependencies are installed
- Check for TypeScript errors: `npm run lint`

### Runtime Issues
- Check browser console for errors
- Verify environment variables are set correctly
- Test with different browsers

### Performance Issues
- Check bundle size in Vercel dashboard
- Monitor Core Web Vitals
- Consider implementing lazy loading for heavy components

## Support

For issues with:
- **Vercel deployment**: Check Vercel documentation
- **Application functionality**: Review the codebase
- **Build errors**: Check the build logs in Vercel dashboard 