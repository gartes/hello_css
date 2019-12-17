#!/usr/bin/env node

// ps -ef | grep certb
// kill -9 {PROC ID}

// killall -9 node

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

/*1111*/




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
        basePath: '/var/www/nobd.ml/html/assets/homepage', // absolute or relative; excluding file extension
        type: 'jpeg', // jpeg or png, png default
        quality: 20 // only applies for jpeg type
    },

    userAgent : 'Critical Path CSS Generator' , // строка агента пользователя при загрузке страницы
};

//allow for lots of event listeners
process.setMaxListeners(50);


/*2222*/








const Domen = 'nobd.ml';
const DomenLocal = 'https://'+Domen+'/' ;
const PachLocal  = '/var/www/'+Domen+'/html/';

/*
const browserPromise = puppeteer.launch({
    ignoreHTTPSErrors: true,
    args: ['--disable-setuid-sandbox', '--no-sandbox'],
    // not required to specify here, but saves Penthouse some work if you will
    // re-use the same viewport for most penthouse calls.
});*/




let result;

/**
 * Загрузка значений по умолчанию
 *
 */
reloadDefault = function (){
    result = {success:true, data:[], error:[], warning:[], info: [],}
}

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
}

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

}




getCtiticalCss = async function  ( $_POST , res ){
    // URL Object - Домен сайта
    let link = new URL( $_POST.urlSite );

    // адрес страницы
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
    let linkAllCss = DomenLocal+ 'criticalCss/'+ link.hostname +'/assets/original/allCss_'+md5+'.css' ;
    //////////////////////////////////////////////////////////////
    // Директория для сохранения результатов
    let __OutputDir = mkDirByPathSync(  PachLocal+'criticalCss/'+ link.hostname+'/assets/pages' );

    let fileCssName = path.resolve(__baseDir, __CssName);


    let width = ( typeof $_POST.width === 'undefined'? config.width : $_POST.width )
    let height = ( typeof $_POST.height === 'undefined'? config.height : $_POST.height )
    let userAgent = ( typeof $_POST.userAgent === 'undefined'? config.userAgent : $_POST.userAgent )

    console.log( $_POST )


    // Имя файла с кртическими стилями
    let fileCriticalCssName = md5 +'_'+ width+'x'+height+".css"
    // Файл для сохранения кретических стелей
    let outputCssCriticalFile = path.resolve(__OutputDir, fileCriticalCssName );

    // Читаем ALLCSS из файла сайта
    let allCssData = await getContentCss(  $_POST.cssUrl )


    config.userAgent = userAgent ; 
    // Путь для скриншотов
    config.screenshots.basePath = __OutputDir+'/'+ md5+'_'+width+'x'+height ;
    // путь к файлу All.css
    config.css = __CssName ;
    // Адрес страницы для генирации CSS
    config.url = $_POST.urlSite ;
    // ширина экрана
    config.width = width ;
    //  высота области экрана
    config.height = height ;



    let Output = {
        criticalCss : await criticalCss($_POST.urlSite, outputCssCriticalFile ),
        screenshots : {
            after: 'https://nobd.ml/criticalCss/'+link.hostname+'/assets/pages/'+md5+'_'+width+'x'+height+'-after.jpg',
            before:'https://nobd.ml/criticalCss/'+link.hostname+'/assets/pages/'+md5+'_'+width+'x'+height+'-before.jpg',
        }
    }

    result.data.push( Output )

    let r = await sendResponse( res );

    //process.exit(0);


};





/**
 * Контроллер задач Сервера
 * @param $_POST    - Данные POST запроса
 * @param res       - ServerResponse
 * @return {Promise<void>}
 * @constructor
 */
RunServ = async ( $_POST , res ) => {
    let _task = $_POST.task ;
    console.log($_POST);
     switch (_task) {
         case 'getCtiticalCss':
             getCtiticalCss( $_POST , res );
             break ;
         default :
             addMessage ( 'error' , 'Server nobd.ml: No task function');
             await sendResponse(res , false  );
             process.exit(0);
     };

};



server.on('request', async (req, res) => {
    let cssUrl, urlSite;

    console.log( '+++++++++++++++++++++++++')

    //
    if (req.method == 'GET'){
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Close!\n');
    }
    console.log( req.method )

    if (req.method == 'POST') {
        reloadDefault();
        processPost( req, res, function () {
            RunServ( req.post , res )
        });





        const ended = function( post ){

            // URL Object - Домен сайта
            let link = new URL( post.urlSite );

            // адрес страницы
            let pageLink = post.urlSite ;
            // md5 хеш адреса страницы
            let md5 = crypto.createHash('md5').update( pageLink ).digest("hex");


            //////////////////  ORIGINAL All.CSS    //////////////////////////////////
            // Директория для сохранения файла страницы All.css
            // /var/www/nobd.ml/html/criticalCss/{DOMEN-SITE}/assets/original/
            let dirAllCss = mkDirByPathSync(PachLocal+'criticalCss/'+ link.hostname +'/assets/original');
            // Файл All.css - для PENTHOUSE
            __CssName = dirAllCss+'/allCss_'+md5+'.css';
            // Ссылка на файл All.css
            let linkAllCss = DomenLocal+ 'criticalCss/'+ link.hostname +'/assets/original/allCss_'+md5+'.css' ;
            //////////////////////////////////////////////////////////////

            ////////// отпустить в цикл  ////////// ////////// ////////// ////////// ////////// //////////
            let width = 1300 ;
            let height = 744 ;
            // Директория для сохранения результатов
            let __OutputDir = mkDirByPathSync(  PachLocal+'criticalCss/'+ link.hostname+'/assets/pages' );

            // Размеры экранов
            let dimensions = JSON.parse( post.dimensions ) ;


            result.data = {
                Original: {
                    allCssUrl: linkAllCss,
                },
                Output: [],
            };

            // подготовить инфо о файлах задания
            forEachPromise( dimensions, getOutputInfo ).then(() => {
                res.writeHead(200, "OK", {'Content-Type': 'text/plain'});
                res.end( JSON.stringify( result )   );
                console.log('done');
            });

            // подготовить инфо о файлах задания
            function getOutputInfo(item) {
                return new Promise((resolve, reject) => {
                    process.nextTick(() => {

                        let width = item.width;
                        let height = item.height ;

                        // Имя файла с кртическими стилями
                        let fileCriticalCssName = md5 +'_'+width+'x'+height+".css"
                        // Файл для сохранения кретических стелей
                        let outputCssCriticalFile = path.resolve(__OutputDir, fileCriticalCssName );
                        // Ссылка URL - на файл с критичискими стилями
                        let __OutputUrl = DomenLocal+'criticalCss/' + link.hostname + '/assets/pages/'+fileCriticalCssName;

                        let _outputInfo = {
                            width  : item.width ,
                            height :  item.height ,
                            OutputUrl : __OutputUrl ,
                            screenshots : {
                                after: 'https://nobd.ml/criticalCss/'+link.hostname+'/assets/pages/'+md5+'_'+width+'x'+height+'-after.jpg',
                                before:'https://nobd.ml/criticalCss/'+link.hostname+'/assets/pages/'+md5+'_'+width+'x'+height+'-before.jpg',
                            },
                        }
                        result.data.Output.push( _outputInfo )
                        resolve();
                    })
                });
            };

            // Прочитать данные из файла ALL.css
            getContentCss(  post.cssUrl ).then(( html ) => {
                // Создать критические стили для полученных размеров
                forEachPromise( dimensions, getCriticalDataPage ).then(() => {
                    res.writeHead(200, "OK", {'Content-Type': 'text/plain'});
                    res.end( JSON.stringify( result )   );
                    console.log('done');



                    process.exit(0);
                });

                // Создать критические стили для полученных размеров
                function getCriticalDataPage(item) {
                    return new Promise((resolve, reject) => {
                        process.nextTick(() => {
                                let width = item.width;
                                let height = item.height ;
                                let fileCssName = path.resolve(__baseDir, __CssName);

                                // Путь для скриншотов
                                config.screenshots.basePath = __OutputDir+'/'+ md5+'_'+width+'x'+height ;
                                // путь к файлу All.css
                                config.css = __CssName ;
                                // Адрес страницы для генирации CSS
                                config.url = post.urlSite ;
                                // ширина экрана
                                config.width = width ;
                                //  высота области экрана
                                config.height = height ;
                                // Установки браузера PUPPETEER
                                // config.puppeteer = { getBrowser: () => browserPromise } ;

                                // Имя файла с кртическими стилями
                                let fileCriticalCssName = md5 +'_'+ width+'x'+height+".css"
                                // Файл для сохранения кретических стелей
                                let outputCssCriticalFile = path.resolve(__OutputDir, fileCriticalCssName );

                                 criticalCss(post.urlSite, outputCssCriticalFile ).then(function (criticalCssOutput) {
                                    // console.log( item.width );
                                     console.log( 'Penthouse - Done' );
                                    resolve();
                                }).catch(function (error) {
                                    console.log(error);
                                    process.exit(1);
                                });






                        });
                    });
                };
            }).catch((err) => console.error(err));
        }
    }
    console.dir(req.method);
});
server.listen(8080, 'localhost');
console.log('Server running at XXXX http://localhost:8080/');


/**
 * ########### penthouse START #############
 * Создвть критические CSS и записать в файл
 *
 * @param url
 * @param output
 * @return {Promise<any | never>}
 */
const criticalCss = async  function ( url, output) {
    config.url = url;

    console.log( +config.width )

    // Установки браузера PUPPETEER
    /*config.puppeteer = {
        getBrowser: function(){
            return puppeteer.launch({
                ignoreHTTPSErrors: true,
                args: ['--disable-setuid-sandbox', '--no-sandbox'],
                // not required to specify here, but saves Penthouse some work if you will
                // re-use the same viewport for most penthouse calls.
                defaultViewport: {
                    width: config.width,
                    height: config.height,
                },

            });
        }
    } ;*/

   /* const browserPromise = puppeteer.launch({
        ignoreHTTPSErrors: true,
        args: ['--disable-setuid-sandbox', '--no-sandbox'],
        // not required to specify here, but saves Penthouse some work if you will
        // re-use the same viewport for most penthouse calls.
        defaultViewport: {
            width: +config.width,
            height: +config.height,
        }
    })

    config.puppeteer = {
        getBrowser: () => browserPromise
    }*/

    return penthouse(config)
        .then(retCss => {
            //write critical css to output file
            fs.writeFileSync( output, retCss);
            return retCss;
        });
}



/**
 * Перебор - очереди промисов
 *
 * @param items An array of items.
 * @param fn A function that accepts an item from the array and returns a promise.
 * @returns {Promise}
 * @tutorial https://stackoverflow.com/questions/31413749/node-js-promise-all-and-foreach/41791149#41791149
 */
function forEachPromise(items, fn) {
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
    const sep = path.sep;
    const initDir = path.isAbsolute(targetDir) ? sep : '';
    const baseDir = isRelativeToScript ? __dirname : '.';

    return targetDir.split(sep).reduce((parentDir, childDir) => {
        const curDir = path.resolve(baseDir, parentDir, childDir);
        try {
            fs.mkdirSync(curDir);
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
}

/**
 * Прочитать данные из файла ALL.css
 *
 * @param url
 * @return {Promise<any>}
 */
const getContentCss = function (url) {
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