"use strict";
var core;
(function (core) {
    class User {
        _role;
        _username;
        _password;
        get role() {
            return this._role;
        }
        set role(value) {
            this._role = value;
        }
        get username() {
            return this._username;
        }
        set username(value) {
            this._username = value;
        }
        constructor(role = "", username = "", password = "") {
            this._role = role;
            this._username = username;
            this._password = password;
        }
        toString() {
            return `role: ${this._role}\nUsername: ${this._username}`;
        }
        serialize() {
            if (this._role !== "" && this._username !== "") {
                return `${this._role},${this._username}`;
            }
            console.error("One or more of the User properties is missing or invalid.");
            return null;
        }
        deserialize(data) {
            let propertyArray = data.split(",");
            this._role = propertyArray[0];
            this._username = propertyArray[1];
        }
        toJSON() {
            return {
                "role": this._role,
                "Username": this._username,
                "Password": this._password
            };
        }
        fromJSON(data) {
            this._role = data.role;
            this._username = data.username;
            this._password = data._password;
        }
    }
    core.User = User;
})(core || (core = {}));
//# sourceMappingURL=user.js.map