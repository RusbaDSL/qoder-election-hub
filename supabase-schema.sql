-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE election_status AS ENUM ('draft', 'pending_payment', 'paid', 'active', 'paused', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin settings table
CREATE TABLE public.admin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pricing plans table
CREATE TABLE public.pricing_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    min_voters INTEGER NOT NULL,
    max_voters INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Elections table
CREATE TABLE public.elections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES public.profiles(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    organization TEXT,
    status election_status DEFAULT 'draft',
    voting_start_time TIMESTAMP WITH TIME ZONE,
    voting_end_time TIMESTAMP WITH TIME ZONE,
    total_voters INTEGER DEFAULT 0,
    total_votes_cast INTEGER DEFAULT 0,
    is_voting_active BOOLEAN DEFAULT false,
    payment_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Eligible voters table
CREATE TABLE public.voters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone_number TEXT,
    has_voted BOOLEAN DEFAULT false,
    voted_at TIMESTAMP WITH TIME ZONE,
    verification_code TEXT,
    verification_code_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT email_or_phone_required CHECK (email IS NOT NULL OR phone_number IS NOT NULL)
);

-- Positions table
CREATE TABLE public.positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Candidates table
CREATE TABLE public.candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_id UUID REFERENCES public.positions(id) ON DELETE CASCADE NOT NULL,
    voter_id UUID REFERENCES public.voters(id) ON DELETE CASCADE NOT NULL,
    photo_url TEXT,
    bio TEXT,
    vote_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(position_id, voter_id)
);

-- Votes table
CREATE TABLE public.votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE NOT NULL,
    voter_id UUID REFERENCES public.voters(id) ON DELETE CASCADE NOT NULL,
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
    position_id UUID REFERENCES public.positions(id) ON DELETE CASCADE NOT NULL,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(voter_id, position_id)
);

-- Payments table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    pricing_plan_id UUID REFERENCES public.pricing_plans(id),
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    status payment_status DEFAULT 'pending',
    paystack_reference TEXT UNIQUE,
    paystack_access_code TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_elections_creator ON public.elections(creator_id);
CREATE INDEX idx_elections_status ON public.elections(status);
CREATE INDEX idx_voters_election ON public.voters(election_id);
CREATE INDEX idx_voters_email ON public.voters(email);
CREATE INDEX idx_voters_phone ON public.voters(phone_number);
CREATE INDEX idx_positions_election ON public.positions(election_id);
CREATE INDEX idx_candidates_position ON public.candidates(position_id);
CREATE INDEX idx_votes_election ON public.votes(election_id);
CREATE INDEX idx_votes_voter ON public.votes(voter_id);
CREATE INDEX idx_payments_election ON public.payments(election_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- Create unique constraints to prevent duplicate voters within an election
-- Prevent duplicate emails within the same election (case-insensitive)
CREATE UNIQUE INDEX idx_voters_unique_email_per_election 
    ON public.voters(election_id, LOWER(email)) 
    WHERE email IS NOT NULL;

-- Prevent duplicate phone numbers within the same election
CREATE UNIQUE INDEX idx_voters_unique_phone_per_election 
    ON public.voters(election_id, phone_number) 
    WHERE phone_number IS NOT NULL;

-- Prevent duplicate names within the same election (case-insensitive)
CREATE UNIQUE INDEX idx_voters_unique_name_per_election 
    ON public.voters(election_id, LOWER(name));

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for admin_settings (admin only)
CREATE POLICY "Admin settings viewable by admins" ON public.admin_settings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admin settings manageable by admins" ON public.admin_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS Policies for pricing_plans
CREATE POLICY "Pricing plans viewable by everyone" ON public.pricing_plans
    FOR SELECT USING (is_active = true OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Pricing plans manageable by admins" ON public.pricing_plans
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS Policies for elections
CREATE POLICY "Elections viewable by creator and admins" ON public.elections
    FOR SELECT USING (
        creator_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Elections creatable by authenticated users" ON public.elections
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Elections updatable by creator and admins" ON public.elections
    FOR UPDATE USING (
        creator_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Elections deletable by creator and admins" ON public.elections
    FOR DELETE USING (
        creator_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS Policies for voters
CREATE POLICY "Voters viewable by election creator and admins" ON public.voters
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.elections WHERE id = election_id AND creator_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Voters manageable by election creator and admins" ON public.voters
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.elections WHERE id = election_id AND creator_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS Policies for positions
CREATE POLICY "Positions viewable by election creator and admins" ON public.positions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.elections WHERE id = election_id AND creator_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Positions manageable by election creator and admins" ON public.positions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.elections WHERE id = election_id AND creator_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS Policies for candidates
CREATE POLICY "Candidates viewable by election creator and admins" ON public.candidates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.positions p 
            JOIN public.elections e ON p.election_id = e.id 
            WHERE p.id = position_id AND (e.creator_id = auth.uid() OR 
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
        )
    );

CREATE POLICY "Candidates manageable by election creator and admins" ON public.candidates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.positions p 
            JOIN public.elections e ON p.election_id = e.id 
            WHERE p.id = position_id AND (e.creator_id = auth.uid() OR 
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
        )
    );

-- RLS Policies for votes (restricted access)
CREATE POLICY "Votes insertable by verified voters" ON public.votes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.voters v 
            JOIN public.elections e ON v.election_id = e.id
            WHERE v.id = voter_id AND e.is_voting_active = true
        )
    );

CREATE POLICY "Vote counts viewable by admins and election creators" ON public.votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.elections WHERE id = election_id AND creator_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS Policies for payments
CREATE POLICY "Payments viewable by user and admins" ON public.payments
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Payments creatable by authenticated users" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Payments updatable by admins" ON public.payments
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update candidate vote count
CREATE OR REPLACE FUNCTION public.update_candidate_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.candidates 
        SET vote_count = vote_count + 1 
        WHERE id = NEW.candidate_id;
        
        UPDATE public.elections 
        SET total_votes_cast = total_votes_cast + 1 
        WHERE id = NEW.election_id;
        
        UPDATE public.voters 
        SET has_voted = true, voted_at = NOW() 
        WHERE id = NEW.voter_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for vote count updates
CREATE TRIGGER on_vote_cast
    AFTER INSERT ON public.votes
    FOR EACH ROW EXECUTE FUNCTION public.update_candidate_vote_count();

-- Function to update election voter count
CREATE OR REPLACE FUNCTION public.update_election_voter_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.elections 
        SET total_voters = total_voters + 1 
        WHERE id = NEW.election_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.elections 
        SET total_voters = total_voters - 1 
        WHERE id = OLD.election_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for voter count updates
CREATE TRIGGER on_voter_change
    AFTER INSERT OR DELETE ON public.voters
    FOR EACH ROW EXECUTE FUNCTION public.update_election_voter_count();

-- Insert default pricing plans
INSERT INTO public.pricing_plans (name, min_voters, max_voters, price, currency) VALUES
    ('Free', 1, 50, 0, 'NGN'),
    ('Basic', 51, 200, 50000, 'NGN'),
    ('Standard', 201, 500, 100000, 'NGN'),
    ('Premium', 501, 1000, 180000, 'NGN'),
    ('Enterprise', 1001, 999999, 350000, 'NGN');

-- Insert default admin settings for Paystack
INSERT INTO public.admin_settings (key, value, description) VALUES
    ('paystack_public_key', '""', 'Paystack public key for payment processing'),
    ('paystack_secret_key', '""', 'Paystack secret key for payment processing');
