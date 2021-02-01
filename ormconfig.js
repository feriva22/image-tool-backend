require('dotenv').config()
const typeorm_config = {
   "name": "default",
   "type": process.env.TYPEORM_TYPE || "postgres",
   "host": process.env.TYPEORM_HOST || "localhost",
   "port": process.env.TYPEORM_PORT || 5432,
   "username": process.env.TYPEORM_USERNAME || "postgres",
   "password": process.env.TYPEORM_PASSWORD || "postgres",
   "database": process.env.TYPEORM_DB || "api-coba-dev",
   "synchronize": true,
   "logging": false,
   "useUnifiedTopology": true, //for mongodb connect
   "entities": [
      "dist/database/entity/**/*.js"
   ],
   "migrations": [
      "dist/database/migration/**/*.js"
   ],
   "subscribers": [
      "dist/database/subscriber/**/*.js"
   ],
   "seeds": [
      "dist/database/seeder/**/*{.js}"
   ],
   "factories": [
      "dist/database/factory/**/*{.js}"
   ],
   "cli": {
      "entitiesDir": "src/database/entity/",
      "migrationsDir": "src/database/migration/",
      "subscribersDir": "src/database/subscriber/"
   }
};

module.exports = typeorm_config
