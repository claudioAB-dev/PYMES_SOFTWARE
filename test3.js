require('dotenv').config();
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
async function test() {
    try {
        const res = await sql`insert into memberships (id, user_id, organization_id, role) values (gen_random_uuid(), 'a437579e-c4a0-4766-9f7e-669047f4630c', '25edb2c3-5d0c-4a0f-b3e6-aeeefffed757', 'OWNER') returning *`;
        console.log('Success:', res);
    } catch (e) {
        console.error('Error MESSAGE:', e.message);
    }
    process.exit(0);
}
test();
