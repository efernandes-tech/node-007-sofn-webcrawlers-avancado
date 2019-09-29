'use strict';

const Hapi = require('@hapi/hapi');
const mongoose = require('mongoose');
const Horseman = require('node-horseman');

mongoose.connect('mongodb://localhost:27017/proj_list_movies', {useNewUrlParser: true});

mongoose.connection.on('error', err => {
    logError(err);
});

const horseman = new Horseman();

const Movies = require('./movies');

const init = async () => {

    const server = Hapi.server({
        port: 3000,
        host: 'localhost'
    });

    server.route({
        method: 'GET',
        path: '/',
        handler: (request, h) => {
            return 'Hello World!';
        }
    });

    server.route({
        method: 'GET',
        path: '/movies',
        handler: (request, h) => {

            console.time()

            var p1 = new Promise(function(resolve, reject) {

                Movies.find({}, (err, results) => {
                    if (!err && results.length) {
                        console.timeEnd();
                        resolve({
                            data: results,
                            count: results.length
                        });
                    }

                    if (!err && !results.length) {
                        console.time();
                        horseman
                            .open('http://www.listchallenges.com/disney-movies')
                            .evaluate(function() {
                                $ = window.$ || window.jQuery;

                                var movies = [];

                                $('.item-name').each(function(index, el) {
                                    var name = $(el).text();
                                    var year = name.match(/\(([^)]+)\)/);

                                    if (!year) {
                                        return;
                                    }

                                    year = year[1];
                                    name = name.replace(/\s*\(.*?\)\s*/g, '');

                                    movies.push({
                                        name: name,
                                        year: year
                                    });
                                });

                                return movies;
                            })
                            .then(function(res) {
                                Movies.insertMany(res)
                                    .then((movies) => {
                                        console.log(`Ok`);
                                        console.timeEnd();
                                        resolve(res);
                                    })
                                    .catch((err) => {
                                        console.log(`Can not insert: ${err}`);
                                        reject({
                                            'error': 'MongoDB'
                                        });
                                    });
                            })
                            .catch(function(err) {
                                console.log(err)
                                reject(err)
                            })
                            .close();
                    }
                })

            });

            return p1
                .then(function(val) {
                    return val
                })
                .catch(function(err) {
                    console.log(err)
                    return;
                })
        }
    });

    await server.start();
    console.log('Server running on %s', server.info.uri);

};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();