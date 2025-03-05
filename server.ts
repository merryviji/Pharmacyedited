import http from "http";
import fs from "fs";
// @ts-ignore
import mime from "mime-types";
import { Pool } from "pg";

const pool = new Pool({
    user: "durham_pharmacy_db_user", // Username from Render
    host: "dpg-cv0vi8tds78s73davq0g-a.ohio-postgres.render.com", // Host from Render
    database: "durham_pharmacy_db", // Database name from Render
    password: "EIZpoJqfNNcg8TW6jfldKveIWf9yvFau", // Password from Render
    port: 5432, // Port from Render
    ssl: {
        rejectUnauthorized: false // Required for Render's PostgreSQL SSL connection
    }
});

let lookup = mime.lookup;

const port = process.env.PORT || 5000;

const server = http.createServer(async (req, res) => {
    const path = req.url as string;

    if (path === "/register" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });

        req.on("end", async () => {
            try {
                const formData = JSON.parse(body);

                // Find the maximum ID in the patients table
                const maxIdResult = await pool.query("SELECT MAX(id) FROM patients");
                let maxId = maxIdResult.rows[0].max;

                // If no patients exist, start with "005"
                if (!maxId) {
                    maxId = "004"; // Start from "004" so that the next ID is "005"
                }

                // Increment the maximum ID by 1 and format it to 3 digits
                const nextId = String(parseInt(maxId) + 1).padStart(3, "0");

                // Insert the new patient into the patients table
                const patientQuery = `
                    INSERT INTO patients (id, first_name, last_name, gender, age, health_card_number, email_address, phone_number, address)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    RETURNING *;
                `;

                const patientValues = [
                    nextId, // Use the generated ID
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

                // Insert the new user into the users table
                const userQuery = `
                    INSERT INTO users (role, username, password)
                    VALUES ($1, $2, $3)
                    RETURNING *;
                `;

                const userValues = ["Patient", formData.emailAddress, formData.password];

                const userResult = await pool.query(userQuery, userValues);
                console.log("User data saved successfully:", userResult.rows[0]);

                // Send a success response back to the client
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Registration successful!" }));
            } catch (error) {
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

                // Find the maximum ID in the patients table
                const maxIdResult = await pool.query("SELECT MAX(id) FROM patients");
                let maxId = maxIdResult.rows[0].max || "000"; // Default to "000" if no records exist

                // Increment the maximum ID by 1 and format it to 3 digits
                const nextId = String(parseInt(maxId) + 1).padStart(3, "0");

                // Insert the new patient into the patients table
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

                // Send success response
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Patient added successfully", patient: patientResult.rows[0] }));

            } catch (error) {
                console.error("Error during registration:", error);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Internal Server Error" }));
            }
        });
    }

    else if (path === "/api/patients" && req.method === "GET") {
        // Handle GET request to fetch all patients
        try {
            const result = await pool.query("SELECT * FROM patients");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(result.rows));
        } catch (error) {
            console.error("Error fetching patient data:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal Server Error" }));
        }
    }else if (path.startsWith("/api/patients/email/") && req.method === "GET") {
        const email = decodeURIComponent(path.replace("/api/patients/email/", ""));


        try {
            const query = "SELECT * FROM patients WHERE TRIM(LOWER(email_address)) = TRIM(LOWER($1))";
            const result = await pool.query(query, [email]);

            if (result.rows.length > 0) {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(result.rows[0]));
            } else {
                console.log("Patient not found in database.");
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Patient not found" }));
            }
        } catch (error) {
            console.error("Database error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Database query failed" }));
        }
    }

    // Fetch ALL refill requests (For Admin Panel)
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
        } catch (error) {
            console.error("Error fetching refill requests:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Internal Server Error" }));
        }
    }

// Fetch refill requests for a specific patient
    else if (path.startsWith("/api/refill_requests/") && req.method === "GET") {
        const patientId = path.split("/").pop(); // Extract patient ID from URL

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
        } catch (error) {
            console.error("Error fetching patient refill requests:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Internal Server Error" }));
        }
    }


    else if (path.startsWith("/api/prescriptions/") && req.method === "GET") {
        const patientId = path.split("/").pop(); // Extract patient ID from the URL

        console.log(`Fetching prescriptions for patient ID: ${patientId}`);

        try {
            const result = await pool.query("SELECT * FROM prescription WHERE patient_id = $1", [patientId]);

            if (result.rows.length > 0) {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(result.rows));
            } else {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "No prescriptions found for this patient" }));
            }
        } catch (error) {
            console.error("Error fetching prescriptions:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal Server Error" }));
        }
    }

    // Handle refill request submission
    else if (path.startsWith("/api/refill/") && req.method === "POST") {
        const rxnum = path.split("/").pop(); // Extract RxNum from URL
        const userSession = req.headers["user-session"]; // Get user session from headers

        if (!rxnum || !userSession) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Invalid request. Missing RxNum or session." }));
            return;
        }

        try {
            const user = JSON.parse(userSession as string);
            const userEmail = user.username.trim();

            // Find Patient ID from email
            const patientResult = await pool.query("SELECT id FROM patients WHERE email_address = $1", [userEmail]);
            if (patientResult.rows.length === 0) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Patient not found." }));
                return;
            }

            const patientId = patientResult.rows[0].id;

            // Insert refill request
            const insertQuery = `
            INSERT INTO refill_requests (rxnum, patient_id)
            VALUES ($1, $2)
            RETURNING *;
        `;
            const result = await pool.query(insertQuery, [rxnum, patientId]);

            res.writeHead(201, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Refill request submitted successfully.", request: result.rows[0] }));

        } catch (error) {
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
            } catch (error) {
                console.error("Error updating refill request:", error);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Internal Server Error" }));
            }
        });
    }




    else if (path.startsWith("/api/patients/") && req.method === "GET") {
        // Handle GET request to fetch a specific patient by ID
        const patientId = path.split("/").pop(); // Extract patient ID from the URL

        try {
            const result = await pool.query("SELECT * FROM patients WHERE id = $1", [patientId]);

            if (result.rows.length > 0) {
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify(result.rows[0]));
            } else {
                res.writeHead(404, {"Content-Type": "application/json"});
                res.end(JSON.stringify({message: "Patient not found"}));
            }
        } catch (error) {
            console.error("Error fetching patient data:", error);
            res.writeHead(500, {"Content-Type": "application/json"});
            res.end(JSON.stringify({error: "Internal Server Error"}));
        }

} else if (path === "/api/users/login" && req.method === "POST") {
        // Handle POST request for user login
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });

        req.on("end", async () => {
            try {
                const { username, password } = JSON.parse(body);

                // Query the database for the user
                const result = await pool.query("SELECT * FROM users WHERE username = $1 AND password = $2", [username, password]);

                if (result.rows.length > 0) {
                    const user = result.rows[0];
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify(user)); // Return the user data
                } else {
                    res.writeHead(401, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ message: "Invalid Login Credentials" }));
                }
            } catch (error) {
                console.error("Error during login:", error);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Internal Server Error" }));
            }
        });
    } else {
        // Serve static files for all other routes
        let filePath = path;
        if (path === "/" || path === "/home") {
            filePath = "/home.html";
        } else if (
            path === "/prescription_request" ||
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
            path === "/transfer_patient"
        ) {
            filePath = "/index.html";
        }

        let mime_type = lookup(filePath.substring(1));

        fs.readFile(__dirname + filePath, function (err, data) {
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