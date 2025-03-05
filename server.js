"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const mime_types_1 = __importDefault(require("mime-types"));
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    user: "durham_pharmacy_db_user",
    host: "dpg-cv0vi8tds78s73davq0g-a.ohio-postgres.render.com",
    database: "durham_pharmacy_db",
    password: "EIZpoJqfNNcg8TW6jfldKveIWf9yvFau",
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
});
let lookup = mime_types_1.default.lookup;
const port = process.env.PORT || 5000;
const server = http_1.default.createServer(async (req, res) => {
    const path = req.url;
    if (path === "/register" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
        req.on("end", async () => {
            try {
                const formData = JSON.parse(body);
                const maxIdResult = await pool.query("SELECT MAX(id) FROM patients");
                let maxId = maxIdResult.rows[0].max;
                if (!maxId) {
                    maxId = "004";
                }
                const nextId = String(parseInt(maxId) + 1).padStart(3, "0");
                const patientQuery = `
                    INSERT INTO patients (id, first_name, last_name, gender, age, health_card_number, email_address, phone_number, address)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    RETURNING *;
                `;
                const patientValues = [
                    nextId,
                    formData.firstName,
                    formData.lastName,
                    formData.gender,
                    parseInt(formData.age),
                    formData.healthCardNumber,
                    formData.emailAddress,
                    formData.contactNumber,
                    formData.address,
                ];
                const patientResult = await pool.query(patientQuery, patientValues);
                console.log("Patient data saved successfully:", patientResult.rows[0]);
                const userQuery = `
                    INSERT INTO users (role, username, password)
                    VALUES ($1, $2, $3)
                    RETURNING *;
                `;
                const userValues = ["Patient", formData.emailAddress, formData.password];
                const userResult = await pool.query(userQuery, userValues);
                console.log("User data saved successfully:", userResult.rows[0]);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Registration successful!" }));
            }
            catch (error) {
                console.error("Error during registration:", error);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Internal Server Error" }));
            }
        });
    }
    else if (path === "/add_patient" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
        req.on("end", async () => {
            try {
                const formData = JSON.parse(body);
                const maxIdResult = await pool.query("SELECT MAX(id) FROM patients");
                let maxId = maxIdResult.rows[0].max || "000";
                const nextId = String(parseInt(maxId) + 1).padStart(3, "0");
                const patientQuery = `
                INSERT INTO patients (id, first_name, last_name, gender, age, health_card_number, email_address, phone_number, address)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *;
            `;
                const patientValues = [
                    nextId,
                    formData.firstName,
                    formData.lastName,
                    formData.gender,
                    parseInt(formData.age),
                    formData.healthCardNumber,
                    formData.emailAddress,
                    formData.contactNumber,
                    formData.address,
                ];
                const patientResult = await pool.query(patientQuery, patientValues);
                console.log("Patient data saved successfully:", patientResult.rows[0]);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Patient added successfully", patient: patientResult.rows[0] }));
            }
            catch (error) {
                console.error("Error during registration:", error);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Internal Server Error" }));
            }
        });
    }
    else if (path === "/api/patients" && req.method === "GET") {
        try {
            const result = await pool.query("SELECT * FROM patients");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(result.rows));
        }
        catch (error) {
            console.error("Error fetching patient data:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal Server Error" }));
        }
    }
    else if (path.startsWith("/api/patients/email/") && req.method === "GET") {
        const email = decodeURIComponent(path.replace("/api/patients/email/", ""));
        try {
            const query = "SELECT * FROM patients WHERE TRIM(LOWER(email_address)) = TRIM(LOWER($1))";
            const result = await pool.query(query, [email]);
            if (result.rows.length > 0) {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(result.rows[0]));
            }
            else {
                console.log("Patient not found in database.");
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Patient not found" }));
            }
        }
        catch (error) {
            console.error("Database error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Database query failed" }));
        }
    }
    else if (path === "/api/refill_requests" && req.method === "GET") {
        try {
            const result = await pool.query(`
            SELECT refill_requests.id, refill_requests.request_date, refill_requests.patient_id, refill_requests.rxnum, 
                   refill_requests.status, prescription.name AS medication
            FROM refill_requests
            JOIN prescription ON refill_requests.rxnum = prescription.rxnum
            WHERE refill_requests.status = 'Pending' -- Only fetch pending requests
            ORDER BY request_date DESC
        `);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(result.rows));
        }
        catch (error) {
            console.error("Error fetching refill requests:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Internal Server Error" }));
        }
    }
    else if (path.startsWith("/api/refill_requests/") && req.method === "GET") {
        const patientId = path.split("/").pop();
        if (!patientId) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Invalid request. Missing patient ID." }));
            return;
        }
        try {
            const result = await pool.query(`
            SELECT refill_requests.id, refill_requests.request_date, refill_requests.rxnum, refill_requests.status, 
                   prescription.name AS medication
            FROM refill_requests
            JOIN prescription ON refill_requests.rxnum = prescription.rxnum
            WHERE refill_requests.patient_id = $1
            ORDER BY request_date DESC
        `, [patientId]);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(result.rows));
        }
        catch (error) {
            console.error("Error fetching patient refill requests:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Internal Server Error" }));
        }
    }
    else if (path.startsWith("/api/prescriptions/") && req.method === "GET") {
        const patientId = path.split("/").pop();
        console.log(`Fetching prescriptions for patient ID: ${patientId}`);
        try {
            const result = await pool.query("SELECT * FROM prescription WHERE patient_id = $1", [patientId]);
            if (result.rows.length > 0) {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(result.rows));
            }
            else {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "No prescriptions found for this patient" }));
            }
        }
        catch (error) {
            console.error("Error fetching prescriptions:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal Server Error" }));
        }
    }
    else if (path.startsWith("/api/refill/") && req.method === "POST") {
        const rxnum = path.split("/").pop();
        const userSession = req.headers["user-session"];
        if (!rxnum || !userSession) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Invalid request. Missing RxNum or session." }));
            return;
        }
        try {
            const user = JSON.parse(userSession);
            const userEmail = user.username.trim();
            const patientResult = await pool.query("SELECT id FROM patients WHERE email_address = $1", [userEmail]);
            if (patientResult.rows.length === 0) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Patient not found." }));
                return;
            }
            const patientId = patientResult.rows[0].id;
            const insertQuery = `
            INSERT INTO refill_requests (rxnum, patient_id)
            VALUES ($1, $2)
            RETURNING *;
        `;
            const result = await pool.query(insertQuery, [rxnum, patientId]);
            res.writeHead(201, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Refill request submitted successfully.", request: result.rows[0] }));
        }
        catch (error) {
            console.error("Error handling refill request:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Internal Server Error" }));
        }
    }
    else if (path.startsWith("/api/refill_requests/") && req.method === "PUT") {
        const requestId = path.split("/").pop();
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
        req.on("end", async () => {
            try {
                const { status } = JSON.parse(body);
                await pool.query("UPDATE refill_requests SET status = $1 WHERE id = $2", [status, requestId]);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: `Request ${status}` }));
            }
            catch (error) {
                console.error("Error updating refill request:", error);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Internal Server Error" }));
            }
        });
    }
    else if (path.startsWith("/api/patients/") && req.method === "GET") {
        const patientId = path.split("/").pop();
        try {
            const result = await pool.query("SELECT * FROM patients WHERE id = $1", [patientId]);
            if (result.rows.length > 0) {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(result.rows[0]));
            }
            else {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Patient not found" }));
            }
        }
        catch (error) {
            console.error("Error fetching patient data:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal Server Error" }));
        }
    }
    else if (path === "/api/users/login" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
        req.on("end", async () => {
            try {
                const { username, password } = JSON.parse(body);
                const result = await pool.query("SELECT * FROM users WHERE username = $1 AND password = $2", [username, password]);
                if (result.rows.length > 0) {
                    const user = result.rows[0];
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify(user));
                }
                else {
                    res.writeHead(401, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ message: "Invalid Login Credentials" }));
                }
            }
            catch (error) {
                console.error("Error during login:", error);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Internal Server Error" }));
            }
        });
    }
    else {
        let filePath = path;
        if (path === "/" || path === "/home") {
            filePath = "/home.html";
        }
        else if (path === "/prescription_request" ||
            path === "/patient_dashboard" ||
            path === "/request_process" ||
            path === "/login" ||
            path === "/patient_list" ||
            path === "/admin_dashboard" ||
            path === "/register" ||
            path === "/patient_profile" ||
            path === "/add_patient" ||
            path === "/enter_prescription" ||
            path === "/order_medication" ||
            path === "/vaccine_appointment" ||
            path === "/blister_patient" ||
            path === "/transfer_patient") {
            filePath = "/index.html";
        }
        let mime_type = lookup(filePath.substring(1));
        fs_1.default.readFile(__dirname + filePath, function (err, data) {
            if (err) {
                res.writeHead(404);
                res.end("Error 404 - File Not Found" + err.message);
                return;
            }
            if (!mime_type) {
                mime_type = "text/plain";
            }
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.writeHead(200, { "Content-Type": mime_type });
            res.end(data);
        });
    }
});
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
//# sourceMappingURL=server.js.map