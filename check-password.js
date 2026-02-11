
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymannyxsbkvtcxactcgz.supabase.co';
const supabaseKey = 'sb_publishable_Js7DWo5NmIl3MSyk-pmfUg_4Cy0xeP9';

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetPassword() {
  const newPassword = '00000';
  
  const { data, error } = await supabase
    .from('users')
    .update({ password_hash: newPassword })
    .eq('phone_number', '18969789887')
    .select();

  if (error) {
    console.error('Error resetting password:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Password reset successful for user:', data[0].name);
    console.log('New password:', newPassword);
  } else {
    console.log('User not found');
  }
}

resetPassword();
