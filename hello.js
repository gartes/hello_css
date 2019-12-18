#!/usr/bin/env node

// mount -o bind /var/www/pro-critical.cf/node_js /var/www/nobd.ga/a

// ps -ef | grep certb
// kill -9 {PROC ID}

// killall -9 node



/*Start - 1 */



const http = require('http');
// let https = require('https');
const fs = require('fs');
const qs = require('querystring');
const crypto = require('crypto');
const path = require("path");
const bodyParser = require("body-parser");
const Q = require("q");
const penthouse = require("penthouse");
const puppeteer = require('puppeteer')
const server = http.createServer();

const __baseDir = "./";

let __baseOutput;
let __baseUrl;

let __CssName ;





//default configuration for penthouse
var config = {
   // css: path.resolve(__baseDir, "css/build/app.css"),

    width: 1300,
    height: 844,

   // strict: false,
    timeout: 30000,

    screenshots: {
        // absolute or relative; excluding file extension
        basePath: '/var/www/pro-critical.cf/html/a_assets',
        // jpeg or png, png default
        type: 'jpeg',
        // only applies for jpeg type
        quality: 20
    },
    // строка агента пользователя при загрузке страницы
    userAgent : 'Critical Path CSS Generator' ,
};

//allow for lots of event listeners
process.setMaxListeners(50);


const Domen = 'pro-critical.cf';
const DomenLocal = 'https://'+Domen+'/' ;
const PachLocal  = '/var/www/'+Domen+'/html/';


let result;


console.log(__dirname);

/**
 * Запуск Сервера Порт 8080
 */
server.on('request', async (req, res) => {
    /**
     * Закрываем ответы через GET
     */
    if (req.method === 'GET'){
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Close!\n');
    }

    if (req.method === 'POST') {
        console.log( 'req.method === POST');

        // Загрузка шаблона ответа по умолчанию
        reloadDefault();

        // Получение данных из POST
        processPost( req, res, function () {
            RunServ( req , res )
        });
        // processPost( req, res, RunServ );

    }

});
server.listen(8080, 'localhost');
console.log('Server running at XXXX-YYY http://localhost:8080/');


/**
 * Загрузка шаблона ответа по умолчанию
 *
 */
reloadDefault = function (){
    result = {success:true, data:[], error:[], warning:[], info: [],}
};


/**
 * Контроллер задач Сервера
 * @param data
 * @param res       - ServerResponse
 * @return {Promise<void>}
 * @constructor
 */
RunServ = async (data, res) => {
    let $_POST = data.post;
    let task = $_POST.task;

    console.log('   =>Start...... ');
    console.log('   =>Data Post ',$_POST);

    switch (task) {
        case 'getCtiticalCss':
            await getCtiticalCss($_POST, res);
            break;
        default :
            addMessage('error', 'Server nobd.ga: No task function');
            await sendResponse(res, false);
            process.exit(0);
    }

};







/**
 * Добавить сообщение в стек ответа
 *
 * @param type      - string  Тип сообщения ( error | warning | info )
 * @param message   - string  Текст сообщения
 */
addMessage = function( type , message ) {
    switch(type) {
        case 'error' :
            result.error.push( message ) ;
            break;
        case 'warning' :
            result.warning.push( message ) ;
            break;
        case 'info' :
            result.info.push( message ) ;
            break;
    }
};

/**
 * Отправка ответа на запрос
 * @param res       - ServerResponse
 * @param error     - Индификатор ошибки
 */
sendResponse = function ( res , error  ){

    console.log( error )
    console.log( error === false  )

    if( typeof error !== 'undefined'  ||  error === true ) {
        result.success = false ;
    }
    res.writeHead(200, "OK", {'Content-Type': 'text/plain'});
    res.end( JSON.stringify( result )   );

};




getCtiticalCss = async function  ( $_POST , res ){

    // URL Object - Домен сайта
    let link = new URL( $_POST.urlSite );
    console.log( '   =>link ' , link )

    // URL адрес страницы для которой выделяем CSS
    let pageLink = $_POST.urlSite ;
    // md5 хеш адреса страницы
    let md5 = crypto.createHash('md5').update( pageLink ).digest("hex");


    //////////////////  ORIGINAL All.CSS    //////////////////////////////////
    // Директория для сохранения файла страницы All.css
    // /var/www/nobd.ml/html/criticalCss/{DOMEN-SITE}/assets/original/
    let dirAllCss = mkDirByPathSync(PachLocal+'criticalCss/'+ link.hostname +'/assets/original');
    // Файл All.css - для PENTHOUSE
    __CssName = dirAllCss+'/allCss_'+md5+'.css';

    // Ссылка на файл All.css
    // let linkAllCss = DomenLocal+ 'criticalCss/'+ link.hostname +'/assets/original/allCss_'+md5+'.css' ;
    //////////////////////////////////////////////////////////////

    // Директория для сохранения результатов
    let __OutputDir = mkDirByPathSync(  PachLocal+'criticalCss/'+ link.hostname+'/assets/pages' );

    // let fileCssName = path.resolve(__baseDir, __CssName);


    let width = ( typeof $_POST.width === 'undefined'? config.width : $_POST.width );
    let height = ( typeof $_POST.height === 'undefined'? config.height : $_POST.height );


    // console.log( $_POST )


    // Имя файла с кртическими стилями
    let fileCriticalCssName = md5 +'_'+ width+'x'+height+".css";
    // Файл для сохранения кретических стелей
    let outputCssCriticalFile = path.resolve(__OutputDir, fileCriticalCssName );

    // Читаем ALLCSS из файла сайта
    let allCssData = await getContentCss(  $_POST.cssUrl );


    config.userAgent = ( typeof $_POST.userAgent === 'undefined'? config.userAgent : $_POST.userAgent );
    // Путь для скриншотов
    config.screenshots.basePath = __OutputDir+'/'+ md5+'_'+width+'x'+height ;
    // путь к файлу All.css
    config.css = __CssName ;
    // Адрес страницы для генирации CSS
    config.url = $_POST.urlSite ;
    // ширина экрана
    config.width = width;
    //  высота области экрана
    config.height = height ;



    let Output = {
        criticalCss : await criticalCss($_POST.urlSite /*, outputCssCriticalFile*/ ),
        screenshots : {
            after: 'https://'+Domen+'/criticalCss/'+link.hostname+'/assets/pages/'+md5+'_'+width+'x'+height+'-after.jpg',
            before:'https://'+Domen+'/criticalCss/'+link.hostname+'/assets/pages/'+md5+'_'+width+'x'+height+'-before.jpg',
        }
    };

    result.data.push( Output );

    let r = await sendResponse( res );

    //process.exit(0);


};










/**
 * ########### penthouse START #############
 * Создать критические CSS
 *
 * @param url
 *
 * @return string - Critical Css
 */
const criticalCss = async  function ( url /*, output*/) {
    console.log( '   =>Critical Css Generate.....');
    config.url = url;

    console.log( config ) ;
    return penthouse(config).then(criticalCss => {
            // Записать critical css в файл output
            // fs.writeFileSync( output, criticalCss);
            return criticalCss;
        });
};



/**
 * Перебор - очереди промисов
 *
 * @param items An array of items.
 * @param fn A function that accepts an item from the array and returns a promise.
 * @returns {Promise}
 * @tutorial https://stackoverflow.com/questions/31413749/node-js-promise-all-and-foreach/41791149#41791149
 */
function forEachPromise(items, fn) {
    console.log( '469');
    return items.reduce(function (promise, item) {
        return promise.then(function () {
            return fn(item);
        });
    }, Promise.resolve());
}

/**
 * Проверить директорию. Если не существует создать
 * @tutorial https://stackoverflow.com/questions/31645738/how-to-create-full-path-with-nodes-fs-mkdirsync/40686853#40686853
 */
function mkDirByPathSync(targetDir, { isRelativeToScript = false } = {}) {
    console.log( '487');
    const sep = path.sep;
    const initDir = path.isAbsolute(targetDir) ? sep : '';
    const baseDir = isRelativeToScript ? __dirname : '.';

    return targetDir.split(sep).reduce((parentDir, childDir) => {
        const curDir = path.resolve(baseDir, parentDir, childDir);
        try {
            fs.mkdirSync(curDir);
            console.log( '496');
        } catch (err) {
            if (err.code === 'EEXIST') { // curDir already exists!
                return curDir;
            }

            // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
            if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
                throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
            }

            const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
            if (!caughtErr || caughtErr && curDir === path.resolve(targetDir)) {
                throw err; // Throw if it's just the last created dir.
            }
        }

        return curDir;
    }, initDir);
}



/**
 * Получение данных из POST
 *
 * @param request
 * @param response
 * @param callback
 * @return {null}
 */
const processPost = function(request, response, callback) {
    console.log( '522');
    var queryData = "";
    if(typeof callback !== 'function') return null;

    if(request.method == 'POST') {
        request.on('data', function(data) {
            queryData += data;
            if(queryData.length > 1e6) {
                queryData = "";
                response.writeHead(413, {'Content-Type': 'text/plain'}).end();
                request.connection.destroy();
            }
        });

        request.on('end', function() {
            request.post = qs.parse(queryData);
            callback();
        });

    } else {
        response.writeHead(405, {'Content-Type': 'text/plain'});
        response.end();
    }
};

/**
 * Прочитать данные из файла ALL.css
 *
 * @param url
 * @return {Promise<any>}
 */
const getContentCss = function (url) {
    console.log( '560');
    console.log( url );
    console.log( '562');

    // return new pending promise
    return new Promise((resolve, reject) => {
        // select http or https module, depending on reqested url
        const lib = url.startsWith('https') ? require('https') : require('http');
        const request = lib.get(url, (response) => {
            // handle http errors
            if (response.statusCode < 200 || response.statusCode > 299) {
                reject(new Error('Failed to load page, status code: ' + response.statusCode));
            }
            // temporary data holder
            const body = [];
            // on every content chunk, push it to the data array
            response.on('data', (chunk) => body.push(chunk));
            // we are done, resolve promise with those joined chunks
            response.on('end', () => resolve(body.join('')));

            let fileCssName = path.resolve(__baseDir , __CssName);

            console.log( fileCssName )

            var file = fs.createWriteStream(fileCssName);
            response.pipe(file);



        });
        // handle connection errors of the request
        request.on('error', (err) => reject(err))
    })
};