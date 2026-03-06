require('dotenv').config();
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
async function test() {
  try {
    const users = await sql`select * from users where id = 'a437579e-c4a0-4766-9f7e-669047f4630c'`;
    console.log('Users in public.users:', users.length);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
test();
