'use server';

import 'server-only';

interface SendSmsParams {
  phoneNumber: string;
  message: string;
}

export async function sendSms({ phoneNumber, message }: SendSmsParams): Promise<void> {
  const apiKey = process.env.SENDEXA_API_KEY;
  const apiSecret = process.env.SENDEXA_SECRET_KEY;
  const senderId = process.env.SENDEXA_SENDER_ID;
  
  const apiUrl = 'https://api.sendexa.co/v1/sms/send';

  // Check for placeholder values
  if (apiKey === 'YOUR_API_KEY_HERE' || apiSecret === 'YOUR_API_SECRET_HERE') {
    console.error('Please replace placeholder API credentials in your .env file for Sendexa.');
    return;
  }

  if (!apiKey || !apiSecret || !senderId) {
    console.error('One or more Sendexa environment variables are not configured: API Key, Secret, or Sender ID.');
    return;
  }
  
  if (!phoneNumber || !message) {
    console.error('SMS requires a phone number and a message.');
    return;
  }
  
  const base64token = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

  const payload = {
    to: phoneNumber,
    from: senderId,
    message: message,
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${base64token}`,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();
    if (!response.ok) {
        console.error(`Failed to send SMS via Sendexa. Status: ${response.status}`, responseData);
    } else {
        console.log('SMS sent successfully via Sendexa:', responseData);
    }
  } catch (error) {
    console.error('An error occurred while sending SMS:', error);
  }
}
