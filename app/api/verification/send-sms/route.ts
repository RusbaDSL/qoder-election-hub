import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { to, code, electionName } = await req.json()

    if (!to || !code) {
      return NextResponse.json({ error: 'Missing "to" or "code"' }, { status: 400 })
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromPhone = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !fromPhone) {
      return NextResponse.json({ error: 'Twilio credentials not configured' }, { status: 500 })
    }

    const message = electionName 
      ? `Your verification code for ${electionName} is: ${code}. It expires in 15 minutes.`
      : `Your verification code is: ${code}. It expires in 15 minutes.`

    // Create authorization header for Twilio API
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: fromPhone,
        Body: message,
      }),
    })

    if (!res.ok) {
      const details = await res.json()
      console.error('Twilio SMS send failed:', details)
      return NextResponse.json({ error: 'Failed to send SMS', details }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ success: true, messageId: data.sid })
  } catch (error) {
    console.error('SMS verification error:', error)
    return NextResponse.json({ error: 'Unexpected error sending SMS' }, { status: 500 })
  }
}
