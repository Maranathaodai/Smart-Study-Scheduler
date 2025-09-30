# Environment Variables Setup

This file explains how to set up environment variables for the Smart Study Scheduler app.

## Required Environment Variables

### OpenRouter API Key
1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up for an account
3. Navigate to the API Keys section
4. Create a new API key
5. Copy the API key (it should start with `sk-or-v1-`)

### Setting Up Environment Variables

1. **Update the `.env` file** in the root directory:
   ```
   EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-your_actual_api_key_here
   ```

2. **Replace the placeholder** `sk-or-v1-your_api_key_here` with your actual OpenRouter API key

3. **Restart your development server** after updating the environment variables:
   ```bash
   npm start
   # or
   expo start
   ```

## Testing the Configuration

To verify that your environment variables are properly configured, you can run:

```bash
npx ts-node src/lib/test-config.ts
```

This will check:
- ✅ If environment variables are loaded
- ✅ If the configuration is valid
- ✅ If the API key can be retrieved
- ✅ Display the complete configuration

## Security Notes

- The `.env` file is already included in `.gitignore` to prevent accidental commits
- Never commit API keys to version control
- Keep your API keys secure and don't share them publicly

## Troubleshooting

### Environment Variables Not Loading
1. Make sure the `.env` file is in the root directory (same level as `package.json`)
2. Ensure variable names start with `EXPO_PUBLIC_` for Expo projects
3. Restart your development server after making changes

### API Key Not Working
1. Verify the API key is correct and complete
2. Check that you have sufficient credits/quota on OpenRouter
3. Ensure the API key has the necessary permissions

## File Structure
```
Smart-Study-Scheduler/
├── .env                    # Environment variables (ignored by git)
├── .env.example           # Example environment file (committed to git)
├── src/lib/config.ts      # Configuration file that reads env vars
└── src/lib/test-config.ts # Test script to verify configuration
```