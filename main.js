var express = require("express")
var bodyParser = require("body-parser")
var child_process = require("child_process")
var fs = require("fs")
var app = express()
var expressWs = require("express-ws")(app)

global.config = JSON.parse(fs.readFileSync("./config.json"))

function asyncForEach(arr, iterator, callback) {
    var queue = arr.slice(0);
    var outarr = []

    function next(err, output) {
        if (output) outarr[outarr.length] = output
        if (err) return callback(err, outarr);
        if (queue.length === 0) return callback(null, outarr);
        iterator(queue.shift(), next);
    }
    next();
}

app.use(bodyParser.json())

app.use(bodyParser.text())

const year = 1000 * 365 * 24 * 60 * 60

app.use("/materialize", express.static("./node_modules/materialize-css/dist/", {
    maxAge: year
}))
app.use("/jquery", express.static("./node_modules/jquery/dist", {
    maxAge: year
}))
app.use("/material-fonts", express.static("./node_modules/material-design-icons/iconfont/", {
    maxAge: year
}))
app.use("/codemirror", express.static("./node_modules/codemirror/", {
    maxAge: year
}))

app.use(express.static("./programs/", {
    index: "false"
}))

app.use(express.static("./bower_components/", {
    maxAge: year
}))

app.use("/", express.static("./static"))




app.put("/run", (req, res) => {
    fs.mkdtemp("/tmp/WDErun-", (err, folder) => {
        if (!err) {
            fs.writeFile(folder + "/program.py", req.body.content, (err) => {
                if (!err) {
                    child_process.execFile("python3", [folder + "/program.py"], {}, (error, stdout, stderr) => {
                        if (!error && !stderr) {
                            res.writeHead(200)
                            res.end(stdout)
                        } else {
                            res.writeHead(400)
                            res.end(stderr)
                        }
                        fs.unlink(folder + '/program.py', () => {})
                        fs.rmdir(folder)
                    })
                } else {
                    res.writeHead(500)
                    res.end()
                }
            })
        } else {
            res.writeHead(500)
            res.end()
        }
    })
})

var programs = {}

app.ws('/run', (ws, req) => {
    ws.on('message', function (msg) {
        msg = msg.toString()
        if (msg.startsWith("program:")) {
            msg = msg.replace("program:", "")
            var id = msg.slice(0, 6)
            msg = msg.slice(6, msg.length)
            var folder = "/tmp/WDErun-" + id
            fs.mkdir(folder, (err) => {
                if (!err) {
                    fs.writeFile(folder + "/program.py", msg, (err) => {
                        if (!err) {
                            ps = child_process.spawn('python3', [folder + "/program.py"])
                            programs[id] = ps
                            ps.stdout.on('data', (data) => {
                                ws.send(`stdout:${data}`);
                            });

                            ps.stderr.on('data', (data) => {
                                ws.send(`stderr:${data}`);
                            });

                            ps.on('close', (code) => {
                                ws.send(`exit:${code}`);
                                ws.close()
                                fs.unlink(folder + "/program.py", () => {
                                    fs.rmdir(folder)
                                })
                            });
                        }
                    })
                } else {
                    ws.send("error")
                    ws.close()
                }
            })
        } else if (msg.startsWith("input:")) {
            msg = msg.replace("input:", "")
            var id = msg.slice(0, 6)
            msg = msg.slice(6, msg.length)
            programs[id].stdin.write(msg)
        } else if (msg.startsWith("end:")) {
            msg = msg.replace("end:", "")
            var id = msg.slice(0, 6)
            programs[id].kill()
        }
    });
})

var pythons = []

app.ws('/python', (ws, req) => {
    ws.on('message', function (msg) {
        msg = msg.toString()
        if (msg.startsWith("python:")) {
            msg = msg.replace("python:", "")
            var id = msg.slice(0, 6)
            var msg = msg.slice(6, msg.length)
            ps = child_process.spawn('python3', msg ? ["-c", msg] : ["-i"], {
                encoding: "utf8"
            })
            pythons[id] = ps
            ps.stdout.on('data', (data) => {
                ws.send(`stdout:${data}`);
            });

            ps.stderr.on('data', (data) => {
                ws.send(`stderr:${data}`);
            });

            ps.on('close', (code) => {
                ws.send(`exit:${code}`);
                ws.close()
            });

        } else if (msg.startsWith("input:")) {
            msg = msg.replace("input:", "")
            var id = msg.slice(0, 6)
            msg = msg.slice(6, msg.length)
            pythons[id].stdin.write(msg)
        } else if (msg.startsWith("end:")) {
            msg = msg.replace("end:", "")
            var id = msg.slice(0, 6)
            pythons[id].kill()
        }
    });
})


app.post("/programs", (req, res) => {
    fs.writeFile("./programs/" + req.body.filename, req.body.content, (err) => {
        if (!err) res.writeHead(200)
        else res.writeHead(500)
        res.end()
    })
})

app.post("/programs/*", (req, res) => {
    if (req.originalUrl.split("/").pop() != "programs") {
        fs.writeFile("./programs/" + req.originalUrl.split("/").pop(), req.body, (err) => {
            res.writeHead(err ? 500 : 200);
            res.end()
        })
    }
})

app.get("/programs", (req, res) => {
    fs.readdir("./programs", (err, files) => {
        if (!err) {
            res.writeHead(200, {
                "Content-Type": "application/json"
            })
            asyncForEach(files, (el, next) => {
                fs.stat("./programs/" + el, (err, stat) => {
                    fs.readFile("./programs/" + el, {}, (err, data) => {
                        next(null, {
                            name: el,
                            atime: stat.atimeMs,
                            size: stat.size,
                            data: data.toString()
                        })
                    })
                })
            }, (err, output) => {
                res.end(JSON.stringify(output))
            })
        }
    })
})

app.delete('/programs/*', (req, res) => {
    fs.unlink("./programs/" + req.originalUrl.split("/").pop(), (err) => {
        res.writeHead(err ? 500 : 200);
        res.end()
    })
})

app.ws('/status', (ws, req) => {
    ws.on("message", (msg) => {
        ws.send("Ok")
        ws.close()
    })
})


app.listen(global.config.port, global.config.address)