"use strict";
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
    function DisplayPrescriptionRequestPage() {
        console.log("Called DisplayPrescriptionRequestPage()");
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
                    redirectURL = "/patient_list";
                }
                sessionStorage.setItem("user", newUser.serialize());
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