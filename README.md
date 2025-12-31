# Election Management System

A comprehensive election management application built with Next.js, Tailwind CSS, and Supabase. This platform enables users to create, manage, and monitor elections with real-time voting statistics.

## Features

### Core Functionality
- **User Authentication**: Sign up, login, and password reset functionality
- **Election Creation**: Create elections with name, description, organization, and voting schedule
- **Voter Management**: 
  - Add voters individually with name, email, and phone number
  - Bulk upload voters via CSV file
  - Track voting status for each voter
- **Position Management**: Define positions open for voting with descriptions
- **Candidate Management**: 
  - Select candidates from eligible voters
  - Upload candidate photos
  - Add candidate biographies
- **Payment Integration**: 
  - Tiered pricing based on number of voters
  - Free for up to 50 voters
  - Paystack payment gateway integration
  - Payment verification before voting activation
- **Real-Time Statistics**: 
  - Publicly accessible voting statistics page
  - Live vote count updates using Supabase real-time subscriptions
  - Visual progress bars and charts
- **Voter Verification**: 
  - Email/phone verification with OTP codes
  - Secure voting interface accessible only after verification
- **Election Controls**: Start/stop voting manually with payment verification
- **Admin Dashboard**: 
  - Manage all aspects of the system
  - Configure Paystack API keys
  - Manage pricing plans
  - View system statistics

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Real-time, Auth, Storage)
- **Payment**: Paystack API
- **File Parsing**: PapaParse for CSV uploads
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier works)
- A Paystack account for payment processing

### 1. Clone and Install Dependencies

```bash
cd election-management-app
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (from Service Role section)

3. Create the database schema:
   - Go to SQL Editor in Supabase Dashboard
   - Copy the contents of `supabase-schema.sql`
   - Execute the SQL to create all tables, functions, and policies

4. Create a storage bucket for candidate photos:
   - Go to Storage in Supabase Dashboard
   - Create a new bucket named `election-assets`
   - Make it public or configure appropriate policies

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# Paystack Configuration (optional - can be configured via admin panel)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your-paystack-public-key-here
PAYSTACK_SECRET_KEY=your-paystack-secret-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### 5. Create Admin User (Optional)

To access the admin panel, you need to manually set a user's role to 'admin':

1. Sign up for an account through the app
2. Go to Supabase Dashboard > Table Editor > profiles
3. Find your user and change the `role` column from 'user' to 'admin'
4. You can now access `/admin` route

## Usage Guide

### For Election Creators

1. **Sign Up/Login**: Create an account or login
2. **Create Election**: 
   - Go to Dashboard and click "Create Election"
   - Fill in election details (name, description, organization, dates)
3. **Add Voters**:
   - Navigate to election detail page > Voters tab
   - Add voters individually or upload a CSV file
   - CSV format: `name,email,phone`
4. **Create Positions**:
   - Go to Positions tab
   - Add positions with titles and descriptions
5. **Add Candidates**:
   - For each position, select candidates from eligible voters
   - Upload candidate photos and add bios
6. **Payment**:
   - Go to Payment tab
   - Review pricing based on voter count
   - Complete payment if required (free for ≤50 voters)
7. **Start Voting**:
   - Return to Overview tab
   - Click "Start Voting" (only available after payment verification)
8. **Monitor Results**:
   - Click "View Public Statistics Page" to see live results
   - Share this link with voters

### For Voters

1. **Access Statistics Page**: Visit the public statistics URL shared by the election creator
2. **Click "Vote"**: Button visible when voting is active
3. **Verify Identity**: 
   - Enter email or phone number
   - Receive verification code
   - Enter code to proceed
4. **Cast Vote**: 
   - Select one candidate for each position
   - Submit ballot
5. **View Results**: Statistics update in real-time after voting

### For Administrators

1. **Access Admin Panel**: Navigate to `/admin` (requires admin role)
2. **Configure Paystack**:
   - Go to Settings
   - Enter Paystack public and secret keys
3. **Manage Pricing Plans**:
   - Add, edit, or deactivate pricing tiers
   - Set voter ranges and prices
4. **Monitor System**:
   - View total users, elections, and revenue
   - Access all elections and user data

## Database Schema

Key tables:
- `profiles`: User profiles extending Supabase auth
- `elections`: Election details and status
- `voters`: Eligible voters for each election
- `positions`: Voting positions
- `candidates`: Candidates competing for positions
- `votes`: Cast votes (anonymous)
- `payments`: Payment transactions
- `pricing_plans`: Pricing tier configuration
- `admin_settings`: System configuration

## Security Features

- Row Level Security (RLS) policies on all tables
- Authentication required for sensitive operations
- Voters can only vote once per position
- Verification codes expire after 15 minutes
- Payment verification before voting activation
- Admin-only access to system settings

## Real-Time Features

The app uses Supabase real-time subscriptions for:
- Live vote count updates on statistics page
- Instant vote tallying
- Real-time turnout statistics

## Payment Processing

- Free tier: Up to 50 voters
- Paid tiers: 51-200, 201-500, 501-1000, 1000+ voters
- Paystack integration for Nigerian Naira (NGN)
- Payment verification required before voting starts
- Admin configurable pricing and API keys

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Database Migration

When deploying to production:
1. Create a production Supabase project
2. Run the schema SQL in production database
3. Update environment variables
4. Configure storage bucket

## Troubleshooting

### TypeScript Errors
Some TypeScript errors related to Supabase type inference may appear during development. These don't affect functionality. To resolve:
- Ensure Database types are properly generated
- Use type assertions where necessary

### Real-Time Not Working
- Check Supabase real-time is enabled for your project
- Verify RLS policies allow SELECT access
- Check browser console for subscription errors

### Payment Issues
- Verify Paystack keys are correct (test vs live)
- Check admin settings for stored API keys
- Ensure callback URLs are configured in Paystack

## License

MIT

## Support

For issues and questions, please create an issue in the repository.
