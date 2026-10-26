import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pnfxyxexxhbucjkgtwxj.supabase.co'
const supabaseKey = 'EyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuZnh5eGV4eGhidWNqa2d0d3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMzg2NTIsImV4cCI6MjEwNjcxNDY1Mn0.adi1lUSgJPx38bNzi4xJT1gHFBIwDUEdbsay440QCkY'

export const supabase = createClient(supabaseUrl, supabaseKey)
