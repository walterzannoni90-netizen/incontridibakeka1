export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    isAdmin: boolean;
    role: string;
  };
}

export interface Ad {
  id: string;
  user_id: string;
  title: string;
  description: string;
  city: string;
  country: string;
  age: number | null;
  category: string;
  image: string | null;
  images: string[] | null;
  price: string | null;
  phone: string | null;
  whatsapp: string | null;
  is_active: boolean;
  is_premium: boolean;
  is_sponsored: boolean;
  is_verified: boolean;
  rating: number;
  review_count: number;
  views: number;
  has_paid: boolean;
  boost_type: string | null;
  boost_start_at: string | null;
  boost_end_at: string | null;
  schedule_start_at: string | null;
  schedule_end_at: string | null;
  hair_color: string | null;
  body_type: string | null;
  ethnicity: string | null;
  services: string | null;
  availability_hours: string | null;
  height: number | null;
  weight: number | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_admin: boolean;
  credits: number;
  subscription_tier: string;
  has_paid: boolean;
  ads_count: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  stripe_session_id: string | null;
  stripe_payment_id: string | null;
  amount: number;
  credits: number;
  status: string;
  created_at: string;
}

export interface Report {
  id: string;
  ad_id: string;
  reporter_id: string;
  reason: string;
  status: string;
  created_at: string;
}
