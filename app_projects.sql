-- Table for projects created via the web app (not imported from GitHub)
CREATE TABLE IF NOT EXISTS app_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  detailed_description text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
  project_type text,
  domain text,
  difficulty_level text DEFAULT 'intermediate' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  required_skills text[],
  tech_stack text[],
  programming_languages text[],
  estimated_duration text,
  team_size_min integer DEFAULT 1,
  team_size_max integer DEFAULT 5,
  is_remote boolean DEFAULT true,
  timezone_preference text,
  github_url text,
  demo_url text,
  figma_url text,
  documentation_url text,
  image_url text,
  is_recruiting boolean DEFAULT true,
  is_public boolean DEFAULT true,
  collaboration_type text DEFAULT 'open' CHECK (collaboration_type IN ('open', 'invite_only', 'closed')),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  tags text[],
  view_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  application_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deadline timestamptz,
  started_at timestamptz,
  completed_at timestamptz
);

-- Table to track all users who have joined an app project
CREATE TABLE IF NOT EXISTS app_project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES app_projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'contributor')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'rejected')),
  joined_at timestamptz DEFAULT now(),
  contribution_description text,
  UNIQUE(project_id, user_id)
);