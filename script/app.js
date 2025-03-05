"use strict";
;
(function () {
    function CheckLogin() {
        $("#login").html(`<a id="logout" class="nav-link" href="/login"> 
        <i class="fas fa-sign-out-alt"></i>Logout</a>`);
        $("#logout").on("click", function () {
            sessionStorage.clear();
            location.href = "/login";
        });
    }
    function DisplayEnterPrescription() {
        console.log(" Called DisplayEnterPrescription");
    }
    function Loadheader(html_data) {
        if (router.ActiveLink === "login" || router.ActiveLink === "register") {
            $("header").hide();
            return;
        }
        $.get("/views/components/header.html", function (html_data) {
            $("header").html(html_data);
            if (typeof router !== "undefined" && router.ActiveLink) {
                document.title = capitalizeFirstLetter(router.ActiveLink);
                $(`li > a:contains(${document.title})`).addClass("active").attr("aria-current", "page");
            }
            AddNavigationEvents();
            CheckLogin();
        });
    }
    function capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    function AddNavigationEvents() {
        let navlinks = $("ul>li>a");
        navlinks.off("click");
        navlinks.off("mouseenter");
        navlinks.on("mouseenter", function () {
            $(this).css("cursor", "pointer");
        });
    }
    function DisplayPatientListPage() {
        fetch("http://localhost:5000/api/patients")
            .then((response) => {
            if (!response.ok) {
                throw new Error("Error fetching patient data");
            }
            return response.json();
        })
            .then((data) => {
            buildTable(data);
            displayPatientDetails(data);
        })
            .catch((error) => console.error("Error fetching patient data:", error));
        function buildTable(data) {
            const patientData = document.querySelector("#data-output");
            let output = "";
            for (const patient of data) {
                output += `
                <tr>
                    <td>${patient.id}</td>
                    <td>${patient.first_name}</td>
                    <td>${patient.last_name}</td>
                    <td>${patient.age}</td>
                    <td>
                        <button class="btn btn-primary" onclick="patientInfo('${patient.id}')">View</button>
                        <button class="btn btn-primary" onclick="handleAction('${patient.first_name}')">Edit</button>
                    </td>
                </tr>
            `;
            }
            patientData.innerHTML = output;
        }
        window.patientInfo = (id) => {
            window.location.href = `/patient_profile#${id}`;
        };
        window.handleAction = (name) => {
            console.log(`Handle action for patient: ${name}`);
        };
        function displayPatientDetails(data) {
            const patientId = getPatientIdFromUrl();
            if (!patientId) {
                console.warn("No patient ID in URL.");
                return;
            }
            const patient = data.find((p) => p.id === patientId);
            const detailDiv = document.getElementById("patientDetail");
            if (patient) {
                const patientInfoHTML = `
                <p><strong>ID:</strong> ${patient.id}</p>
                <p><strong>Name:</strong> ${patient.first_name} ${patient.last_name}</p>
                <p><strong>Gender:</strong> ${patient.gender}</p>
                <p><strong>Age:</strong> ${patient.age}</p>
                <p><strong>Health Card Number:</strong> ${patient.healthCardNumber}</p>
                <p><strong>Email Address:</strong> ${patient.emailAddress}</p>
                <p><strong>Phone Number:</strong> ${patient.phoneNumber}</p>
                <p><strong>Address:</strong> ${patient.address}</p>
            `;
                detailDiv.innerHTML = patientInfoHTML;
            }
            else {
                detailDiv.innerHTML = "<p>Patient not found.</p>";
                console.warn("No matching patient found for ID:", patientId);
            }
        }
        function getPatientIdFromUrl() {
            return window.location.hash ? window.location.hash.substring(1) : null;
        }
    }
    function DisplayAdminDashboardPage() {
        console.log("Called DisplayAdminDashboardPage()");
        const addPatientBtn = document.querySelector("#addPatientBtn");
        if (addPatientBtn) {
            addPatientBtn.addEventListener("click", () => {
                location.href = "/add_patient";
            });
        }
        const enterPresBtn = document.getElementById("enterPrescription");
        if (enterPresBtn) {
            enterPresBtn.addEventListener("click", () => {
                location.href = "/enter_prescription";
            });
        }
        const ordMedicBtn = document.getElementById("ordMedicBtn");
        if (ordMedicBtn) {
            ordMedicBtn.addEventListener("click", () => {
                location.href = "/order_medication";
            });
        }
        const vacAppBtn = document.getElementById("vacAppBtn");
        if (vacAppBtn) {
            vacAppBtn.addEventListener("click", () => {
                location.href = "/vaccine_appointment";
            });
        }
        const blisPatBtn = document.getElementById("blisPatBtn");
        if (blisPatBtn) {
            blisPatBtn.addEventListener("click", () => {
                location.href = "/blister_patient";
            });
        }
        const transPatBtn = document.getElementById("transPatBtn");
        if (transPatBtn) {
            transPatBtn.addEventListener("click", () => {
                location.href = "/transfer_patient";
            });
        }
    }
    function DisplayLoginPage() {
        console.log("Called DisplayLoginPage()");
        let messageArea = $("#messageArea");
        messageArea.hide();
        $("#loginButton").on("click", function () {
            let username = document.forms[0].username.value;
            let password = document.forms[0].password.value;
            fetch("/api/users/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            })
                .then((response) => {
                if (!response.ok) {
                    throw new Error("Invalid Login Credentials");
                }
                return response.json();
            })
                .then((user) => {
                let newUser = new core.User();
                newUser.fromJSON(user);
                let redirectURL = "";
                if (user.role === "Admin") {
                    redirectURL = "/admin_dashboard";
                }
                else if (user.role === "Patient") {
                    redirectURL = "/patient_dashboard";
                }
                sessionStorage.setItem("user", JSON.stringify(user));
                messageArea.removeAttr("class").hide();
                location.href = redirectURL;
            })
                .catch((error) => {
                console.error("Error during login:", error);
                $("#username").trigger("focus").trigger("select");
                messageArea
                    .addClass("alert alert-danger")
                    .text("Error: Invalid Login Credentials")
                    .show();
            });
        });
        $("#cancelButton").on("click", function () {
            document.forms[0].reset();
            location.href = "/home";
        });
    }
    function DisplayAddPatient() {
        console.log("Called DisplayAddPatient");
    }
    function DisplayRegisterPage() {
        console.log("Called DisplayRegisterPage()");
        document.getElementById('registerForm')?.addEventListener('submit', async function (event) {
            event.preventDefault();
            const getInputValue = (id) => {
                const element = document.getElementById(id);
                return element ? element.value.trim() : null;
            };
            const firstName = getInputValue('firstName');
            const lastName = getInputValue('lastName');
            const emailAddress = getInputValue('emailAddress');
            const address = getInputValue('address');
            const contactNumber = getInputValue('contactNumber');
            const gender = document.getElementById('gender')?.value || null;
            const age = getInputValue('age');
            const healthCardNumber = getInputValue('healthCardNumber');
            const password = getInputValue('password');
            const confirmPassword = getInputValue('confirmPassword');
            if (!firstName || !lastName || !emailAddress || !address || !contactNumber || !gender || !age || !healthCardNumber || !password || !confirmPassword) {
                alert('One or more form fields are missing!');
                return;
            }
            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }
            const formData = {
                firstName,
                lastName,
                emailAddress,
                address,
                contactNumber,
                gender,
                age,
                healthCardNumber,
                password
            };
            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                const result = await response.json();
                if (response.ok) {
                    alert('Registration successful!');
                    window.location.href = '/login';
                }
                else {
                    alert('Registration failed: ' + result.message);
                }
            }
            catch (error) {
                console.error('Error:', error);
                alert('An error occurred during registration.');
            }
        });
    }
    function DisplayPrescriptionRequestPage() {
        console.log("DisplayPrescriptionRequestPage is running");
        const userSession = sessionStorage.getItem("user");
        if (!userSession) {
            alert("You need to log in first.");
            window.location.href = "/login";
            return;
        }
        const user = JSON.parse(userSession);
        const userEmail = user.username.trim();
        fetch(`/api/patients/email/${userEmail}`)
            .then(response => response.json())
            .then(patient => {
            if (!patient) {
                throw new Error("Patient record not found.");
            }
            const patientId = patient.id;
            console.log("Retrieved Patient ID:", patientId);
            return Promise.all([
                fetch(`/api/prescriptions/${patientId}`).then(res => res.json()),
                fetch(`/api/refill_requests/${patientId}`).then(res => res.json())
            ]);
        })
            .then(([prescriptions, refillRequests]) => {
            const pastRequests = refillRequests.filter((req) => req.status !== "Pending");
            const tableBody = document.getElementById("rxRequest");
            if (!tableBody) {
                console.error("Table body not found.");
                return;
            }
            if (prescriptions.length > 0) {
                tableBody.innerHTML = "";
                prescriptions.forEach((prescription) => {
                    let status = "";
                    let action = "";
                    const existingRequest = refillRequests.find((req) => req.rxnum === prescription.rxnum);
                    const isPending = existingRequest && existingRequest.status === "Pending";
                    if (prescription.remaining > 0) {
                        status = `<span class="badge bg-success">Active</span>`;
                        if (isPending) {
                            action = `<button class="btn btn-secondary" disabled>Pending</button>`;
                        }
                        else {
                            action = `<button class="btn btn-primary refill-btn" data-rx="${prescription.rxnum}">Request Refill</button>`;
                        }
                    }
                    else {
                        status = `<span class="badge bg-danger">Inactive</span>`;
                        action = `<span class="text-muted">No Refill Available</span>`;
                    }
                    const row = document.createElement("tr");
                    row.innerHTML = `
                            <td>${new Date(prescription.dispensed_day).toLocaleDateString()}</td>
                            <td>${prescription.rxnum}</td>
                            <td>${prescription.name}</td>
                            <td>${prescription.qty}</td>
                            <td>${prescription.day_qty}</td>
                            <td>${prescription.remaining}</td>
                            <td>${prescription.total_authorised_qty}</td>
                            <td>${status}</td>
                            <td>${action}</td>
                        `;
                    tableBody.appendChild(row);
                });
                document.querySelectorAll(".refill-btn").forEach((button) => {
                    button.addEventListener("click", (event) => {
                        const rxnum = event.currentTarget.dataset.rx;
                        if (rxnum) {
                            requestRefill(rxnum);
                        }
                        else {
                            console.error("No RxNum found for refill request.");
                        }
                    });
                });
            }
            else {
                tableBody.innerHTML = `<tr><td colspan="10">No prescriptions found.</td></tr>`;
            }
            DisplayRequestHistory(pastRequests);
        })
            .catch(error => console.error("Error:", error));
    }
    function requestRefill(rxnum) {
        fetch(`/api/refill/${rxnum}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "user-session": sessionStorage.getItem("user") || ""
            }
        })
            .then(response => response.json())
            .then(data => {
            alert(data.message);
            location.reload();
        })
            .catch(error => console.error("Error requesting refill:", error));
    }
    function DisplayRequestHistory(pastRequests) {
        const historyTableBody = document.getElementById("requestHistory");
        if (!historyTableBody) {
            console.error("Request history table body not found.");
            return;
        }
        historyTableBody.innerHTML = "";
        if (pastRequests.length > 0) {
            pastRequests.forEach((request) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                <td>${new Date(request.request_date).toLocaleDateString()}</td>
                <td>${request.rxnum}</td>
                <td>${request.medication}</td>
                <td><span class="badge ${request.status === "Approved" ? "bg-success" : "bg-danger"}">${request.status}</span></td>
            `;
                historyTableBody.appendChild(row);
            });
        }
        else {
            historyTableBody.innerHTML = `<tr><td colspan="4">No past refill requests found.</td></tr>`;
        }
    }
    function DisplayPatientDashboardPage() {
        console.log("DisplayPatientDashboardPage is running");
        const userSession = sessionStorage.getItem("user");
        if (!userSession) {
            alert("You need to log in first.");
            window.location.href = "/login";
            return;
        }
        const user = JSON.parse(userSession);
        const userEmail = user.username.trim();
        fetch(`/api/patients/email/${userEmail}`)
            .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch patient");
            }
            return response.json();
        })
            .then(patient => {
            if (!patient) {
                throw new Error("Patient record not found.");
            }
            const patientId = patient.id;
            return fetch(`/api/prescriptions/${patientId}`);
        })
            .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch prescriptions");
            }
            return response.json();
        })
            .then((data) => {
            const tableBody = document.getElementById("prescriptionTableBody");
            if (!tableBody) {
                console.error("Table body not found.");
                return;
            }
            if (data.length > 0) {
                tableBody.innerHTML = "";
                data.forEach((prescription, index) => {
                    let status = "";
                    if (prescription.remaining > 0) {
                        status = `<span class="badge bg-success">Active</span>`;
                    }
                    else {
                        status = `<span class="badge bg-danger">Inactive</span>`;
                    }
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${new Date(prescription.dispensed_day).toLocaleDateString()}</td>
                        <td><a href="#" class="rx-link" data-index="${index}">${prescription.rxnum}</a></td>
                        <td>${prescription.name}</td>
                        <td>${status}</td> <!-- Dynamically added status -->
                    `;
                    tableBody.appendChild(row);
                });
                updatePrescriptionDetails(data[0]);
                document.querySelectorAll(".rx-link").forEach(link => {
                    link.addEventListener("click", (event) => {
                        event.preventDefault();
                        const target = event.target;
                        const index = parseInt(target.dataset.index);
                        updatePrescriptionDetails(data[index]);
                    });
                });
            }
            else {
                tableBody.innerHTML = `<tr><td colspan="4">No prescriptions found.</td></tr>`;
            }
        })
            .catch(error => console.error("Error:", error));
    }
    function updatePrescriptionDetails(prescription) {
        document.getElementById("detailRxNumber").textContent = prescription.rxnum;
        document.getElementById("detailDoctor").textContent = prescription.doctor_cpso;
        document.getElementById("detailIssued").textContent = prescription.dispensed_day;
        let status = "";
        if (prescription.remaining > 0) {
            status = `<span class="badge bg-success">Active</span>`;
        }
        else {
            status = `<span class="badge bg-danger">Inactive</span>`;
        }
        const detailBody = document.getElementById("prescriptionDetailTBody");
        detailBody.innerHTML = "";
        const row = document.createElement("tr");
        row.innerHTML = `
        <td>${prescription.name}</td>
        <td>${prescription.day_qty} per day</td>
        <td>${prescription.remaining} remaining</td>
    `;
        detailBody.appendChild(row);
        const refillButton = document.getElementById("refillPageLink");
        refillButton.style.display = "inline-block";
        refillButton.href = `/prescription_request`;
        refillButton.textContent = "Request Refill";
    }
    function DisplayRequestProcessPage() {
        console.log("DisplayRequestProcessPage is running");
        fetch("/api/refill_requests")
            .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch refill requests");
            }
            return response.json();
        })
            .then((requests) => {
            const tableBody = document.getElementById("requestProcess");
            if (!tableBody) {
                console.error("Table body not found.");
                return;
            }
            tableBody.innerHTML = "";
            const pendingRequests = requests.filter((request) => request.status === "Pending");
            if (pendingRequests.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="5">No pending requests.</td></tr>`;
                return;
            }
            pendingRequests.forEach((request) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${new Date(request.request_date).toLocaleDateString()}</td>
                    <td>${request.patient_id}</td>
                    <td>${request.rxnum}</td>
                    <td>${request.medication}</td>
                    <td>
                        <button class="btn btn-success approve-btn" data-id="${request.id}">Approve</button>
                        <button class="btn btn-danger reject-btn" data-id="${request.id}">Reject</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            document.querySelectorAll(".approve-btn").forEach(button => {
                button.addEventListener("click", (event) => {
                    const requestId = event.currentTarget.dataset.id;
                    processRefillRequest(requestId, "Approved");
                });
            });
            document.querySelectorAll(".reject-btn").forEach(button => {
                button.addEventListener("click", (event) => {
                    const requestId = event.currentTarget.dataset.id;
                    processRefillRequest(requestId, "Rejected");
                });
            });
        })
            .catch(error => console.error("Error fetching refill requests:", error));
    }
    function processRefillRequest(requestId, status) {
        fetch(`/api/refill_requests/${requestId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        })
            .then(response => response.json())
            .then(data => {
            alert(data.message);
            window.location.reload();
        })
            .catch(error => console.error(`Error updating request status:`, error));
    }
    function Display404Page() {
        console.log("Display404Page() Called..");
    }
    function LoadContent() {
        let page_name = router.ActiveLink;
        let callback = ActiveLinkCallback();
        $.get(`./views/content/${page_name}.html`, function (html_data) {
            $("main").html(html_data);
            callback();
        });
    }
    function AuthGuard() {
        let protected_routes = ["patient_profile", "admin_dashboard"];
        if (protected_routes.indexOf(router.ActiveLink) > -1) {
            if (!sessionStorage.getItem("user")) {
                location.href = "/login";
            }
        }
    }
    function ActiveLinkCallback() {
        switch (router.ActiveLink) {
            case "admin_dashboard": return DisplayAdminDashboardPage;
            case "login": return DisplayLoginPage;
            case "patient_list": return DisplayPatientListPage;
            case "register": return DisplayRegisterPage;
            case "add_patient": return DisplayAddPatient;
            case "enter_prescription": return DisplayEnterPrescription;
            case "prescription_request": return DisplayPrescriptionRequestPage;
            case "request_process": return DisplayRequestProcessPage;
            case "patient_dashboard": return DisplayPatientDashboardPage;
            case "404": return Display404Page;
            default:
                console.error("ERROR: Callback doesn't exist for ActiveLink - " + router.ActiveLink);
                return function () { };
        }
    }
    function Start() {
        console.log("App Started");
        let html_data = "";
        Loadheader(html_data);
        AuthGuard();
        LoadContent();
    }
    window.addEventListener("load", Start);
})();
//# sourceMappingURL=app.js.map