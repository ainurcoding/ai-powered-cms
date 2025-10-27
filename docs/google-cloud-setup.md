# Google Cloud Vertex AI Setup Guide

## Overview
This guide will help you set up Google Cloud Vertex AI with Imagen 4 for image generation in the AI CMS.

## Prerequisites
- Google Cloud account
- Billing enabled on your Google Cloud project
- Node.js project with the AI CMS backend

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "ai-cms-vertex-ai")
4. Click "Create"

## Step 2: Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search and enable these APIs:
   - **Vertex AI API**
   - **Cloud Resource Manager API**
   - **Service Usage API**

## Step 3: Create Service Account

1. Go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Enter details:
   - **Name**: `ai-cms-vertex-ai`
   - **Description**: `Service account for AI CMS Vertex AI integration`
4. Click "Create and Continue"
5. Add these roles:
   - **Vertex AI User**
   - **Storage Object Admin** (if saving images to Cloud Storage)
6. Click "Done"

## Step 4: Generate Service Account Key

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Select "JSON" format
5. Click "Create"
6. Download the JSON file and save it securely

## Step 5: Configure Environment Variables

1. Copy the downloaded JSON file to your project directory
2. Add these variables to your `.env` file:

```bash
# Google Cloud Vertex AI Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id-here
GOOGLE_APPLICATION_CREDENTIALS=./path/to/your-service-account-key.json
```

## Step 6: Test the Integration

1. Start your AI CMS server
2. Test image generation endpoint:
   ```bash
   curl -X POST http://localhost:8000/ai/generate-image \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "prompt": "a beautiful sunset over mountains",
       "style": "photographic",
       "size": "medium",
       "aspectRatio": "16:9"
     }'
   ```

## Troubleshooting

### Common Issues

1. **Authentication Error**
   - Verify `GOOGLE_APPLICATION_CREDENTIALS` path is correct
   - Check service account has proper permissions

2. **API Not Enabled**
   - Ensure Vertex AI API is enabled in your project
   - Check billing is enabled

3. **Quota Exceeded**
   - Check your Vertex AI quotas in Google Cloud Console
   - Consider requesting quota increase

4. **Project Not Found**
   - Verify `GOOGLE_CLOUD_PROJECT_ID` is correct
   - Ensure project exists and you have access

### Logs and Monitoring

- Check server logs for detailed error messages
- Monitor Vertex AI usage in Google Cloud Console
- Use Cloud Logging for debugging

## Cost Considerations

- Vertex AI Imagen 4 pricing is per image generated
- Check current pricing in Google Cloud Console
- Set up billing alerts to monitor usage
- Consider implementing usage limits in your application

## Security Best Practices

1. **Never commit service account keys to version control**
2. **Use environment variables for sensitive data**
3. **Rotate service account keys regularly**
4. **Use least privilege principle for permissions**
5. **Enable audit logging for production use**

## Support

- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Imagen Documentation](https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview)
- [Google Cloud Support](https://cloud.google.com/support)
