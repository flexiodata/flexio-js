'use strict';


var https = require('https');
var crypto = require('crypto');
var querystring = require('querystring');
var fs = require('fs');

module.exports = class Flexio
{
    constructor()
    {
        this.files = [];
        this.debug_active = false;
        this.callback = null;
        this.job_params = null;
        this.ssl_verify = true;
    }

    setApiKey(value)
    {
        this.apikey = value;
    }

    setHost(value)
    {
        this.host = value;
    }

    setSSLVerify(value)
    {
        this.ssl_verify = value;
    }

    setPort(value)
    {
        this.port = value;
    }

    setPipe(value)
    {
        this.pipe = value;
    }

    addFile(value)
    {
        this.files.push(value);
    }

    setJobParams(params)
    {
        this.job_params = params;
    }

    setCallback(func)
    {
        this.callback = func;
    }
    
    setDebug(value)
    {
        this.debug_active = value;
    }

    debug(str)
    {
        if (this.debug_active)
        {   
            console.log.apply(console, arguments);
        }
    }
    
    run()
    {
        var me = this;

        var call_params = { parent_eid: this.pipe };
        if (this.job_params)
        {
            call_params.params = this.job_params;
        }

        this.doCall('POST', '/api/v1/processes', null, call_params, null, (res)=>{
            if (!res.hasOwnProperty('eid'))
                throw '/api/v1/processes: missing eid';

            var process_eid = res['eid'];

            // send the files (if any), and then run the pipe process
            this.sendFiles(process_eid, ()=>{

                this.doCall('POST', '/api/v1/processes/'+process_eid+'/run?background=false', null, {}, null, (res)=>{

                    if (me.callback) {
                        me.callback('begin', '');
                    }

                    this.doCall('GET', '/api/v1/processes/'+process_eid+'/output?fields=content&format=text/plain', null, {},
                        (data) => {
                            if (me.callback) {
                                me.callback('data', data);
                            }
                        },
                        (res)=>{
                            if (me.callback) {
                                me.callback('end', '');
                            }
                        }
                    );

                });
            });
        });

/*
        this.doCall('GET', '/api/v1/search', null, {"name":this.pipe}, (res)=>{

            if (!Array.isArray(res) || res.length != 1 || !res[0].hasOwnProperty('eid'))
                throw '/api/v1/search: missing eid';

            var pipe_eid = res[0].eid;

        });
*/
    }


    doCall(method, path, filename, body, data_callback, callback)
    {
        var me = this;

        var options = {
            'host': this.host,
            'port': this.port,
            'rejectUnauthorized': this.ssl_verify,
            'path': path,
            'method': method,
            'headers': {
                'Authorization': 'Bearer ' + this.apikey
            }
        };


        var bodytype;
        var boundary;

        if (Buffer.isBuffer(body))
        {
            bodytype = 'buffer';
        }
        else if (typeof body === 'object' && typeof body.pipe === 'function')
        {
            bodytype = 'stream';

            var hash = crypto.createHash('sha256');
            hash.update(Date() + Math.random());
            boundary =  hash.digest('hex');
            options.headers['Content-Type'] = 'multipart/form-data; boundary=' + boundary;
        }
        else 
        {
            if (method == 'POST')
            {
                bodytype = 'json';
                body = JSON.stringify(body);
                if (body.length > 0)
                {
                    options.headers['Content-Type'] = 'application/json';
                    options.headers['Content-Length'] = body.length;
                }
                
                /*
                bodytype = 'formdata';
                body = querystring.stringify(body);
                me.debug("length", body.length, body);
                if (body.length > 0)
                {
                    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                    options.headers['Content-Length'] = body.length;
                }*/
            }
             else if (method == 'GET')
            {
                body = querystring.stringify(body);
                bodytype = 'none';
            }
            
            
        }


        if (method == 'GET')
        {
            if (body.length > 0)
            {
                path += '?' + body;
            }
            options.path = path;
        }

        me.debug(method + ' https://' + this.host + path, 'Authorization: Bearer ' + this.apikey);




        var request = https.request(options, (response) => {

            me.debug('statusCode:', response.statusCode);

            var data = '';

            response.on('data', function(d) {

                me.debug('Data Received ***' + d + '***');

                if (data_callback)
                {
                    data_callback(d);
                }
                data += d;
            });

            response.on('end', function() {

                if (data_callback)
                {
                    callback(null);
                }
                 else
                {
                    var parsed = null;
                    try
                    {
                        parsed = JSON.parse(data);
                    }
                    catch (e)
                    {
                    }
                    callback(parsed);
                }
            });
        });


        if (bodytype == 'none')
        {
            request.end();
        }
        else if (bodytype == 'json' || bodytype == 'formdata')
        {
            request.write(body);
            request.end();
        }
        else if (bodytype == 'stream')
        {
            var header = '--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="' + filename + '"\r\nContent-Type: application/octet-stream\r\n\r\n';
            me.debug(header);

            request.write(header);
            body.pipe(request);
            body.on('close', function () {
                request.end('\r\n--' + boundary + '--\r\n\r\n');
            });
        }
        else if (bodytype == 'buffer')
        {
            request.write(body);
       	    request.end();
        }




    }



    sendFiles(process_eid, callback)
    {
        if (this.files.length == 0)
        {
            callback();
            return;
        }
        
        var filename = this.files.shift();
        var stream;

        if (filename === null)
        {
            this.debug("Sending stdin");
            filename = "file.txt";
            stream = process.stdin;
        }
         else
        {
            this.debug("Sending " + filename);
            stream = fs.createReadStream(filename);
        }

        this.doCall('POST', '/api/v1/processes/'+process_eid+'/input', filename, stream, null, (res)=>{
        
            if (this.files.length == 0)
                callback();
                 else
                this.sendOneFile(process_eid, callback);

        });

    }
}

