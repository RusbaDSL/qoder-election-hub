export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      admin_settings: {
        Row: {
          id: string
          key: string
          value: Json
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pricing_plans: {
        Row: {
          id: string
          name: string
          min_voters: number
          max_voters: number
          price: number
          currency: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          min_voters: number
          max_voters: number
          price: number
          currency?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          min_voters?: number
          max_voters?: number
          price?: number
          currency?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      elections: {
        Row: {
          id: string
          creator_id: string
          name: string
          description: string | null
          organization: string | null
          status: 'draft' | 'pending_payment' | 'paid' | 'active' | 'paused' | 'completed'
          voting_start_time: string | null
          voting_end_time: string | null
          total_voters: number
          total_votes_cast: number
          is_voting_active: boolean
          payment_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          name: string
          description?: string | null
          organization?: string | null
          status?: 'draft' | 'pending_payment' | 'paid' | 'active' | 'paused' | 'completed'
          voting_start_time?: string | null
          voting_end_time?: string | null
          total_voters?: number
          total_votes_cast?: number
          is_voting_active?: boolean
          payment_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          name?: string
          description?: string | null
          organization?: string | null
          status?: 'draft' | 'pending_payment' | 'paid' | 'active' | 'paused' | 'completed'
          voting_start_time?: string | null
          voting_end_time?: string | null
          total_voters?: number
          total_votes_cast?: number
          is_voting_active?: boolean
          payment_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      voters: {
        Row: {
          id: string
          election_id: string
          name: string
          email: string | null
          phone_number: string | null
          has_voted: boolean
          voted_at: string | null
          verification_code: string | null
          verification_code_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          election_id: string
          name: string
          email?: string | null
          phone_number?: string | null
          has_voted?: boolean
          voted_at?: string | null
          verification_code?: string | null
          verification_code_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          election_id?: string
          name?: string
          email?: string | null
          phone_number?: string | null
          has_voted?: boolean
          voted_at?: string | null
          verification_code?: string | null
          verification_code_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      positions: {
        Row: {
          id: string
          election_id: string
          title: string
          description: string | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          election_id: string
          title: string
          description?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          election_id?: string
          title?: string
          description?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      candidates: {
        Row: {
          id: string
          position_id: string
          voter_id: string
          photo_url: string | null
          bio: string | null
          vote_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          position_id: string
          voter_id: string
          photo_url?: string | null
          bio?: string | null
          vote_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          position_id?: string
          voter_id?: string
          photo_url?: string | null
          bio?: string | null
          vote_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          election_id: string
          voter_id: string
          candidate_id: string
          position_id: string
          voted_at: string
        }
        Insert: {
          id?: string
          election_id: string
          voter_id: string
          candidate_id: string
          position_id: string
          voted_at?: string
        }
        Update: {
          id?: string
          election_id?: string
          voter_id?: string
          candidate_id?: string
          position_id?: string
          voted_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          election_id: string
          user_id: string
          pricing_plan_id: string | null
          amount: number
          currency: string
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          paystack_reference: string | null
          paystack_access_code: string | null
          verified_at: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          election_id: string
          user_id: string
          pricing_plan_id?: string | null
          amount: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          paystack_reference?: string | null
          paystack_access_code?: string | null
          verified_at?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          election_id?: string
          user_id?: string
          pricing_plan_id?: string | null
          amount?: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          paystack_reference?: string | null
          paystack_access_code?: string | null
          verified_at?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
