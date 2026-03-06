require('dotenv').config();
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
async function test() {
    try {
        const triggers = await sql`
      SELECT tgname
      FROM pg_trigger
      WHERE tgname = 'on_auth_user_created' OR tgname ILIKE '%auth_user%' OR tgname ILIKE '%handle_new_user%';
    `;
        console.log('Triggers:', triggers);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
test();
