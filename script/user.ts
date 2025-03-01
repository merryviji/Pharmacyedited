"use strict";

namespace core {
    export class User {
        private _role: string;
        private _username: string;
        private _password: string;

        public get role(): string {
            return this._role;
        }

        public set role(value: string) {
            this._role = value;
        }

        public get username(): string {
            return this._username;
        }

        public set username(value: string) {
            this._username = value;
        }

        constructor(role:string = "", username:string = "", password:string = "") {
            this._role = role;
            this._username = username;
            this._password = password;
        }

        public toString(): string {
            return `role: ${this._role}\nUsername: ${this._username}`;
        }

        public serialize():string|null {
            if (this._role !== "" && this._username !== "") {
                return `${this._role},${this._username}`;
            }
            console.error("One or more of the User properties is missing or invalid.");
            return null;
        }

        public deserialize(data:string) {
            let propertyArray = data.split(",");
            this._role = propertyArray[0];
            this._username = propertyArray[1];
        }

        public toJSON():{Username:string; role:string; Password:string} {
            return {
                "role": this._role,
                "Username": this._username,
                "Password": this._password
            };
        }

        public fromJSON(data:User) {
            this._role = data.role;
            this._username = data.username;
            this._password = data._password;
        }
    }

}
