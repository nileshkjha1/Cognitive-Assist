import emailjs from '@emailjs/browser';

// To make this fully functional without external overrides, create a free account at https://emailjs.com
// 1. Create an Email Service (e.g. Gmail) -> Get Service ID
// 2. Create an Email Template -> Get Template ID
// 3. Get Public Key from Account -> API Keys
const SERVICE_ID = "YOUR_SERVICE_ID";
const TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const PUBLIC_KEY = "YOUR_PUBLIC_KEY";

export const sendSafeZoneAlert = async (toEmail: string, distance: number) => {
  try {
    const templateParams = {
      to_email: toEmail,
      message: `CRITICAL ALERT: Patient has breached the safe zone parameters! Currently ${distance}m away from the center perimeter at ${new Date().toLocaleTimeString()}.`,
      distance: distance
    };

    if (SERVICE_ID === "YOUR_SERVICE_ID") {
      console.warn("EmailJS is not configured. Email will not be sent automatically. Please configure keys in emailUtils.ts to enable functional dispatch.");
      
      // Fallback for immediate functional testing without keys triggering local desktop clients
      window.open(`mailto:${toEmail}?subject=URGENT:%20Safe%20Zone%20Breach&body=${encodeURIComponent(templateParams.message)}`, '_blank');
      return false;
    }

    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log('EMAIL SENT SUCCESS!', response.status, response.text);
    return true;
  } catch (err) {
    console.error('EMAIL FAILED...', err);
    return false;
  }
};
