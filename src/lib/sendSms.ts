'use server';

import 'server-only';

interface SendSmsParams {
  phoneNumber: string;
  message: string;
}

export async function sendSms({ phoneNumber, message }: SendSmsParams): Promise<void> {
  const apiKey = process.env.ARKESEL_API_KEY;
  const senderId = process.env.ARKESEL_SENDER_ID;
  
  const baseUrl = 'https://sms.arkesel.com/sms/api';

  if (!apiKey) {
    console.error('Arkesel API Key is not configured in environment variables (ARKESEL_API_KEY).');
    return;
  }
  
  if (!senderId) {
    console.error('Arkesel Sender ID is not configured in environment variables (ARKESEL_SENDER_ID).');
    return;
  }
  
  if (!phoneNumber || !message) {
    console.error('SMS requires a phone number and a message.');
    return;
  }
  
  const params = new URLSearchParams({
    action: 'send-sms',
    api_key: apiKey,
    to: phoneNumber,
    from: senderId,
    sms: message,
  });

  const apiUrl = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
    });

    if (response.ok) {
        const responseData = await response.json();
        if (responseData.code === "ok") {
            console.log('SMS sent successfully via Arkesel:', responseData);
        } else {
            console.error(`Arkesel API returned an error. Status: ${response.status}`, responseData);
        }
    } else {
        const errorText = await response.text();
        console.error(`Failed to send SMS via Arkesel. HTTP Status: ${response.status}`, errorText);
    }
  } catch (error) {
    console.error('An error occurred while sending SMS via Arkesel:', error);
  }
}
