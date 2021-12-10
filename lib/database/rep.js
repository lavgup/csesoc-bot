//@ts-check
const { Pool } = require('pg')
const yaml = require('js-yaml');
const fs   = require('fs');

// Class for the rep db SIMPLE FOR NOW
class DBRep {
    constructor() {
        // Loads the db configuration
        const details = this.load_db_login();

        this.pool = new Pool({
            user: details['user'],
            password:  details['password'],
            host: details['host'],
            port: details['port'],
            database: details['dbname']
        })
        // The name of the table
        this.table_name = 'reputation';
    }

    // Get document, or throw exception on error
    load_db_login() {
        try {
            const doc = yaml.load(fs.readFileSync('./config/database.yml'));
            return doc;
        } catch (e) {
            console.log(e);
        }
    }

    // Creates the table if it doesn't exists
    async setup_table() {
        const table_exists = await this.check_table(this.table_name);
        if (!table_exists) {
            await this.create_table();
        }
    }

    // Checks if the table exists in the db
    async check_table(table_name) {
        const client = await this.pool.connect()
        try {
            await client.query("BEGIN");
            const values = [table_name]
            const result = await client.query("select * from information_schema.tables where table_name=$1", values)
            await client.query("COMMIT");
            
            return result.rowCount > 0; // return whether there was a table or not
        } catch (err) {
            console.log(`Something went wrong ${err}`)
        } finally {
            await client.query("ROLLBACK");
            client.release()  
        }
    }
    
    // Creates a new table
    async create_table() {
        const client = await this.pool.connect()
        try {
            console.log("Running create_table")
            await client.query("BEGIN");
            const query = `CREATE TABLE IF NOT EXISTS reputation (
                userid BIGINT PRIMARY KEY,
                rep INTEGER CHECK (rep >= 0)
            )`;

            const result = await client.query(query)
            await client.query("COMMIT");
        } catch (err) {
            console.log(`Something went wrong ${err}`)
        } finally {
            await client.query("ROLLBACK");
            client.release()
        }
    }

    // get a users rep
    async get_rep(userID) {
        const client = await this.pool.connect()
        try {
            await client.query("BEGIN");

            const query = "SELECT * from reputation where userid = $1";
            const res = await client.query(query, [userID]);
            await client.query("COMMIT");

            return res.rows;
        } catch (err) {
            console.log(`FAQ DB ERR: ${err}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }

    // get all users rep
    async get_rep_all() {
        const client = await this.pool.connect()
        try {
            await client.query("BEGIN");

            const query = "SELECT * from reputation order by rep desc";
            const res = await client.query(query);
            await client.query("COMMIT");

            return res.rows;
        } catch (err) {
            console.log(`FAQ DB ERR: ${err}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }

    // set a users rep
    async set_rep(userID, value) {
        if (value < 0) {
            return false;
        }

        const client = await this.pool.connect()
        try {
            // check if its not already in
            const rows = await this.get_rep(userID);
            let query = "";
            if (rows.length == 0) {
                // insert
                query = "INSERT INTO reputation(userid, rep) VALUES ($1, $2)";
            } else {
                // update
                query = "UPDATE reputation SET rep = $2 WHERE userid = $1";
            }

            await client.query("BEGIN");
            await client.query(query, [userID, value]);
            await client.query("COMMIT");

            return true;
        } catch (err) {
            console.log(`FAQ DB ERR: ${err}`);
            return false;
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }

    // increment a users rep
    async increment_rep(userID) {
        const client = await this.pool.connect()
        try {
            // check if its not already in
            const rows = await this.get_rep(userID);
            let query = "";
            if (rows.length == 0) {
                // insert
                query = "INSERT INTO reputation(userid, rep) VALUES ($1, 1)";
            } else {
                // update
                query = "UPDATE reputation SET rep = (rep + 1) WHERE userid = $1";
            }

            await client.query("BEGIN");
            await client.query(query, [userID]);
            await client.query("COMMIT");

            return true;
        } catch (err) {
            console.log(`FAQ DB ERR: ${err}`);
            return false;
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }

}

module.exports = {
    DBRep
}