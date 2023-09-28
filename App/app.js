// dependencies
const express = require("express");
const app = express();
const path = require("path");
const mysql = require("mysql2");
const bodyParser = require("body-parser");

const router = express.Router();
// setup express
app.use(bodyParser.json());
router.use(express.urlencoded({ extended: true }));
// setup pug
app.engine('pug', require('pug').__express);
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
// setup mysql
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Pa55w.rd",
    database: "swe20001project"
});
// index
router.get("/", (req, res) => {
    res.render("signin", {success:""});
});
// ######################################
//          Sigin stuff
// ######################################
// signin
router.post("/signin", (req, res) => {
    var name = req.body.name;
    var pass = req.body.pass;
    console.log("signin attempt:\n\t"+name+"\n\t"+pass);
    var sql = "SELECT * FROM users WHERE name = \""+name+"\";";
    await  = con.query(sql, (err, thisUser) => {
        if (err) throw err;
        if (thisUser[0].pass == pass)
        {
            console.log("signin successful");
            switch(thisUser[0].permissions)
            {
                case 0:
                    // general user
                    break;
                case 1:
                    // tech
                    break;
                case 2:
                    // admin
                    // get all users
                    sql = "SELECT * FROM users;"
                    con.query(sql, (err, resultUsers) => {
                        if (err) throw err;
                        users = resultUsers;
                        // get all tickets
                        sql = "SELECT * FROM tickets;"
                        con.query(sql, (err, resultTickets) => {
                            if (err) throw err;
                            tickets = resultTickets;
                            // render new page
                            res.render("admin", {message:"hello, "+thisUser[0].name, userList:resultUsers, ticketList:resultTickets});
                        }); 
                    });
                break;
            }
        }
        else
        {
            console.log("signin unsuccessful");
            // render page
            res.render("signin", {message:"Signin unsuccessful.", });
        }
    });
});
// ######################################
//      Admin Stuff
// ######################################
// create user
router.post("/createUser", (req, res) => {
    var name = req.body.name;
    var pass = req.body.pass;
    var perms = req.body.perms;
    var sql = "INSERT INTO users (name, pass, permissions) VALUES (\""+name+"\",\""+pass+"\",\""+perms+"\");";
    con.query(sql, (err, result, fields) => {
        if (err) throw err;
        console.log("new user created");
        sql = "SELECT * FROM users;"
        con.query(sql, (err, resultUsers) => {
            if (err) throw err;
            users = resultUsers;
            // get all tickets
            sql = "SELECT * FROM tickets;"
            con.query(sql, (err, resultTickets) => {
                if (err) throw err;
                tickets = resultTickets;
                // render new page
                res.render("admin", {message:"new user successfully created", userList:resultUsers, ticketList:resultTickets});
            }); 
        });
    });
});
// edit user
router.post("/editUser", (req, res) => {
    // get id
    var id = req.query.id;
    // are we deleting?
    if (req.body.delete)
    {
        var sql = "DELETE FROM users WHERE userID = \""+id+"\";";
        con.query(sql, (err, resultUser) => {
            if (err) throw err;
            console.log("user deleted ID:" + id);
            sql = "SELECT * FROM users;"
            con.query(sql, (err, resultUsers) => {
                if (err) throw err;
                users = resultUsers;
                // get all tickets
                sql = "SELECT * FROM tickets;"
                con.query(sql, (err, resultTickets) => {
                    if (err) throw err;
                    tickets = resultTickets;
                    // render new page
                    res.render("admin", {message:"new user successfully created", userList:resultUsers, ticketList:resultTickets});
                }); 
            });
        });
    }
    // are we modifying?
    if (req.body.change)
    {
        console.log("changing user - for ID " + id);
        var newName = req.body.userName;
        var newPass = req.body.userPass;
        var newPerm = req.body.userPermissions;
        var sql = "UPDATE users SET "+
            "name = \""+newName+"\", "+
            "pass = \""+newPass+"\", "+
            "permissions = \""+newPerm+"\" "+
            "WHERE userID = \""+id+"\"";
        con.query(sql, (err, resultTickets) => {
            if (err) throw err;
            console.log("user modified ID:"+id);
            sql = "SELECT * FROM users;"
            con.query(sql, (err, resultUsers) => {
                if (err) throw err;
                users = resultUsers;
                // get all tickets
                sql = "SELECT * FROM tickets;"
                con.query(sql, (err, resultTickets) => {
                    if (err) throw err;
                    tickets = resultTickets;
                    // render new page
                    res.render("admin", {message:"new users successfully created", userList:resultUsers, ticketList:resultTickets});
                }); 
            });
        });
    }
});
// edit ticket
router.post("/editTicket", (req, res) => {

});
// ######################################
// ######################################

// ######################################
// ######################################
// start server
app.use("/", router);
app.listen(process.env.port || 3000);
console.log("Running at Port 3000");