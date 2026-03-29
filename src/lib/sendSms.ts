'use server';

import 'server-only';

interface SendSmsParams {
  phoneNumber: string;
  message: string;
}

export async function sendSms({ phoneNumber, message }: SendSmsParams): Promise<void> {
  const apiKey = process.env.ARKESEL_API_KEY;
  const senderId = process.env.ARKESEL_SENDER_ID;
  
  const apiUrl = 'https://sms.arkesel.com/api/v2/sms/send';

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
  
  const payload = {
    "action": "send-sms",
    "api_key": apiKey,
    "to": phoneNumber,
    "from": senderId,
    "sms": message
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();
    if (responseData.code === "ok" || response.ok) {
        console.log('SMS sent successfully via Arkesel:', responseData);
    } else {
        console.error(`Failed to send SMS via Arkesel. Status: ${response.status}`, responseData);
    }
  } catch (error) {
    console.error('An error occurred while sending SMS via Arkesel:', error);
  }
}
