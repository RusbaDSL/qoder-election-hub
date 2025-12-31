# Quick Start Guide

## Get the App Running in 10 Minutes

### Step 1: Install Dependencies (1 min)
```bash
npm install
```

### Step 2: Set Up Supabase (5 min)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (choose a region close to you)
3. Wait for the project to finish setting up (~2 minutes)
4. Go to **Project Settings** > **API**
   - Copy `URL` and `anon public` key
5. Go to **SQL Editor** 
   - Click **New Query**
   - Paste the entire contents of `supabase-schema.sql`
   - Click **Run**
6. Go to **Storage**
   - Click **New Bucket**
   - Name: `election-assets`
   - Set as **Public bucket**
   - Click **Create**

### Step 3: Configure Environment (1 min)

Create `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-placeholder
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-placeholder
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Run the App (1 min)
```bash
npm run dev
```

Visit: http://localhost:3000

### Step 5: Create Your First Election (2 min)

1. Click **Get Started**
2. Sign up with email/password
3. Click **Create Election**
4. Fill in details:
   - Name: "Student Council 2025"
   - Organization: "ABC University"
   - Description: "Annual student council election"
5. Click **Create Election**

### Step 6: Add Voters

**Option A: Single Voter**
1. Go to **Voters** tab
2. Click **Add Single Voter**
3. Enter details
4. Click **Add Voter**

**Option B: Bulk Upload**
1. Download `public/sample-voters.csv`
2. Edit with your voters
3. Click **Bulk Upload (CSV)**
4. Select your CSV file
5. Click **Upload**

### Step 7: Create Positions

1. Go to **Positions** tab
2. Click **Add Position**
3. Enter: "President"
4. Add description
5. Click **Add Position**
6. Repeat for other positions (VP, Secretary, etc.)

### Step 8: Add Candidates

1. Under each position, click **Add Candidate**
2. Select a voter from dropdown
3. (Optional) Upload photo
4. Add bio
5. Click **Add Candidate**

### Step 9: Handle Payment

1. Go to **Payment** tab
2. If you have ≤50 voters: Click **Activate Free Election**
3. If >50 voters: You'll need Paystack keys (see below)

### Step 10: Start Voting!

1. Go to **Overview** tab
2. Click **Start Voting**
3. Click **View Public Statistics Page**
4. Share that link with voters!

## Optional: Paystack Setup (For >50 voters)

1. Create account at [paystack.com](https://paystack.com)
2. Get API keys from Dashboard
3. As admin, go to `/admin/settings`
4. Enter Paystack keys
5. Return to election and complete payment

## Making Yourself Admin

To access `/admin`:
1. Sign up through the app
2. Go to Supabase Dashboard
3. Navigate to **Table Editor** > **profiles**
4. Find your email
5. Change `role` from `user` to `admin`
6. Refresh the app
7. You'll now see "Admin" in navigation

## Testing Voting

1. Open the public stats page
2. Click **Click Here to Vote**
3. Enter email/phone from voters list
4. **Note**: In demo mode, the verification code will show in an alert
   - Copy the 6-digit code
5. Enter code and click **Verify Code**
6. Select candidates for each position
7. Click **Submit Ballot**
8. Watch the stats page update in real-time!

## Common Issues

### "Election not found"
- Check you're logged in as the creator
- Verify the election ID in the URL

### "Payment not configured"
- Add Paystack keys in admin settings
- Or reduce voters to ≤50 for free tier

### Photos not uploading
- Ensure `election-assets` bucket exists in Supabase Storage
- Check bucket is set to public

### Votes not updating in real-time
- Check browser console for errors
- Verify Supabase real-time is enabled (it's on by default)

### Can't access admin panel
- Change your role to 'admin' in Supabase profiles table

## Next Steps

- Customize the landing page
- Set up email/SMS for verification codes
- Configure production Paystack keys
- Deploy to Vercel or your preferred host

## Need Help?

- Check `README.md` for detailed documentation
- See `IMPLEMENTATION.md` for technical details
- Review `supabase-schema.sql` for database structure

Happy voting! 🗳️
