"use strict";

// tell ts the structure of this data table, and which data we expect in the function
interface Prescription {
    rxnum: string;
    name: string;
    qty: number;
    remaining: number;
    total_authorised_qty: number;
    dispensed_day: string;
    day_qty: number;
    doctor_cpso: string;
}


interface RefillRequest  {
    id: number;
    rxnum: string;
    patient_id: string;
    request_date: string;
    medication: string;
    status: string;
};




(function (){


    function CheckLogin() {
        // if (sessionStorage.getItem("user")) {
        //     $("#login").html(`<a id="logout" class="nav-link" href="#"> <i class="fas fa-sign-out-alt"></i>Logout</a>`);
        //
        // }
        $("#login").html(`<a id="logout" class="nav-link" href="/login"> 
        <i class="fas fa-sign-out-alt"></i>Logout</a>`);
        $("#logout").on("click", function() {
            sessionStorage.clear();
            location.href = "/login";
        });
    }

    function DisplayEnterPrescription(){
        console.log(" Called DisplayEnterPrescription")
    }

    function Loadheader(html_data: string): void {

        if (router.ActiveLink === "login"|| router.ActiveLink === "register") {
            $("header").hide();
            return;
        }

        $.get("/views/components/header.html", function (html_data) {
            $("header").html(html_data);

            // Ensure router is defined and has ActiveLink
            if (typeof router !== "undefined" && router.ActiveLink) {
                document.title = capitalizeFirstLetter(router.ActiveLink);
                $(`li > a:contains(${document.title})`).addClass("active").attr("aria-current", "page");
            }

            AddNavigationEvents();
            CheckLogin();
        });
    }

    function capitalizeFirstLetter(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }


    function AddNavigationEvents(): void {
        let navlinks: JQuery<HTMLElement> = $("ul>li>a");
        navlinks.off("click");
        navlinks.off("mouseenter");
        navlinks.on("mouseenter", function () {
            $(this).css("cursor", "pointer");
        });
    }



    function DisplayPatientListPage(): void {
        interface Patient {
            id: string;
            first_name: string;
            last_name: string;
            gender: string;
            age: number;
            healthCardNumber: number;
            emailAddress: string;
            phoneNumber: number;
            address: string;
        }

        // Fetch patient data from the backend API
        fetch("http://localhost:5000/api/patients")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Error fetching patient data");
                }
                return response.json();
            })
            .then((data: Patient[]) => {
                buildTable(data);
                displayPatientDetails(data);
            })
            .catch((error: Error) => console.error("Error fetching patient data:", error));

        function buildTable(data: Patient[]): void {
            const patientData = document.querySelector("#data-output") as HTMLElement;
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

        (window as any).patientInfo = (id: string): void => {
            window.location.href = `/patient_profile#${id}`;
        };

        (window as any).handleAction = (name: string): void => {
            console.log(`Handle action for patient: ${name}`);
        };

        function displayPatientDetails(data: Patient[]): void {
            const patientId = getPatientIdFromUrl();

            if (!patientId) {
                console.warn("No patient ID in URL.");
                return;
            }

            const patient = data.find((p) => p.id === patientId);

            const detailDiv = document.getElementById("patientDetail") as HTMLElement;

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
            } else {
                detailDiv.innerHTML = "<p>Patient not found.</p>";
                console.warn("No matching patient found for ID:", patientId);
            }
        }

        function getPatientIdFromUrl(): string | null {
            return window.location.hash ? window.location.hash.substring(1) : null;
        }
    }



    function DisplayAdminDashboardPage(): void {
        console.log("Called DisplayAdminDashboardPage()");

        const addPatientBtn = document.querySelector<HTMLButtonElement>("#addPatientBtn");
        if (addPatientBtn) {
            addPatientBtn.addEventListener("click", () => {
                location.href = "/add_patient";
            });
        }

        const enterPresBtn = document.getElementById("enterPrescription") as HTMLButtonElement | null;
        if (enterPresBtn) {
            enterPresBtn.addEventListener("click", () => {
                location.href = "/enter_prescription";
            });
        }

        const ordMedicBtn = document.getElementById("ordMedicBtn") as HTMLButtonElement | null;
        if (ordMedicBtn) {
            ordMedicBtn.addEventListener("click", () => {
                location.href = "/order_medication";
            });
        }

        const vacAppBtn = document.getElementById("vacAppBtn") as HTMLButtonElement | null;
        if (vacAppBtn) {
            vacAppBtn.addEventListener("click", () => {
                location.href = "/vaccine_appointment";
            });
        }

        const blisPatBtn = document.getElementById("blisPatBtn") as HTMLButtonElement | null;
        if (blisPatBtn) {
            blisPatBtn.addEventListener("click", () => {
                location.href = "/blister_patient";
            });
        }

        const transPatBtn = document.getElementById("transPatBtn") as HTMLButtonElement | null;
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
            let username: string = document.forms[0].username.value;
            let password: string = document.forms[0].password.value;

            // Fetch user data from the backend server
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

                    // Set redirection based on user role
                    let redirectURL = "";
                    if (user.role === "Admin") {
                        redirectURL = "/admin_dashboard"; // Redirect Admin
                    } else if (user.role === "Patient") {
                        redirectURL = "/patient_dashboard"; // Redirect Patient
                    }

                    // Store user data in sessionStorage
                    //sessionStorage.setItem("user", newUser.serialize() as string);
                    sessionStorage.setItem("user", JSON.stringify(user));

                    messageArea.removeAttr("class").hide();
                    location.href = redirectURL; // Redirect user to the appropriate page
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

    function DisplayAddPatient(){
        console.log("Called DisplayAddPatient");

    }

    function DisplayRegisterPage() {
        console.log("Called DisplayRegisterPage()");
        document.getElementById('registerForm')?.addEventListener('submit', async function (event: Event) {
            event.preventDefault(); // Prevent the default form submission

            // Gather form data safely
            const getInputValue = (id: string): string | null => {
                const element = document.getElementById(id) as HTMLInputElement | null;
                return element ? element.value.trim() : null;
            };

            const firstName = getInputValue('firstName');
            const lastName = getInputValue('lastName');
            const emailAddress = getInputValue('emailAddress');
            const address = getInputValue('address');
            const contactNumber = getInputValue('contactNumber');
            const gender = (document.getElementById('gender') as HTMLSelectElement | null)?.value || null;
            const age = getInputValue('age');
            const healthCardNumber = getInputValue('healthCardNumber');
            const password = getInputValue('password');
            const confirmPassword = getInputValue('confirmPassword');

            // Check if any field is missing
            if (!firstName || !lastName || !emailAddress || !address || !contactNumber || !gender || !age || !healthCardNumber || !password || !confirmPassword) {
                alert('One or more form fields are missing!');
                return;
            }

            // Validate passwords match
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

            // Send the data to the server
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
                } else {
                    alert('Registration failed: ' + result.message);
                }
            } catch (error) {
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
        const userEmail = user.username.trim(); // Get email from session

        // Fetch Patient ID using Email
        fetch(`/api/patients/email/${userEmail}`)
            .then(response => response.json())
            .then(patient => {
                if (!patient) {
                    throw new Error("Patient record not found.");
                }

                const patientId = patient.id;
                console.log("Retrieved Patient ID:", patientId);

                // Fetch Prescriptions and requests using Patient ID
                // Promise.all helps to run both
                // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
                return Promise.all([
                    fetch(`/api/prescriptions/${patientId}`).then(res => res.json()),
                    fetch(`/api/refill_requests/${patientId}`).then(res => res.json()) // Fetch refill requests
                ]);
            })
            .then(([prescriptions, refillRequests]) => {

                // Separate pending and past requests by filter, create an array for processed requests
                // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
                const pastRequests = refillRequests.filter((req: any) => req.status !== "Pending");

                const tableBody = document.getElementById("rxRequest") as HTMLTableSectionElement | null;
                if (!tableBody) {
                    console.error("Table body not found.");
                    return;
                }

                if (prescriptions.length > 0) {
                    tableBody.innerHTML = ""; // Clear previous content

                    prescriptions.forEach((prescription: any) => {
                        let status: string = "";
                        let action: string = "";

                        // find if a existing request matches this prescription and check if it's still pending
                        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
                        const existingRequest = refillRequests.find((req: any) => req.rxnum === prescription.rxnum);
                        const isPending = existingRequest && existingRequest.status === "Pending";

                        if (prescription.remaining > 0) {
                            status = `<span class="badge bg-success">Active</span>`;

                            // if the existing request still pendind, disable the button
                            if (isPending) {
                                action = `<button class="btn btn-secondary" disabled>Pending</button>`;
                            } else {
                                action = `<button class="btn btn-primary refill-btn" data-rx="${prescription.rxnum}">Request Refill</button>`;
                            }
                        } else {
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

                    // Attach event listeners for refill requests
                    document.querySelectorAll(".refill-btn").forEach((button) => {
                        button.addEventListener("click", (event) => {
                            const rxnum: string | undefined = (event.currentTarget as HTMLButtonElement).dataset.rx;
                            if (rxnum) {
                                requestRefill(rxnum);
                            } else {
                                console.error("No RxNum found for refill request.");
                            }
                        });
                    });

                } else {
                    tableBody.innerHTML = `<tr><td colspan="10">No prescriptions found.</td></tr>`;
                }

                // Call function to display past refill requests
                DisplayRequestHistory(pastRequests);
            })

            .catch(error => console.error("Error:", error));
    }


    // Function to handle refill request
    function requestRefill(rxnum: string) {
        fetch(`/api/refill/${rxnum}`, {
            // use "POST" request to send data to server, json data in userSession
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "user-session": sessionStorage.getItem("user") || ""
            }
        })
            .then(response => response.json())
            .then(data => {
                // message send by server to prompt user request send suceed
                alert(data.message);
                // reload the page
                location.reload();
            })
            .catch(error => console.error("Error requesting refill:", error));
    }




    function DisplayRequestHistory(pastRequests: any[]) {

        const historyTableBody = document.getElementById("requestHistory") as HTMLTableSectionElement | null;
        if (!historyTableBody) {
            console.error("Request history table body not found.");
            return;
        }

        historyTableBody.innerHTML = ""; // Clear existing history

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
        } else {
            historyTableBody.innerHTML = `<tr><td colspan="4">No past refill requests found.</td></tr>`;
        }
    }













    function DisplayPatientDashboardPage() {
        console.log("DisplayPatientDashboardPage is running");

        // Get user session as string
        // https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
        const userSession = sessionStorage.getItem("user");
        if (!userSession) {
            alert("You need to log in first.");
           // https://developer.mozilla.org/en-US/docs/Web/API/Window/location
            window.location.href = "/login";
            return;
        }

        // convert userSession from string to json
        const user = JSON.parse(userSession);
        // get user email from userSession's username, trim can remove the space
        const userEmail = user.username.trim();

        // Fetch Patient ID using Email
        // use fetch() to make http request, in the () is the request url
        // https://www.w3schools.com/js/js_api_fetch.asp
        fetch(`/api/patients/email/${userEmail}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to fetch patient");
                }
                // convert from json to js object
                return response.json();
            })
            .then(patient => {
                // patient not found
                if (!patient) {
                    throw new Error("Patient record not found.");
                }

                const patientId = patient.id; // Extract patient ID

                // Fetch Prescriptions using Patient ID
                return fetch(`/api/prescriptions/${patientId}`);
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to fetch prescriptions");
                }
                return response.json();
            })
            .then((data) => {
                // find the tbody with ID prescriptionTableBody, and insert it
                const tableBody = document.getElementById("prescriptionTableBody") as HTMLTableSectionElement | null;
                if (!tableBody) {
                    console.error("Table body not found.");
                    return;
                }

                if (data.length > 0) {
                    // https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML
                    tableBody.innerHTML = ""; // Clear previous content

                    // loops data in prescription
                    data.forEach((prescription: any, index: number) => {
                        let status = "";
                        if (prescription.remaining > 0) {
                            status = `<span class="badge bg-success">Active</span>`;
                        } else {
                            status = `<span class="badge bg-danger">Inactive</span>`;
                        }

                        // create table row
                        const row = document.createElement("tr");
                        // fill the row with data
                        row.innerHTML = `
                        <td>${new Date(prescription.dispensed_day).toLocaleDateString()}</td>
                        <td><a href="#" class="rx-link" data-index="${index}">${prescription.rxnum}</a></td>
                        <td>${prescription.name}</td>
                        <td>${status}</td> <!-- Dynamically added status -->
                    `;
                        // Add a new row
                        tableBody.appendChild(row);
                    });

                    // Show details of the FIRST prescription by default
                    updatePrescriptionDetails(data[0]);

                    // Attach Click Event to Rx Numbers
                    document.querySelectorAll(".rx-link").forEach(link => {
                        link.addEventListener("click", (event) => {
                            event.preventDefault();
                            const target = event.target as HTMLAnchorElement;
                            const index = parseInt(target.dataset.index as string);
                            updatePrescriptionDetails(data[index]);
                        });
                    });

                } else {
                    tableBody.innerHTML = `<tr><td colspan="4">No prescriptions found.</td></tr>`;
                }
            })
            .catch(error => console.error("Error:", error));
    }

    function updatePrescriptionDetails(prescription: any) {

        // Set prescription details
        // textContent used to add text
        // https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
        document.getElementById("detailRxNumber")!.textContent = prescription.rxnum;
        document.getElementById("detailDoctor")!.textContent = prescription.doctor_cpso;
        document.getElementById("detailIssued")!.textContent = prescription.dispensed_day;

        // Determine status dynamically
        let status = "";
        if (prescription.remaining > 0) {
            status = `<span class="badge bg-success">Active</span>`;
        } else {
            status = `<span class="badge bg-danger">Inactive</span>`;
        }

        // Update table with medication details
        const detailBody = document.getElementById("prescriptionDetailTBody") as HTMLTableSectionElement;
        detailBody.innerHTML = ""; // Clear existing data

        const row = document.createElement("tr");
        row.innerHTML = `
        <td>${prescription.name}</td>
        <td>${prescription.day_qty} per day</td>
        <td>${prescription.remaining} remaining</td>
    `;
        detailBody.appendChild(row);

        // Add refill button logic based on status
        const refillButton = document.getElementById("refillPageLink") as HTMLAnchorElement;
            refillButton.style.display = "inline-block"; // Show refill button
            refillButton.href = `/prescription_request`;
            refillButton.textContent = "Request Refill";
    }





    function DisplayRequestProcessPage() {
        console.log("DisplayRequestProcessPage is running");

        // Fetch all refill requests
        fetch("/api/refill_requests")
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to fetch refill requests");
                }
                return response.json();
            })
            .then((requests) => {

                // Get the table body element
                const tableBody = document.getElementById("requestProcess") as HTMLTableSectionElement | null;
                if (!tableBody) {
                    console.error("Table body not found.");
                    return;
                }

                // Clear existing table content
                tableBody.innerHTML = "";

                // Filter only pending requests
                const pendingRequests = requests.filter((request: any) => request.status === "Pending");

                if (pendingRequests.length === 0) {
                    tableBody.innerHTML = `<tr><td colspan="5">No pending requests.</td></tr>`;
                    return;
                }

                // Populate table with pending requests
                pendingRequests.forEach((request: RefillRequest) => {
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

                // Attach event listeners for approve and reject buttons
                document.querySelectorAll(".approve-btn").forEach(button => {
                    button.addEventListener("click", (event) => {
                        const requestId = (event.currentTarget as HTMLButtonElement).dataset.id!;
                        processRefillRequest(requestId, "Approved");
                    });
                });

                document.querySelectorAll(".reject-btn").forEach(button => {
                    button.addEventListener("click", (event) => {
                        const requestId = (event.currentTarget as HTMLButtonElement).dataset.id!;
                        processRefillRequest(requestId, "Rejected");
                    });
                });
            })
            .catch(error => console.error("Error fetching refill requests:", error));
    }

    // Function to handle approving/rejecting requests
    function processRefillRequest(requestId: string, status: string) {
        fetch(`/api/refill_requests/${requestId}`, {
            // send PUT request to update the requests data, json data, update status
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








    function Display404Page(){
        console.log("Display404Page() Called..");
    }




    function LoadContent(): void {
        let page_name: string = router.ActiveLink;
        let callback: () => void = ActiveLinkCallback();
        $.get(`./views/content/${page_name}.html`, function(html_data: string): void {
            $("main").html(html_data);
            callback();
        });
    }
    function AuthGuard(){
        let protected_routes = ["patient_profile","admin_dashboard"];

        if(protected_routes.indexOf(router.ActiveLink) > -1){
            if(!sessionStorage.getItem("user")) {
                location.href = "/login";
            }
        }
    }


    function ActiveLinkCallback(): () => void {
        switch(router.ActiveLink) {
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
                return function() {};
        }
    }


    function Start(): void {
        console.log("App Started");
        let html_data: string = "";
        Loadheader(html_data);
        AuthGuard();
        LoadContent();
    }


    window.addEventListener("load",Start);

})()