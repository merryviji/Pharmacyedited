"use strict";
var core;
(function (core) {
    class Router {
        _activeLink;
        _routingTable;
        _linkData;
        constructor() {
            this._activeLink = "";
            this._routingTable = [];
            this._linkData = "";
        }
        get LinkData() {
            return this._linkData;
        }
        set LinkData(link) {
            this._linkData = link;
        }
        get ActiveLink() {
            return this._activeLink;
        }
        set ActiveLink(link) {
            this._activeLink = link;
        }
        Add(router) {
            this._routingTable.push(route);
        }
        AddTable(routingTable) {
            this._routingTable = routingTable;
        }
        Find(route) {
            return this._routingTable.indexOf(route);
        }
        Remove(route) {
            if (this.Find(route) > -1) {
                this._routingTable.splice(this.Find(route), 1);
                return true;
            }
            return false;
        }
        toString() {
            return this._routingTable.toString();
        }
    }
    core.Router = Router;
})(core || (core = {}));
let router = new core.Router();
router.AddTable([
    "/",
    "/home",
    "/prescription_request",
    "/admin_dashboard",
    "/login",
    "/patient_list",
    "/register",
    "/patient_profile",
    "/order_medication",
    "/enter_prescription",
    "/add_patient",
    "/vaccine_appointment",
    "/blister_patient",
    "/transfer_patient"
]);
let route = location.pathname;
router.ActiveLink = (router.Find(route) > -1) ? ((route === "/") ? "home" : route.substring(1)) : ("404");
//# sourceMappingURL=router.js.map