# Challenge 4: Sentry Setup Guide

## Quick Setup Instructions

### 1. Create Sentry Account (✅ You're almost done!)

From your screenshot, you're on the final step:

1. **Check the agreement box**: "I agree to the Terms of Service..."
2. **Click "Continue" or "Create Organization"**

### 2. Create Your First Project

After completing signup, Sentry will guide you through project creation:

**Project Configuration**:

- **Platform**: Select **"React"**
- **Project Name**: `delineate-dashboard`
- **Team**: Default (or create new)
- **Alert frequency**: Real-time

### 3. Get Your DSN (Data Source Name)

After creating the project, you'll see a screen with installation instructions.

**Your DSN will look like this**:

```
https://xxxxxxxxxxxxx@o123456.ingest.sentry.io/7654321
```

**Where to find it later**:

1. Go to **Settings** → **Projects** → **delineate-dashboard**
2. Click **Client Keys (DSN)**
3. Copy the **DSN** value

### 4. Add DSN to Your Project

Once you have the DSN, add it to your `.env` file:

```bash
# In the project root directory
echo "VITE_SENTRY_DSN=your-dsn-here" >> .env
```

**Example**:

```env
VITE_SENTRY_DSN=https://abc123def456@o789012.ingest.sentry.io/3456789
```

### 5. Verify Sentry Integration

After starting the dashboard, trigger a test error:

```bash
# From your browser console, or click the "Test Sentry" button in the dashboard
throw new Error("Sentry test error!");
```

Check your Sentry dashboard at: https://sentry.io/organizations/your-org/issues/

---

## Sentry Dashboard Features

### Issues Tab

- View all captured errors
- Filter by environment, release, user
- See error frequency and trends
- Click for detailed stack traces

### Performance Tab

- Track API response times
- Monitor transaction durations
- Identify slow queries

### Alerts

- Set up alerts for error spikes
- Email/Slack notifications
- Custom alert rules

---

## Best Practices

1. **Environments**: Tag errors with `production`, `development`, `staging`
2. **Releases**: Track which version has errors
3. **User Context**: Associate errors with user IDs
4. **Breadcrumbs**: See user actions before error
5. **Source Maps**: Upload for readable stack traces

---

## Troubleshooting

### DSN Not Working?

- Verify DSN is correct (no extra spaces)
- Check CORS settings in Sentry project settings
- Ensure environment variable is loaded: `console.log(import.meta.env.VITE_SENTRY_DSN)`

### No Errors Appearing?

- Check browser console for Sentry initialization messages
- Verify `Sentry.init()` is called before app renders
- Check project quota in Sentry settings

### Source Maps Not Uploading?

- Install `@sentry/vite-plugin`
- Configure in `vite.config.ts`
- Set `SENTRY_AUTH_TOKEN` in CI/CD

---

## Free Tier Limits

Sentry's **Free tier** includes:

- ✅ 5,000 errors per month
- ✅ 10,000 performance units
- ✅ Unlimited projects
- ✅ 30-day data retention
- ✅ Full feature access

**Perfect for hackathon and personal projects!**

---

## Next Steps

Once you have your DSN:

1. **Save it to `.env`**
2. **Start the dashboard**: `npm run dev:frontend`
3. **Test the integration**: Click "Test Sentry" button
4. **Check Sentry dashboard**: See the error appear

---

## Resources

- 📚 [Sentry React Docs](https://docs.sentry.io/platforms/javascript/guides/react/)
- 🎥 [Sentry Quickstart Video](https://www.youtube.com/watch?v=VvpcnxtDZwM)
- 💬 [Sentry Discord Community](https://discord.gg/sentry)
- 📖 [Error Tracking Best Practices](https://docs.sentry.io/product/issues/issue-tracking/)

---

**🎉 You're all set! The dashboard integration is automatic once you add the DSN.**
