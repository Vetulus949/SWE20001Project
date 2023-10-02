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
    con.query(sql, (err, thisUser) => {
        if (err) throw err;
        if (thisUser[0])
        {
            if (thisUser[0].pass == pass)
            {
                console.log("signin successful");
                switch(thisUser[0].permissions)
                {
                    case 0:
                        // general user
                        res.render("general", {message:"hello, "+thisUser[0].name, userid:thisUser[0].userID})
                        break;
                    case 1:
                        // tech
                        sql = "SELECT * FROM tickets WHERE status <> 2 AND (tech <> "+thisUser[0].userID+" OR ISNULL(tech));"
                        con.query(sql, (err, resultsNotClaimed) => {
                            if (err) throw err;
                            notClaimed = resultsNotClaimed;
                            sql = "SELECT * FROM tickets WHERE status <> 2 AND tech = "+thisUser[0].userID+";"
                            con.query(sql, (err, resultsClaimed) => {
                                if (err) throw err;
                                claimed = resultsClaimed;
                                res.render("technician", {message: "hello, "+thisUser[0].name, userid:thisUser[0].userID, 
                                    notClaimed:resultsNotClaimed, claimed:claimed});
                            });
                        });
                        break;
                    case 2:
                        // admin
                        // get all users
                        sql = "SELECT * FROM users;"
                        con.query(sql, (err, resultUsers) => {
                            if (err) throw err;
                            users = resultUsers;
                            // get all tickets
                            sql = "SELECT * FROM tickets ORDER BY status;"
                            con.query(sql, (err, resultTickets) => {
                                if (err) throw err;
                                tickets = resultTickets;
                                // render new page
                                res.render("admin", {message:"hello, "+thisUser[0].name, userid:thisUser[0].userID, userList:resultUsers, ticketList:resultTickets});
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
        }
        else
        {
            console.log("signin unsuccessful");
            // render page
            res.render("signin", {message:"Signin unsuccessful.", });
        }
    });
});
// signout
router.post("/signout", (req, res) => {
    res.render("signin", {message:"Signed out."});
});
// ######################################
//      Admin Stuff
// ######################################
// create user
router.post("/createUser", (req, res) => {
    var thisUser = req.query.thisuser;
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
            sql = "SELECT * FROM tickets ORDER BY status;"
            con.query(sql, (err, resultTickets) => {
                if (err) throw err;
                tickets = resultTickets;
                // render new page
                res.render("admin", {message:"new user successfully created", userid:thisUser, userList:resultUsers, ticketList:resultTickets});
            }); 
        });
    });
});
// edit user
router.post("/editUser", (req, res) => {
    // get id
    var id = req.query.id;
    var thisuser = req.query.thisuser;
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
                sql = "SELECT * FROM tickets ORDER BY status;"
                con.query(sql, (err, resultTickets) => {
                    if (err) throw err;
                    tickets = resultTickets;
                    // render new page
                    res.render("admin", {message:"userID "+id+" successfully deleted", userid:thisuser, userList:resultUsers, ticketList:resultTickets});
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
                sql = "SELECT * FROM tickets ORDER BY status;"
                con.query(sql, (err, resultTickets) => {
                    if (err) throw err;
                    tickets = resultTickets;
                    // render new page
                    res.render("admin", {message:"new users successfully created", userid:thisuser, userList:resultUsers, ticketList:resultTickets});
                }); 
            });
        });
    }
});
// edit ticket
router.post("/editTicket", (req, res) => {

});
// ######################################
//      General User stuff
// ######################################
// create new ticket
router.post("/createTicket", (req, res) => {
    var ticketName = req.body.ticketName;
    var ticketDesc = req.body.ticketDesc;
    var creatorID = req.query.id;
    var sql = "INSERT INTO tickets (name, description, creator)" +
    "VALUES ('"+ticketName+"', '"+ticketDesc+"', "+creatorID+");";
    con.query(sql, (err, result) =>
    {
        if (err) throw err;
        console.log("ticket successfully created");
        res.render("general", {message:"new ticket successfully created", userid:creatorID})
    })
})
// ######################################
//      Technician Stuff
// ######################################
// claiming a ticket
router.post("/claimTicket", (req, res) => {
    var ticketID = req.query.ticketID;
    var techID = req.query.thisuser;
    var sql = "UPDATE tickets SET tech = "+techID+", status = 1 WHERE ticketID = "+ticketID+";";
    con.query(sql, (err, result) => {
        if (err) throw err;
        console.log("ticket successfully claimed")
        sql = "SELECT * FROM tickets WHERE status <> 2 AND (tech <> "+techID+" OR ISNULL(tech));"
        con.query(sql, (err, resultsNotClaimed) => {
            if (err) throw err;
            notClaimed = resultsNotClaimed;
            sql = "SELECT * FROM tickets WHERE status <> 2 AND tech = "+techID+";";
            con.query(sql, (err, resultsClaimed) => {
                if (err) throw err;
                claimed = resultsClaimed;
                res.render("technician", {message:"ticket successfully claimed", userid:techID, 
                    notClaimed:resultsNotClaimed, claimed:claimed});
            });
        });
    });
});
// change a ticket
router.post("/techTicketChanges", (req, res) => {
    //forfeit
    var ticketID = req.query.ticketID;
    var techID = req.query.thisuser;
    if (req.body.forfeit)
    {
        var sql = "UPDATE tickets SET tech = NULL, status = 0 WHERE ticketID = "+ticketID+";";
        con.query(sql, (err, result) => {
            if (err) throw err;
            console.log("Ticket successfully forfeit");
            sql = "SELECT * FROM tickets WHERE status <> 2 AND (tech <> "+techID+" OR ISNULL(tech));"
            con.query(sql, (err, resultsNotClaimed) => {
                if (err) throw err;
                notClaimed = resultsNotClaimed;
                sql = "SELECT * FROM tickets WHERE status <> 2 AND tech = "+techID+";";
                con.query(sql, (err, resultsClaimed) => {
                    if (err) throw err;
                    claimed = resultsClaimed;
                    res.render("technician", {message:"ticket successfully claimed", userid:techID, 
                    notClaimed:resultsNotClaimed, claimed:claimed});
                });
            });
        });
    } 
    //commit
    else if (req.body.commit)
    {
        var sql = "UPDATE tickets SET comments = '"+req.body.comments+"' WHERE ticketID = "+ticketID+";";
        con.query(sql, (err, result) => {
            if (err) throw err;
            console.log("Ticket comments successfully committed");
            sql = "SELECT * FROM tickets WHERE status <> 2 AND (tech <> "+techID+" OR ISNULL(tech));"
            con.query(sql, (err, resultsNotClaimed) => {
                if (err) throw err;
                notClaimed = resultsNotClaimed;
                sql = "SELECT * FROM tickets WHERE status <> 2 AND tech = "+techID+";";
                con.query(sql, (err, resultsClaimed) => {
                    if (err) throw err;
                    claimed = resultsClaimed;
                    res.render("technician", {message:"ticket successfully claimed", userid:techID, 
                    notClaimed:resultsNotClaimed, claimed:claimed});
                });
            });
        });
    }
    //close
    else if (req.body.close)
    {
        var sql = "UPDATE tickets SET tech = NULL, status = 2 WHERE ticketID = "+ticketID+";";
        con.query(sql, (err, result) => {
            if (err) throw err;
            console.log("Ticket successfully closed");
            sql = "SELECT * FROM tickets WHERE status <> 2 AND (tech <> "+techID+" OR ISNULL(tech));"
            con.query(sql, (err, resultsNotClaimed) => {
                if (err) throw err;
                notClaimed = resultsNotClaimed;
                sql = "SELECT * FROM tickets WHERE status <> 2 AND tech = "+techID+";";
                con.query(sql, (err, resultsClaimed) => {
                    if (err) throw err;
                    claimed = resultsClaimed;
                    res.render("technician", {message:"ticket successfully claimed", userid:techID, 
                    notClaimed:resultsNotClaimed, claimed:claimed});
                });
            });
        });
    }
});
// ######################################
// start server
app.use("/", router);
app.listen(process.env.port || 3000);
console.log("Running at Port 3000");