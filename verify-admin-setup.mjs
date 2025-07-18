// Verify Admin Credentials Setup
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🔍 Verifying Admin Credentials Setup...\n');

async function checkAdminUsers() {
  console.log('📋 Test 1: Checking admin users...');
  const { data: adminUsers, error } = await supabase
    .from('admin_users')
    .select('id, name, email, role, is_active')
    .order('role');

  if (error) {
    console.log('❌ Error:', error.message);
    return false;
  }

  if (!adminUsers || adminUsers.length === 0) {
    console.log('❌ No admin users found. Run the setup SQL first.');
    return false;
  }

  console.log('✅ Admin users found:');
  adminUsers.forEach(user => {
    console.log(`   - ${user.name} (${user.role}) - ${user.is_active ? 'Active' : 'Inactive'}`);
  });
  
  return adminUsers.length >= 5;
}

async function checkLoginMappings() {
  console.log('\n🔑 Test 2: Checking login mappings...');
  const { data: mappings, error } = await supabase
    .from('admin_login_mapping')
    .select('admin_id, password, is_active');

  if (error) {
    console.log('❌ Error:', error.message);
    console.log('💡 Make sure you created the admin_login_mapping table.');
    return false;
  }

  if (!mappings || mappings.length === 0) {
    console.log('❌ No login mappings found.');
    return false;
  }

  console.log('✅ Login mappings found:');
  mappings.forEach(mapping => {
    console.log(`   - ID: ${mapping.admin_id} | Password: ${mapping.password}`);
  });
  
  return mappings.length >= 5;
}

async function testLogins() {
  console.log('\n🧪 Test 3: Testing login credentials...');
  
  const testCredentials = [
    { id: 'SA001', password: 'superadmin123' },
    { id: 'TM001', password: 'transport123' },
    { id: 'FA001', password: 'finance123' }
  ];

  let allPassed = true;

  for (const cred of testCredentials) {
    const { data, error } = await supabase
      .from('admin_login_mapping')
      .select(`
        admin_id,
        admin_users(name, role)
      `)
      .eq('admin_id', cred.id)
      .eq('password', cred.password)
      .single();

    if (error || !data) {
      console.log(`   ❌ ${cred.id}: Login failed`);
      allPassed = false;
    } else {
      console.log(`   ✅ ${cred.id}: Login successful - ${data.admin_users.name}`);
    }
  }
  
  return allPassed;
}

async function runVerification() {
  try {
    const test1 = await checkAdminUsers();
    const test2 = await checkLoginMappings();
    const test3 = await testLogins();

    console.log('\n📋 VERIFICATION SUMMARY:');
    console.log('================================');
    
    if (test1 && test2 && test3) {
      console.log('🎉 ALL TESTS PASSED! Your admin setup is working correctly.');
      console.log('\n📝 You can login with these credentials:');
      console.log('   • Super Admin: SA001 / superadmin123');
      console.log('   • Transport Manager: TM001 / transport123');
      console.log('   • Finance Admin: FA001 / finance123');
      console.log('   • Operations Admin: OA001 / operations123');
      console.log('   • Data Entry: DE001 / dataentry123');
      
      console.log('\n🚀 Your admin system is ready!');
    } else {
      console.log('❌ SOME TESTS FAILED.');
      console.log('\n🔧 What to check:');
      console.log('   1. Did you run setup-admin-credentials.sql in Supabase?');
      console.log('   2. Check for any SQL errors in Supabase logs');
      console.log('   3. Make sure all tables were created properly');
    }
  } catch (error) {
    console.log('💥 Error:', error.message);
  }
}

runVerification();
