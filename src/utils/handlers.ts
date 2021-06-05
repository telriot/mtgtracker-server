import http from "http";
/**
 * Event listener for HTTP server "error" event.
 */

export const onError = (error: any, port: string | number) => {
    if (error.syscall !== "listen") {
        throw error;
    }

    var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case "EACCES":
            console.error(bind + " requires elevated privileges");
            process.exit(1);
            break;
        case "EADDRINUSE":
            console.error(bind + " is already in use");
            process.exit(1);
            break;
        default:
            throw error;
    }
};

/**
 * Event listener for HTTP server "listening" event.
 */

export const onListening = (server: http.Server) => {
    var addr = server.address();
    var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr?.port;
    console.log("listening on " + bind);
};
