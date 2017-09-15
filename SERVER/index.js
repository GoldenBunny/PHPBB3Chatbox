var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');
var cookieParser = require('cookie-parser');
var cookie_parser = require('cookieparser');
var jsonfile = require('jsonfile');
var fs = require("fs");

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var obj = jsonfile.readFileSync(__dirname + "/chat_files/chat_config/sql.json");
var obj_config = jsonfile.readFileSync(__dirname + "/chat_files/chat_config/config.json");

var port = obj_config.port;

if(!port)
{
    console.log("Porta não foi definida no arquivo \"config.json\"");
}

var rules = {
    min_posts: obj_config.min_posts
};

var forum_url = obj_config.forum_url;
var idiots_list = [];
var sockets_ = [];

var pool = mysql.createPool({
    host: obj.host
    , user: obj.username
    , password: obj.password
    , database: obj.database
});

function checkURL(url) {
    return (url.match(/\.(jpeg|jpg|gif|png)$/) != null);
}

function send_ladyanna(text) {
    socket.emit('post_message', {
        username: "LadyAnna"
        , message_text: text
        , time: ''
    });
}

function file_log(data) {
    var d = new Date();
    fs.writeFile(__dirname + '/chat_files/logs/log-' + String(d.getDate()) + '-' + String(d.getMonth()) + '-' + String(d.getYear()) + '---' + String(d.getHours()) + '-' + String(d.getMinutes()) + '-' + String(d.getSeconds()) + '.txt', data, function (err) {
        if (err) {
            throw err;
        }
    });
}

pool.query('SELECT * FROM chat_black_list', function (err, rows, fields) {
    if (err) {
        throw err;
    }
    else if (rows) {
        for (var i = 0; i < rows.length; i++) {
            idiots_list.push(rows[i]);
        }
    }
});

function get_user_privilege_level(user) {
    pool.query('SELECT * FROM users WHERE username=?', user, function (err, rows, fields) {
        if (!err) {
            return rows[0].privilege_level;
        }
        else {
            return false;
        }
    });
}

function getUsernameBySocketId(socketid) {
    for (var i = 0; i < sockets_.length; i++) {
        if (io.sockets.connected[sockets_[i]].id == socketid) {
            return io.sockets.connected[sockets_[i]].username;
        }
    }
    return undefined;
}

const ADMIN_GROUP_NAME = 'ADMINISTRATORS';
var ADMIN_GROUP_ID;
const ANONYMOUS_USER_ID = 1;

function getValuesOfObject(obj) {
    var strfy = JSON.parse(JSON.stringify(obj));
    var arr_result = [];
    var keys = Object.keys(strfy);
    for (var i = 0; i < keys.length; i++) {
        arr_result.push(strfy[keys[i]]);
    }
    return arr_result;
}

function userOn(username, socket) {
    io.emit('change_status', {
        status: 'on'
        , username: username
    });
    for (var i = 0; i < sockets_.length; i++) {
        if (io.sockets.connected[sockets_[i]] && io.sockets.connected[sockets_[i]].username == username) {
            io.sockets.connected[sockets_[i]].status = 'on';
            clearTimeout(io.sockets.connected[sockets_[i]].tOut);
            io.sockets.connected[sockets_[i]].tOut = setTimeout(function () {
                userAus(socket.username); //
            }, 1000*60*10);
        }
    }
}

function userAus(username) {
    io.emit('change_status', {
        status: 'aus'
        , username: username
    });    
    for (var i = 0; i < sockets_.length; i++) {
        if (io.sockets.connected[sockets_[i]] && io.sockets.connected[sockets_[i]].username == username) {
            io.sockets.connected[sockets_[i]].status = 'aus';
        }
    }
}

io.use(function (socket, next) {
    var user_id = undefined;
    var session_id = undefined;
    var cookieObj = {};
    if(socket.handshake.headers.cookie) {
        cookieObj = cookie_parser.parse(socket.handshake.headers.cookie.toString());
    } else {
		return next(new Error("Failure on getting cookies"));
	}
    var oKeys = Object.keys(cookieObj);
    var oValues = getValuesOfObject(cookieObj);
    for (var i = 0; i < oKeys.length; i++) { //
        if (oKeys[i].substr(0, 6) == 'phpbb3') {
            if (oKeys[i].substr(oKeys[i].length - 1, 1) == 'u') {
                //get user id from session
                user_id = oValues[i];
            }
            else if (oKeys[i].substr(oKeys[i].length - 3, 3) == 'sid') {
                //get session id from session
                session_id = oValues[i];
            }
        }
    }
    /*console.log(socket.handshake.headers.cookie.toString());
    console.log('cookies:'); //
    console.log(session_id);
    console.log(user_id);*/
    if (session_id && user_id && user_id != 1) { //Checa se não é um usuário anonimo
        console.log("The user inst anonymous");
        pool.query('SELECT * FROM phpbb_sessions WHERE session_id=? AND session_user_id=?', [session_id, user_id], function (err, rows, fields) {
            if (rows && rows.length > 0) {
                var _session_idphp = session_id;
                var _username_id = user_id;
                pool.query('SELECT * FROM phpbb_users WHERE user_id=?', _username_id, function (err, rows, fields) {
                    if (rows.length > 0) {
                        if (err) {
                            throw err;
                        }
                        pool.query('SELECT * FROM chat_black_list WHERE username=?', rows[0].username, function (cb_err, cb_rows, fields) {
                            if (cb_rows.length == 0) {
                                console.log(cb_rows);
                                socket.username = rows[0].username;
                                socket.avatar = 'http://' + forum_url + '/download/file.php?avatar=' + rows[0].user_avatar;
                                socket.group_id = rows[0].group_id;
                                pool.query('SELECT * FROM chat_mods WHERE username=?', socket.username, function (__err, __rows, __fields) {
                                    var a = false;
                                    if (__rows.length > 0) {
                                        //console.log(__rows);
                                        a = true;
                                    } //
                                    socket.is_mod = a;
                                    pool.query('SELECT * FROM phpbb_groups WHERE group_id=?', socket.group_id, function (_err, _rows, _fields) {
                                        socket.block = false;
                                        socket.group_colour = (_rows[0].group_colour != '') ? _rows[0].group_colour : 'black';
                                        socket.php_session_id = _session_idphp;
                                        socket.group_name = _rows[0].group_name;
                                        socket.s_username = (a) ? '@' + socket.username : socket.username;
                                        socket.free = true;
                                        socket.status = 'on';
                                        for (var i = 0; i < sockets_.length; i++) {
                                            if (io.sockets.connected[sockets_[i]] && io.sockets.connected[sockets_[i]].username == socket.username) {
                                                socket.status = io.sockets.connected[sockets_[i]].status
                                            }
                                        }
                                        pool.query("SELECT user_posts FROM phpbb_users WHERE username=?", [socket.username], function (r_err, r_rows, r_fields) {
                                            if (r_err) {
                                                throw r_err;
                                            }
                                            else {
                                                if (r_rows[0].user_posts < rules.min_posts) {
                                                    return next(new Error("posts"));
                                                }
                                            }
                                        });
                                        console.log("group name:");
                                        console.log(socket.group_name);
                                        pool.query("SELECT * FROM chat_messages ORDER BY id DESC LIMIT 200", function (err, _rows, fields) {
                                            if (!err) {
                                                socket.emit('get_messages', {
                                                    messages: _rows.reverse()
                                                });
                                            }
                                            else {
                                                console.log('SQL ERROR !');
                                                throw err;
                                            }
                                        });
                                        user_data = {
                                            username: (a) ? '@' + socket.username : socket.username
                                            , php_session_id: socket.php_session_id
                                            , group_name: socket.group_name
                                            , group_colour: socket.group_colour
                                            , avatar: socket.avatar
                                            , socket_id: socket.id
                                            , status: socket.status
                                        };
                                        console.log(user_data);
                                        for (var i = 0; i < sockets_.length; i++) {
                                            if (io.sockets.connected[sockets_[i]]) {
                                                socket.emit('user_connect', { ////
                                                    username: io.sockets.connected[sockets_[i]].s_username
                                                    , group_colour: io.sockets.connected[sockets_[i]].group_colour
                                                    , group_name: io.sockets.connected[sockets_[i]].group_name
                                                    , avatar: io.sockets.connected[sockets_[i]].avatar
                                                    , status: io.sockets.connected[sockets_[i]].status
                                                });
                                            }
                                        }
                                        pool.query('SELECT * FROM chat_emoticons', function (eerr, erows, efields) {
                                            io.emit('get_emoticons', {
                                                emoticons: erows
                                            });
                                        });
                                        //Retorna a configuração do usuário
                                        var path = __dirname + "/chat_files/user_config/" + socket.username + "/";
                                        var jsonpath = __dirname + "/chat_files/user_config/default.json";
                                        fs.access(path, fs.F_OK, function (err) {
                                            if (!err) {
                                                jsonpath = path + "config.json";
                                            }
                                            else {
                                                fs.readFile(jsonpath, function (err, data) {
                                                    if (err) {
                                                        throw err;
                                                    }
                                                    else {
                                                        console.log(data);
                                                        io.emit('chat_settings', {
                                                            json_settings: JSON.stringify(data)
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                        jsonpath = __dirname + "/chat_files/chat_config/config.json";
                                        fs.readFile(jsonpath, function (err, data) {
                                            if (err) {
                                                throw err;
                                            }
                                            else {
                                                io.emit('chat_data', {
                                                    json: data
                                                })
                                            }
                                        });
                                        io.emit('user_connect', user_data); //
                                        socket.emit('my_info', {
                                            username: socket.s_username
                                            , avatar: socket.avatar
                                            , group_name: socket.group_name
                                            , group_colour: socket.group_colour
                                        });
                                        sockets_ = Object.keys(io.sockets.connected);
                                    });
                                });
                                console.log("finished!");
                                socket.tOut = setTimeout(function () {
                                    userAus(socket.username);
                                    socket.status = 'aus';
                                }, 1000*60*10);
                                return next();
                            }
                            else {
                                console.log('user is banned!');
                                return next(new Error("banned"));
                            }
                        });
                    }
                });
            }
            else {
                console.log("not_logged");
                return next(new Error("not_logged"));
            }
        });
    }
    else {
        console.log('not_logged!');
        return next(new Error("not_logged"));
    }
});

function checkSocketFree(socket) {
    if (socket.free) {
        socket.free = false;
        socket.timming = setTimeout(function () {
            socket.free = true;
            console.log('FREE!');
        }, 300);
        return true;
    }
    else {
        return false;
    }
}

function updateChatHeader(text) {
    jsonfile.readFileSync(__dirnema + '/chat_files/chat_config/config.json');
}

io.on('connection', function (socket) {
    socket.on('connect', function () {
        
    });
    socket.on('get_chat_messages', function (data) {
        if (checkSocketFree(socket)) {
            pool.query("SELECT * FROM chat_messages ORDER BY id DESC LIMIT 200", function (err, rows, fields) {
                if (!err) {
                    socket.emit('get_chat_messages', {
                        messages: rows.reverse()
                    });
                }
                else {
                    throw err;
                }
            });
        }
        else {
            socket.disconnect();
        }
    });
    //
    socket.on('disconnect', function () {
        console.log('Disconnect Event Called');
        if (socket.username != undefined) {
            var f = false;
            for (var j = 0; j < sockets_.length; j++) {
                if (io.sockets.connected[sockets_[j]] != undefined) {
                    console.log(sockets_[j]);
                    console.log(io.sockets.connected);
                    console.log(io.sockets.connected[sockets_[j]]);
                    if (io.sockets.connected[sockets_[j]].id != socket.id && io.sockets.connected[sockets_[j]].username == socket.username) {
                        f = true;
                        break;
                    }
                }
            }
            console.log(sockets_);
            if (!f) {
                io.emit('user_disconnect', {
                    username: (socket.is_mod) ? '@' + socket.username : socket.username
                });
            }
            for (var i = 0; i < sockets_.length; i++) {
                if (sockets_[i] == socket.id) {
                    sockets_.splice(i, 1);
                    break;
                }
            }
        }
        else {
            io.emit('ALERT', {
                message_bot_type: "ERROR"
                , message_text: "Usuário não foi definido."
            });
        }
    });
    socket.on('typing', function (data) {
        recdata = data;
        recdata.username = socket.username;
        userOn(socket.username, socket);
        io.emit('typing', recdata);
    });
    socket.on('post_message', function (data) {
        console.log('postcalled');
        if (checkSocketFree(socket)) {
            console.log('socket_free');
            if (data.message_text == "") {
                return;
            }
            var recdata = data;
            console.log(recdata);
            pool.query('SELECT * FROM chat_black_list WHERE username=?', socket.username, function (berr, brows, bfields) {
                if (brows && brows.length == 0) {
                    pool.query('INSERT INTO chat_messages(username, message, avatar, group_name, group_colour) values(?,?,?,?,?)', [
            socket.s_username
            , recdata.message_text
            , socket.avatar
            , socket.group_name
            , socket.group_colour 
            ], function (err, rows_o, fields) {
                        
                        userOn(socket.username, socket);
                        if (!err) { 
                            pool.query('SELECT * FROM chat_messages ORDER BY id DESC LIMIT 1', function (err2, rows, fields) {
                                if (!err2) {
                                    var sndData = {
                                        username: socket.s_username
                                        , message_text: recdata.message_text
                                        , message_id: rows[rows.length - 1].id
                                        , time: rows[rows.length - 1].date
                                        , group_name: socket.group_name
                                        , group_colour: socket.group_colour
                                        , avatar: socket.avatar
                                    };
                                    io.emit('post_message', sndData);
                                } 
                                else {
                                    throw err2;
                                }
                            });
                        }
                        else {
                            console.log("Error while performing Query.", err);
                        }
                    });
                }
                else {
                    socket.emit("You are banned");
                }
            });
        }
        else {
            socket.disconnect();
        }
    });
    socket.on('abs', function (data) {
        userAus(socket.username);
    });
    socket.on('apply_settings', function (data) {
        var path = __dirname + "/chat_files/user_config/" + socket.username + "/";
        fs.access(path, fs.F_OK, function (err) {
            if (err && err.code == "ENOENT") {
                fs.mkdir(path);
            }
            jsonfile.writeFile(path + "config.json", data, {
                spaces: 2
            }, function (err) {
                if (err) {
                    throw err;
                }
            });
        });
    });
    socket.on('edit_message', function (data) {
        console.log(data);
        pool.query('UPDATE chat_messages SET message=? where date > DATE_ADD(NOW(), INTERVAL -5 MINUTE) AND id=? AND (username=? OR username=?)', [
                            data.new_message
                            , data.message_id
                            , socket.username
                            , "@" + socket.username
                        ], function (err, rows) {
            if (!err) {
                console.log(rows.affectedRows);
                if (rows.affectedRows > 0) {
                    data.username = socket.username;
                    io.emit('edit_message', data);
                }
            }
            else {
                throw err;
                console.log("Error while performing Query.", err);
            }
        });
    });
    socket.on('check_edit_message', function (data) {
        console.log(data.message_id);
        pool.query("SELECT * FROM chat_messages WHERE id=? AND date > DATE_ADD(NOW(), INTERVAL -5 MINUTE) AND (username=? OR username=?)", [
            data.message_id
            , socket.username
            , "@" + socket.username
        , ], function (err, rows, fields) {
            if (!err) {
                console.log(rows);
                console.log('------------');
                if (rows && rows.length > 0) {
                    var send_data = {
                        can: true
                        , message_id: data.message_id
                        , message_text: rows[0].message
                        , username: rows[0].username
                    };
                    socket.emit('check_edit_message', send_data);
                }
                else {
                    socket.emit('check_edit_message', {
                        can: false
                    });
                }
            }
            else {
                throw err;
                console.log("Error while performing Query.", err);
            }
        });
    });
    socket.on('list_ct_packages', function (data) {
        jsonfile.readFile(__dirname + '/chat_files/chat_packages/package_list.json', function (err, jObj) {
            socket.emit('list_ct_packages', {
                packages: jObj.packages
            });
        });
    });
    socket.on('ct_package', function (data) {
        console.log('package');
        switch (data.type) {
        case 'add':
            jsonfile.readFile(__dirname + '/chat_files/chat_packages/package_list_a.json', function (err, jObj) {
                var jDObj = jObj;
                jDObj.packages.push({
                    "title": data.json.title
                    , "author": data.json.author
                    , "description": data.json.description
                    , "code": data.json.code
                });
                jsonfile.writeFile(__dirname + '/chat_files/chat_packages/package_list_a.json', jDObj, {
                    spaces: 2
                }, function (err) {
                    if (err) {
                        throw err;
                    }
                });
                console.log(jDObj);
            });
            break;
        case "remove":
            break;
        case "accept":
            console.log('accept');
            if (socket.username == plugins_guy || socket.group_name == ADMIN_GROUP_NAME) {
                jsonfile.readFile(__dirname + '/chat_files/chat_packages/package_list_a.json', function (err, jObj) {
                    var jDObj = jObj;
                    var pos = -1;
                    if (data.json.title) {
                        for (var i = 0; i < jDObj.packages.length; i++) {
                            if (jDObj.packages[i].title == data.json.title) {
                                if (jDObj.packages[i].author != data.json.author) {
                                    continue;
                                }
                                pos = i;
                                console.log(jDObj.packages[i]);
                                break;
                            }
                        }
                    }
                    if (pos != -1) {
                        jsonfile.readFile(__dirname + '/chat_files/chat_packages/package_list.json', function (err, _jObj) {
                            var jResult = _jObj;
                            console.log("pos:", pos);
                            console.log(jDObj.packages[pos]);
                            console.log(jDObj.packages[pos]);
                            jResult.packages.push(jDObj.packages[pos]);
                            jsonfile.writeFile(__dirname + '/chat_files/chat_packages/package_list.json', jResult, {
                                spaces: 2
                            }, function (err) {
                                if (err) {
                                    throw err;
                                }
                            });
                        }); //
                        jDObj.packages.splice(pos, 1);
                        jsonfile.writeFile(__dirname + '/chat_files/chat_packages/package_list_a.json', jDObj, {
                            spaces: 2
                        }, function (err) {
                            if (err) {
                                throw err;
                            }
                        });
                    }
                    else { //
                        connection.log("package not found");
                    }
                    console.log(jDObj);
                });
                break;
            }
        }
    });
    socket.on('delete_message', function (data) {
        var recdata = data;
        pool.query('DELETE FROM chat_messages WHERE id = ? AND username = ?', [recdata.message_id, socket.username], function (err, rows, fields) {
            if (!err) {
                io.emit('chat_data', data);
            }
            else {
                throw err;
                pool.end();
            }
        });
    });
    socket.on('show_info', function (data) {
        switch (data.info_type) {
        case "about":
            socket.emit('show_about', {
                info: ["Criado por Hyreos"]
            });
            break;
        case "command_list":
            if (socket.group_name == ADMIN_GROUP_NAME) {
                var dat = {
                    info: [
                        "/mod [username] < Add an user to moderators", "/unmod [username] < Remove an user moderator privileges", "/kick [username] < Kick an user of chat", "/ban [username] < Ban an user", "/unban [username] < Unban an user", "/cls or /clear <  Clear all messages of chat(caution: this not clear the archive)"
                    ]
                }
                socket.emit('show_info', dat);
            }
            else if (socket.is_mod == false) {
                var dat = {
                    commands: [
                        "/abs [texto] < Deixa você ausente com um motivo(opcional)"
                    ]
                }
                socket.emit('show_info', dat);
            }
            else {
                var dat = {
                    commands: [
                        "/kick [username] < Kick an user", "/ban [username] < Ban an user", "/unban [username] < Unban an user", "/cls or /clear < Clear all messages of chat(caution: this not clear the archive)"
                    ]
                }
                socket.emit('show_info', dat);
            }
            break;
        }
    });
    socket.on('create_emoticon', function (data) {
        if (checkSocketFree(socket)) {
            var recdata = data;
            if (socket.group_name == ADMIN_GROUP_NAME) {
                if (checkURL(data.url)) {
                    var no_err = true;
                    console.log('URL is ok!');
                    pool.query('INSERT INTO chat_emoticons(name, url) VALUES(?, ?)', [
                recdata.name
                , recdata.url
            ], function (err, rows) {
                        if (err) {
                            no_err = false;
                        }
                    });
                    if (no_err) {
                        io.emit('create_emoticon', {
                            name: recdata.name
                            , url: recdata.url
                        });
                    }
                }
                else {
                    console.log('invalid URL');
                }
            }
        }
    });
    socket.on('delete_emoticon', function (data) {
        var recdata = data;
        var no_err = true;
        if (socket.group_name == ADMIN_GROUP_NAME) {
            pool.query('DELETE FROM chat_emoticons WHERE name = ? AND category = ?', [recdata.name, recdata.category], function (err, rows) {
                if (err) {
                    no_err = false;
                }
            });
        }
    });
    socket.on('kick_user', function (data) {
        console.log('kick');
        console.log(io.sockets.clients().length);
        for (var i = 0; i < sockets_.length; i++) {
            if (io.sockets.connected[sockets_[i]].username == data.user_target) {
                if (io.sockets.connected[sockets_[i]].group_name == ADMIN_GROUP_NAME && socket.group_name != ADMIN_GROUP_NAME) {
                    break;
                }
                io.sockets.connected[sockets_[i]].emit('disconnect');
                io.emit('kick', {
                    username: io.sockets.connected[sockets_[i]].username
                });
                io.emit('user_disconnect', {
                    username: io.sockets.connected[sockets_[i]].username
                });
                io.sockets.connected[sockets_[i]].disconnect();
                i--;
            }
        }
    });

    function removeUserFromDbBlackList(jorelma) {
        pool.query('DELETE FROM chat_black_list WHERE username=?', jorelma, function (err) {
            if (err) {
                throw err;
            }
        });
    }

    function addUserToDbBlackList(vitima) {
        pool.query('INSERT INTO chat_black_list(username) VALUES(?)', vitima, function (err, rows, fields) {
            if (err) {
                throw err;
            }
        });
    }
    socket.on('ban', function (data) {
        console.log(data);
        console.log(Object.keys(io.sockets.connected).length);
        var recdata = data;
        pool.query('SELECT * FROM chat_mods WHERE username=?', socket.username, function (err, rows, fields) {
            if (rows && rows.length > 0 || socket.group_name == ADMIN_GROUP_NAME) {
                pool.query('SELECT * FROM chat_mods WHERE username=?', recdata.user_target, function (merr, mrows, mfields) {
                    if (mrows.length == 0 || socket.group_name == ADMIN_GROUP_NAME) {
                        pool.query('SELECT * FROM phpbb_users WHERE username=?', recdata.user_target, function (_err, _rows, _fields) {
                            if (_rows.length > 0) {
                                pool.query('SELECT * FROM phpbb_groups WHERE group_id=?', _rows[0].group_id, function (__err, __rows, __fields) {
                                    console.log(__rows[0].group_name == ADMIN_GROUP_NAME);
                                    console.log(__rows[0].group_name);
                                    console.log(ADMIN_GROUP_NAME);
                                    if (__rows[0].group_name != ADMIN_GROUP_NAME) {
                                        var find = false;
                                        for (var i = 0; i < idiots_list.length; i++) {
                                            if (idiots_list[i].username == recdata.user_target) {
                                                find = true;
                                                break;
                                            }
                                        }
                                        if (!find) {
                                            var data = "O usuário " + recdata.user_target + " foi banido por " + socket.username;
                                            file_log(data);
                                            idiots_list.push({
                                                username: recdata.user_target
                                            });
                                            addUserToDbBlackList(recdata.user_target);
                                            io.emit('ban', {
                                                user_target: idiots_list[idiots_list.length - 1].username
                                                , username: socket.username
                                            });
                                            for (var i = 0; i < sockets_.length; i++) {
                                                if (io.sockets.connected[sockets_[i]].username == recdata.user_target) {
                                                    io.sockets.connected[sockets_[i]].disconnect();
                                                }
                                            }
                                            console.log('sucess');
                                        }
                                        else {
                                            console.log('user_exists');
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    });
    socket.on('unban', function (data) {
        pool.query('SELECT * FROM chat_mods WHERE username=?', socket.username, function (err, rows, fields) {
            if (rows && rows.length > 0 || socket.group_name == ADMIN_GROUP_NAME) {
                for (var i = 0; i < idiots_list.length; i++) {
                    if (idiots_list[i].username == data.user_target) {
                        idiots_list.splice(i, 1);
                        removeUserFromDbBlackList(data.user_target);
                        io.emit('unban', {
                            user_target: data.user_target
                            , username: socket.username
                        });
                        break; //
                    }
                }
            }
        });
    });
    socket.on('set_mod', function (data) {
        if (socket.group_name == ADMIN_GROUP_NAME) {
            pool.query('SELECT * FROM phpbb_users WHERE username=?', data.user_target, function (err, rows, fields) {
                if (rows && rows.length > 0) {
                    pool.query('SELECT * FROM phpbb_groups WHERE group_id=?', rows[0].group_id, function (err, _rows, fields) {
                        if (_rows && _rows.length > 0) {
                            if (_rows[0].group_name != ADMIN_GROUP_NAME) {
                                pool.query('SELECT * FROM chat_mods WHERE username=?', data.user_target, function (err, rows, fields) {
                                    if (rows.length == 0) {
                                        pool.query('INSERT INTO chat_mods(username) VALUES(?)', data.user_target, function (err, rows, fields) {
                                            if (err) {
                                                throw err;
                                            }
                                            else {
                                                io.emit('ALERT', {
                                                    message_bot_type: "SUCESS"
                                                    , message_text: 'Direitos de moderação foram dados a ' + data.user_target + " por " + socket.username + "."
                                                });
                                                io.emit('add_mod', {
                                                    user_target: data.user_target
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
            });
        }
    });
    socket.on('remove_mod', function (data) {
        if (socket.group_name == ADMIN_GROUP_NAME) {
            pool.query('SELECT * FROM chat_mods WHERE username=?', data.user_target, function (err, rows, fields) {
                if (rows && rows.length > 0) {
                    pool.query('SELECT * FROM phpbb_users WHERE username=?', data.user_target, function (err, rows, fields) {
                        if (rows && rows.length > 0) {
                            pool.query('SELECT * FROM phpbb_groups WHERE group_id=?', rows[0].group_id, function (err, rows, fields) {
                                if (rows && rows.length > 0) {
                                    if (rows[0].group_name != ADMIN_GROUP_NAME) {
                                        pool.query('DELETE FROM chat_mods WHERE username=?', data.user_target, function (err, rows, fields) {
                                            if (err) {
                                                throw err;
                                            }
                                            else {
                                                io.emit('remove_mod', {
                                                    user_target: data.user_target
                                                    , username: socket.username
                                                });
                                            }
                                            if (rows.length > 0) {
                                                io.emit('ALERT', {
                                                    message_text: "Direitos de moderação retirados de " + data.user_target + " por " + socket.username
                                                });
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
    });
    socket.on('get_archive', function (data) {
        if (checkSocketFree(socket)) {
            var recdata = data;
            pool.query('select * from chat_messages where date > DATE_ADD(NOW(), INTERVAL -10 HOUR)', function (err, rows, fields) {
                socket.emit('get_archive', {
                    messages: rows
                });
            });
        }
    });
    socket.on('update_chat_config', function (data) {
        if(socket.group_name == ADMIN_GROUP_NAME) {
            jsonfile.writeFile(__dirname + '/chat_files/chat_config/config.json', data.json, {
                spaces: 2
            }, function (err) {
                if(err) {
                    throw err;
                }
            });
        }
    });
});

setInterval(function () {
    pool.query('SELECT * FROM chat_messages', function (err, rows, fields) {
        var jsont = {
            user: []
            , message: []
            , hour: []
        };
        console.log(rows.length);
        for (var i = 0; i < rows.length; i++) {
            jsont.user.push(String(rows[i].username));
            jsont.message.push(String(rows[i].message));
            jsont.hour.push(String(rows[i].date));
        } 
        var d = new Date();
        if (rows.length > 0) {
            jsonfile.writeFile(__dirname + "/chat_files/historic " + String(d.getDate()) + " - " + String(d.getMonth()) + " - " + String(d.getFullYear()) + ".json", jsont, {
                spaces: 2
            }, function (err) {
                if (err) throw err;
            });
            pool.query('DELETE FROM chat_messages WHERE date < DATE_ADD(NOW(), INTERVAL -10 HOUR)', function (_err, _rows, _fields) {
                if (_err) {
                    throw _err;
                }
            });
        }
    });
}, (((1000 * 60)*60)) * 24); //1 dia

setInterval(function () {
    pool.query('SELECT TRUE');
}, 1000);

http.listen(port, function () {
    console.log('listening on *:' + String(port));
});