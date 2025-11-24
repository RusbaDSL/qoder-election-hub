import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { to, code, electionName } = await req.json()

    if (!to || !code) {
      return NextResponse.json({ error: 'Missing "to" or "code"' }, { status: 400 })
    }

    const token = process.env.MAILTRAP_API_TOKEN
    const fromEmail = process.env.MAILTRAP_SENDER_EMAIL || 'no-reply@electionhub.local'
    const fromName = process.env.MAILTRAP_SENDER_NAME || 'Election Hub'

    if (!token) {
      console.error('Mailtrap token not configured in environment variables')
      return NextResponse.json({ error: 'Mailtrap token not configured' }, { status: 500 })
    }

    const subject = `Your verification code${electionName ? ` for ${electionName}` : ''}`
    const text = `Your verification code is ${code}. It expires in 15 minutes.\n\nIf you did not request this, please ignore.`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Election Hub - Voter Verification</h2>
        ${electionName ? `<p style="color: #4b5563;">Election: <strong>${electionName}</strong></p>` : ''}
        <p style="font-size: 16px; color: #1f2937;">Your verification code is:</p>
        <div style="background-color: #eff6ff; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e40af;">${code}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code expires in 15 minutes.</p>
        <p style="color: #6b7280; font-size: 14px;">If you did not request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">Election Hub - Secure Online Voting Platform</p>
      </div>
    `

    console.log('Sending email via Mailtrap with token:', token ? 'Token present' : 'Token missing')
    console.log('Sending to:', to)
    console.log('From email:', fromEmail)
    console.log('From name:', fromName)

    const res = await fetch('https://send.api.mailtrap.io/api/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: { email: fromEmail, name: fromName },
        to: [{ email: to }],
        subject,
        text,
        html,
        category: 'verification',
      }),
    })

    console.log('Mailtrap response status:', res.status)
    console.log('Mailtrap response headers:', Object.fromEntries(res.headers))

    if (!res.ok) {
      const details = await res.text()
      console.error('Mailtrap send failed with status:', res.status)
      console.error('Mailtrap error details:', details)
      return NextResponse.json({ 
        error: 'Failed to send email', 
        details,
        status: res.status 
      }, { status: 500 })
    }

    const result = await res.json()
    console.log('Mailtrap success response:', result)
    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Verification email error:', error)
    return NextResponse.json({ 
      error: 'Unexpected error sending email', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
