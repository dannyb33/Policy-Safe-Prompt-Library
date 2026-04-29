import 'dotenv/config';
import dotenv from 'dotenv';

console.log("test");

// Load test env file explicitly
dotenv.config({ path: '.env.test' });