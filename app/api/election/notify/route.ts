import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { Database } from '@/lib/database.types'

type ElectionWithCreator = {
  id: string
  name: string
  description: string | null
  organization: string | null
  voting_start_time: string | null
  voting_end_time: string | null
  created_at: string
  creator: {
    email: string
    full_name: string | null
  } | null
}

type ElectionWithStats = {
  id: string
  name: string
  organization: string | null
  voting_start_time: string | null
  voting_end_time: string | null
  is_voting_active: boolean
  total_voters: number
  total_votes_cast: number
  creator: {
    email: string
    full_name: string | null
  } | null
}

type ElectionWithResults = {
  id: string
  name: string
  organization: string | null
  total_voters: number
  total_votes_cast: number
  creator: {
    email: string
    full_name: string | null
  } | null
}

type PositionWithCandidates = {
  id: string
  title: string
  description: string | null
  candidates: {
    id: string
    vote_count: number
    voters: {
      name: string | null
    } | null
  }[]
}

// Function to send election creation notification
export async function sendElectionCreatedNotification(electionId: string) {
  try {
    const supabase = await createClient()
    
    // Get election details with creator info
    const { data: election, error: electionError } = await supabase
      .from('elections')
      .select(`
        id,
        name,
        description,
        organization,
        voting_start_time,
        voting_end_time,
        created_at,
        creator:profiles(email, full_name)
      `)
      .eq('id', electionId)
      .single()

    if (electionError || !election) {
      console.error('Error fetching election for notification:', electionError)
      return { success: false, error: 'Election not found', details: electionError?.message }
    }

    const token = process.env.MAILTRAP_API_TOKEN
    const fromEmail = process.env.MAILTRAP_SENDER_EMAIL || 'no-reply@electionmanager.com.ng'
    const fromName = process.env.MAILTRAP_SENDER_NAME || 'Election Manager'

    if (!token) {
      console.error('Mailtrap token not configured')
      return { success: false, error: 'Mailtrap token not configured' }
    }

    const typedElection = election as ElectionWithCreator;
    
    if (!typedElection.creator?.email) {
      console.error('Creator email not found')
      return { success: false, error: 'Creator email not found' }
    }

    const subject = `Election Created: ${typedElection.name}`
    
    const text = `Hello ${typedElection.creator.full_name || 'Election Creator'},

Your election "${typedElection.name}" has been successfully created.

Election Details:
- Name: ${typedElection.name}
${typedElection.organization ? `- Organization: ${typedElection.organization}` : ''}
${typedElection.description ? `- Description: ${typedElection.description}` : ''}
${typedElection.voting_start_time ? `- Scheduled Start: ${new Date(typedElection.voting_start_time).toLocaleString()}` : ''}
${typedElection.voting_end_time ? `- Scheduled End: ${new Date(typedElection.voting_end_time).toLocaleString()}` : ''}

You can manage your election at: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/elections/${typedElection.id}

Best regards,
Election Manager Team`

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Election Manager - Election Created</h2>
        
        <p>Hello ${typedElection.creator.full_name || 'Election Creator'},</p>
        
        <p>Your election <strong>"${typedElection.name}"</strong> has been successfully created.</p>
        
        <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">Election Details</h3>
          <p><strong>Name:</strong> ${typedElection.name}</p>
          ${typedElection.organization ? `<p><strong>Organization:</strong> ${typedElection.organization}</p>` : ''}
          ${typedElection.description ? `<p><strong>Description:</strong> ${typedElection.description}</p>` : ''}
          ${typedElection.voting_start_time ? `<p><strong>Scheduled Start:</strong> ${new Date(typedElection.voting_start_time).toLocaleString()}</p>` : ''}
          ${typedElection.voting_end_time ? `<p><strong>Scheduled End:</strong> ${new Date(typedElection.voting_end_time).toLocaleString()}</p>` : ''}
        </div>
        
        <p>You can manage your election by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/elections/${typedElection.id}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Manage Election
          </a>
        </div>
        
        <p>Or visit: <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/elections/${typedElection.id}">${process.env.NEXT_PUBLIC_APP_URL}/dashboard/elections/${typedElection.id}</a></p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Election Manager Team</p>
      </div>
    `

    const res = await fetch('https://send.api.mailtrap.io/api/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: { email: fromEmail, name: fromName },
        to: [{ email: typedElection.creator.email }],
        subject,
        text,
        html,
        category: 'election_notification',
      }),
    })

    if (!res.ok) {
      const details = await res.text()
      console.error('Mailtrap send failed:', {
        status: res.status,
        statusText: res.statusText,
        details
      })
      return { success: false, error: 'Failed to send email', details }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Election creation notification error:', error)
    return { success: false, error: 'Unexpected error sending email', details: error.message }
  }
}

// Function to send election status change notification
export async function sendElectionStatusNotification(electionId: string, status: 'started' | 'ended') {
  try {
    const supabase = await createClient()
    
    // Get election details with creator info
    const { data: election, error: electionError } = await supabase
      .from('elections')
      .select(`
        id,
        name,
        organization,
        voting_start_time,
        voting_end_time,
        is_voting_active,
        total_voters,
        total_votes_cast,
        creator:profiles(email, full_name)
      `)
      .eq('id', electionId)
      .single()

    if (electionError || !election) {
      console.error('Error fetching election for status notification:', electionError)
      return { success: false, error: 'Election not found', details: electionError?.message }
    }

    const token = process.env.MAILTRAP_API_TOKEN
    const fromEmail = process.env.MAILTRAP_SENDER_EMAIL || 'no-reply@electionmanager.com.ng'
    const fromName = process.env.MAILTRAP_SENDER_NAME || 'Election Manager'

    if (!token) {
      console.error('Mailtrap token not configured')
      return { success: false, error: 'Mailtrap token not configured' }
    }

    const typedElection = election as ElectionWithStats;
    
    if (!typedElection.creator?.email) {
      console.error('Creator email not found')
      return { success: false, error: 'Creator email not found' }
    }

    const subject = `Election ${status === 'started' ? 'Started' : 'Ended'}: ${typedElection.name}`
    
    const text = `Hello ${typedElection.creator.full_name || 'Election Creator'},

Your election "${typedElection.name}" has ${status === 'started' ? 'has started' : 'has ended'}.

Election Details:
- Name: ${typedElection.name}
${typedElection.organization ? `- Organization: ${typedElection.organization}` : ''}
${status === 'started' ? `- Started at: ${new Date().toLocaleString()}` : `- Ended at: ${new Date().toLocaleString()}`}
- Total Voters: ${typedElection.total_voters || 0}
- Votes Cast: ${typedElection.total_votes_cast || 0}

${status === 'ended' ? 'You can view the final results at: ' + process.env.NEXT_PUBLIC_APP_URL + '/election/' + typedElection.id + '/stats' : 'Voting is now active for your election.'}

Best regards,
Election Manager Team`

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Election Manager - Election ${status === 'started' ? 'Started' : 'Ended'}</h2>
        
        <p>Hello ${typedElection.creator.full_name || 'Election Creator'},</p>
        
        <p>Your election <strong>"${typedElection.name}"</strong> has ${status === 'started' ? 'started' : 'ended'}.</p>
        
        <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">Election Details</h3>
          <p><strong>Name:</strong> ${typedElection.name}</p>
          ${typedElection.organization ? `<p><strong>Organization:</strong> ${typedElection.organization}</p>` : ''}
          <p><strong>${status === 'started' ? 'Started' : 'Ended'}:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Voters:</strong> ${typedElection.total_voters || 0}</p>
          <p><strong>Votes Cast:</strong> ${typedElection.total_votes_cast || 0}</p>
        </div>
        
        ${status === 'ended' ? `
          <p>You can view the final results by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/election/${typedElection.id}/stats" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Final Results
            </a>
          </div>
          
          <p>Or visit: <a href="${process.env.NEXT_PUBLIC_APP_URL}/election/${typedElection.id}/stats">${process.env.NEXT_PUBLIC_APP_URL}/election/${typedElection.id}/stats</a></p>
        ` : `
          <p>Voting is now active for your election. Voters can participate at:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/election/${typedElection.id}/stats" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Election Page
            </a>
          </div>
        `}
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Election Manager Team</p>
      </div>
    `

    const res = await fetch('https://send.api.mailtrap.io/api/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: { email: fromEmail, name: fromName },
        to: [{ email: typedElection.creator.email }],
        subject,
        text,
        html,
        category: 'election_notification',
      }),
    })

    if (!res.ok) {
      const details = await res.text()
      console.error('Mailtrap send failed:', {
        status: res.status,
        statusText: res.statusText,
        details
      })
      return { success: false, error: 'Failed to send email', details }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Election status notification error:', error)
    return { success: false, error: 'Unexpected error sending email', details: error.message }
  }
}

// Function to send final results notification
export async function sendElectionResultsNotification(electionId: string) {
  try {
    const supabase = await createClient()
    
    // Get election details with positions and candidates
    const { data: election, error: electionError } = await supabase
      .from('elections')
      .select(`
        id,
        name,
        organization,
        total_voters,
        total_votes_cast,
        creator:profiles(email, full_name)
      `)
      .eq('id', electionId)
      .single()

    if (electionError || !election) {
      console.error('Error fetching election for results notification:', electionError)
      return { success: false, error: 'Election not found', details: electionError?.message }
    }

    // Get positions with candidates and vote counts
    const { data: positions, error: positionsError } = await supabase
      .from('positions')
      .select(`
        id,
        title,
        description,
        candidates (
          id,
          vote_count,
          voters:voter_id (name)
        )
      `)
      .eq('election_id', electionId)
      .order('display_order', { ascending: true })

    if (positionsError) {
      console.error('Error fetching positions for results notification:', positionsError)
      return { success: false, error: 'Failed to fetch election results', details: positionsError?.message }
    }

    const token = process.env.MAILTRAP_API_TOKEN
    const fromEmail = process.env.MAILTRAP_SENDER_EMAIL || 'no-reply@electionmanager.com.ng'
    const fromName = process.env.MAILTRAP_SENDER_NAME || 'Election Manager'

    if (!token) {
      console.error('Mailtrap token not configured')
      return { success: false, error: 'Mailtrap token not configured' }
    }

    const typedElection = election as ElectionWithResults;
    
    if (!typedElection.creator?.email) {
      console.error('Creator email not found')
      return { success: false, error: 'Creator email not found' }
    }

    const subject = `Final Results: ${typedElection.name}`
    
    // Generate results summary text
    let resultsText = ''
    positions?.forEach((position: PositionWithCandidates) => {
      resultsText += `\n${position.title}:\n`
      const candidates = position.candidates || []
      candidates
        .sort((a: any, b: any) => (b.vote_count || 0) - (a.vote_count || 0))
        .forEach((candidate: any) => {
          resultsText += `- ${candidate.voters?.name || 'Unknown'}: ${candidate.vote_count || 0} votes\n`
        })
    })

    const text = `Hello ${typedElection.creator.full_name || 'Election Creator'},

Your election "${typedElection.name}" has concluded. Here are the final results:

Election Summary:
- Name: ${typedElection.name}
${typedElection.organization ? `- Organization: ${typedElection.organization}` : ''}
- Total Voters: ${typedElection.total_voters || 0}
- Votes Cast: ${typedElection.total_votes_cast || 0}
- Turnout Rate: ${typedElection.total_voters ? (((typedElection.total_votes_cast || 0) / typedElection.total_voters) * 100).toFixed(1) : '0'}%

Final Results:
${resultsText}

You can view the detailed results at: ${process.env.NEXT_PUBLIC_APP_URL}/election/${typedElection.id}/stats

Best regards,
Election Manager Team`

    // Generate results summary HTML
    let resultsHtml = ''
    positions?.forEach((position: PositionWithCandidates) => {
      resultsHtml += `
        <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #2563eb;">
          <h4 style="color: #1e40af; margin-top: 0;">${position.title}</h4>
          ${position.description ? `<p style="color: #6b7280; margin: 5px 0;">${position.description}</p>` : ''}
          <div style="margin-top: 10px;">
      `
      
      const candidates = position.candidates || []
      candidates
        .sort((a: any, b: any) => (b.vote_count || 0) - (a.vote_count || 0))
        .forEach((candidate: any, index: number) => {
          const isWinner = index === 0 && (candidate.vote_count || 0) > 0
          resultsHtml += `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <span>
                ${candidate.voters?.name || 'Unknown'}
                ${isWinner ? '<span style="color: #f59e0b; font-weight: bold;"> (Winner)</span>' : ''}
              </span>
              <span style="font-weight: ${isWinner ? 'bold' : 'normal'};">${candidate.vote_count || 0} votes</span>
            </div>
          `
        })
      
      resultsHtml += `
          </div>
        </div>
      `
    })

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Election Manager - Final Results</h2>
        
        <p>Hello ${typedElection.creator.full_name || 'Election Creator'},</p>
        
        <p>Your election <strong>"${typedElection.name}"</strong> has concluded. Here are the final results:</p>
        
        <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">Election Summary</h3>
          <p><strong>Name:</strong> ${typedElection.name}</p>
          ${typedElection.organization ? `<p><strong>Organization:</strong> ${typedElection.organization}</p>` : ''}
          <p><strong>Total Voters:</strong> ${typedElection.total_voters || 0}</p>
          <p><strong>Votes Cast:</strong> ${typedElection.total_votes_cast || 0}</p>
          <p><strong>Turnout Rate:</strong> ${typedElection.total_voters ? (((typedElection.total_votes_cast || 0) / typedElection.total_voters) * 100).toFixed(1) : '0'}%</p>
        </div>
        
        <h3 style="color: #1e40af;">Final Results</h3>
        ${resultsHtml || '<p>No results available.</p>'}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/election/${typedElection.id}/stats" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Detailed Results
          </a>
        </div>
        
        <p>Or visit: <a href="${process.env.NEXT_PUBLIC_APP_URL}/election/${typedElection.id}/stats">${process.env.NEXT_PUBLIC_APP_URL}/election/${typedElection.id}/stats</a></p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Election Manager Team</p>
      </div>
    `

    const res = await fetch('https://send.api.mailtrap.io/api/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: { email: fromEmail, name: fromName },
        to: [{ email: typedElection.creator.email }],
        subject,
        text,
        html,
        category: 'election_notification',
      }),
    })

    if (!res.ok) {
      const details = await res.text()
      console.error('Mailtrap send failed:', {
        status: res.status,
        statusText: res.statusText,
        details
      })
      return { success: false, error: 'Failed to send email', details }
    }

    // Note: We're not updating the election status here due to TypeScript build issues
    // The frontend will handle preventing duplicate notifications by checking the status
    console.log('Election results notification sent successfully')
    return { success: true }
  } catch (error: any) {
    console.error('Election results notification error:', error)
    return { success: false, error: 'Unexpected error sending email', details: error.message }
  }
}

// POST handler for manual testing (optional)
export async function POST(req: Request) {
  try {
    const { electionId, type } = await req.json()
    
    let result
    switch (type) {
      case 'created':
        result = await sendElectionCreatedNotification(electionId)
        break
      case 'started':
      case 'ended':
        result = await sendElectionStatusNotification(electionId, type)
        break
      case 'results':
        result = await sendElectionResultsNotification(electionId)
        break
      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }
    
    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: result.error, details: result.details }, { status: 500 })
    }
  } catch (error) {
    console.error('Notification API error:', error)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}