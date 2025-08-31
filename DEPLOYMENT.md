# Deployment Guide

This guide will help you deploy the chat application to various platforms.

## Prerequisites

1. **MongoDB Atlas Account** (for database)
2. **GitHub Account** (for code hosting)
3. **Render/Heroku Account** (for backend)
4. **Vercel/Netlify Account** (for frontend)

## Step 1: Set Up MongoDB Atlas

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account

2. **Create a Cluster**
   - Choose the free tier (M0)
   - Select your preferred cloud provider and region
   - Click "Create Cluster"

3. **Set Up Database Access**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Create a username and password (save these!)
   - Select "Read and write to any database"
   - Click "Add User"

4. **Set Up Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Clusters" and click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `chatdb`

## Step 2: Deploy Backend to Render

1. **Create Render Account**
   - Go to [Render](https://render.com)
   - Sign up with your GitHub account

2. **Create New Web Service**
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Select the repository

3. **Configure the Service**
   - **Name**: `chat-app-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. **Set Environment Variables**
   - Click "Environment" tab
   - Add the following variables:
     ```
     MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatdb
     JWT_SECRET=your-super-secret-jwt-key-here
     PORT=5000
     CORS_ORIGIN=https://your-frontend-url.vercel.app
     ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Copy the service URL (e.g., `https://chat-app-backend.onrender.com`)

## Step 3: Deploy Frontend to Vercel

1. **Create Vercel Account**
   - Go to [Vercel](https://vercel.com)
   - Sign up with your GitHub account

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository

3. **Configure the Project**
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

4. **Set Environment Variables**
   - Go to "Settings" → "Environment Variables"
   - Add the following variables:
     ```
     REACT_APP_API_URL=https://your-backend-url.onrender.com
     REACT_APP_SOCKET_URL=https://your-backend-url.onrender.com
     ```

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Copy the frontend URL

## Step 4: Update Configuration

1. **Update Backend CORS**
   - Go back to Render dashboard
   - Update the `CORS_ORIGIN` environment variable with your frontend URL
   - Redeploy the service

2. **Update Frontend Config**
   - In your local `client/src/config.js`:
   ```javascript
   const config = {
     API_URL: "https://your-backend-url.onrender.com",
     SOCKET_URL: "https://your-backend-url.onrender.com"
   };
   ```

## Alternative: Deploy to Heroku

### Backend to Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku App**
   ```bash
   cd server
   heroku create your-chat-app-backend
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set MONGODB_URI="your-mongodb-connection-string"
   heroku config:set JWT_SECRET="your-jwt-secret"
   heroku config:set CORS_ORIGIN="https://your-frontend-url.vercel.app"
   ```

5. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

### Frontend to Netlify

1. **Create Netlify Account**
   - Go to [Netlify](https://netlify.com)
   - Sign up with your GitHub account

2. **Deploy from Git**
   - Click "New site from Git"
   - Connect your GitHub repository
   - Set build settings:
     - **Base directory**: `client`
     - **Build command**: `npm run build`
     - **Publish directory**: `build`

3. **Set Environment Variables**
   - Go to "Site settings" → "Environment variables"
   - Add the same variables as Vercel

## Environment Variables Reference

### Backend Variables
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatdb
JWT_SECRET=your-super-secret-jwt-key-here
PORT=5000
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

### Frontend Variables
```bash
REACT_APP_API_URL=https://your-backend-url.onrender.com
REACT_APP_SOCKET_URL=https://your-backend-url.onrender.com
```

## Testing Your Deployment

1. **Test Backend**
   - Visit `https://your-backend-url.onrender.com/health`
   - Should return: `{"status":"OK","message":"Server is running"}`

2. **Test Frontend**
   - Visit your frontend URL
   - Try to register/login
   - Test real-time messaging

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `CORS_ORIGIN` is set correctly in backend
   - Check that frontend URL matches exactly

2. **MongoDB Connection Issues**
   - Verify connection string is correct
   - Check network access settings in Atlas
   - Ensure database user has correct permissions

3. **Socket.IO Connection Issues**
   - Verify `SOCKET_URL` is set correctly
   - Check that backend supports WebSocket connections

4. **Build Failures**
   - Check that all dependencies are in `package.json`
   - Verify build commands are correct
   - Check for syntax errors in code

### Debugging

1. **Check Logs**
   - Render: Go to your service → "Logs"
   - Vercel: Go to your project → "Functions" → "Logs"
   - Heroku: `heroku logs --tail`

2. **Test Locally**
   - Test with production environment variables
   - Verify all API endpoints work

## Security Considerations

1. **JWT Secret**
   - Use a strong, random secret
   - Never commit secrets to Git
   - Rotate secrets regularly

2. **MongoDB Security**
   - Use strong passwords
   - Restrict network access when possible
   - Enable MongoDB Atlas security features

3. **CORS**
   - Only allow necessary origins
   - Don't use wildcards in production

## Performance Optimization

1. **Database Indexing**
   - Add indexes for frequently queried fields
   - Monitor query performance

2. **Caching**
   - Consider adding Redis for session storage
   - Cache frequently accessed data

3. **CDN**
   - Use CDN for static assets
   - Enable compression

---

**Remember**: Always test your deployment thoroughly before sharing with users!

