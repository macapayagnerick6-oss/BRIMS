export const environment = {
  production: true,
  /**
   * Backend API base URL for SMS/email notifications.
   * Replace with your deployed backend URL (no trailing slash), e.g.:
   *   https://your-backend.railway.app
   *   https://api.yourdomain.com
   */
  apiBaseUrl: 'https://YOUR_BACKEND_URL',
  firebase: {
    apiKey: 'AIzaSyAd_Cwz636R33yNkEdMVP1afg4VvKNoAQA',
    authDomain: 'brims-2028e.firebaseapp.com',
    projectId: 'brims-2028e',
    storageBucket: 'brims-2028e.firebasestorage.app',
    messagingSenderId: '196835647940',
    appId: '1:196835647940:web:ee812689169edfac364491',
    measurementId: 'G-9X32JTKL7F',
  },
};
