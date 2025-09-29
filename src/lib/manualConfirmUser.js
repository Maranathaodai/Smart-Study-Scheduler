// Manual user confirmation utility
// Run this in your browser console on the Supabase dashboard to confirm users

const confirmUserManually = async (email) => {
  // This should be run in the Supabase SQL editor
  const sql = `
    UPDATE auth.users 
    SET email_confirmed_at = NOW() 
    WHERE email = '${email}';
  `;
  
  console.log('Run this SQL in Supabase SQL Editor:');
  console.log(sql);
  
  return sql;
};

// Usage example:
// confirmUserManually('your-email@example.com');

export { confirmUserManually };
