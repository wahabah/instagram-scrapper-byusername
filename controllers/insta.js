var express = require('express');
var fs = require('fs');
var request = require('sync-request');
// var request = require('request');
var cheerio = require('cheerio');
var app     = express();

var router = express.Router();

router.post('/byurl', async function (req, res) {
	var ResponseCode = 200;
	var ResponseMessage = ``;
	var ResponseData = null;
	try {
		if(req.body.url) {
			var url = req.body.url;
			var pageres = request('GET', url, {
			  headers: {
				'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
				'accept-encoding': 'gzip, deflate, br',
				'accept-language': 'en-US,en;q=0.9,fr;q=0.8,ro;q=0.7,ru;q=0.6,la;q=0.5,pt;q=0.4,de;q=0.3',
				'cache-control': 'max-age=0',
				'upgrade-insecure-requests': '1',
				'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36'
			  },
			});
			var $ = cheerio.load(pageres.getBody('utf8'));

			/* Get the proper script of the html page which contains the json */
			let script = $('script').eq(4).html();

			/* Traverse through the JSON of instagram response */
			let { entry_data: { ProfilePage : {[0] : { graphql : {user} }} } } = JSON.parse(/window\._sharedData = (.+);/g.exec(script)[1]);

			ResponseData = user;

			console.log(ResponseData)

			ResponseMessage = "Success";
			ResponseCode = 200;


		} else {
			ResponseMessage = "URL is empty";
			ResponseCode = 204
		}
	} catch (error) {
		ResponseMessage = `${error}`;
		ResponseCode = 400
	} finally {
		return res.status(200).json({
			code : ResponseCode,
			data : ResponseData,
			msg : ResponseMessage
		});
	}
});

router.post('/byusername', async function (req, res) {
	var ResponseCode = 200;
	var ResponseMessage = ``;
	var ResponseData = null;
	try {
		if(req.body.username) {
			var username = req.body.username;
			// var pageres = request('GET', "https://www.instagram.com/web/search/topsearch/?context=blended&query="+username, {
			  // headers: {
				// 'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
				// 'accept-encoding': 'gzip, deflate, br',
				// 'accept-language': 'en-US,en;q=0.9,fr;q=0.8,ro;q=0.7,ru;q=0.6,la;q=0.5,pt;q=0.4,de;q=0.3',
				// 'cache-control': 'max-age=0',
				// 'upgrade-insecure-requests': '1',
				// 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36'
			  // },
			// });
			// var jsonResponse = JSON.parse(pageres.getBody('utf8'));
			// if(jsonResponse.users.length > 0)
			{
				// var url =  "https://www.instagram.com/"+jsonResponse.users[0].user.username;
				//username = username.replace(/[^a-zA-Z0-9]/g, '');

				var url =  "https://www.instagram.com/"+username;
				let images = [], output = [], like_count, comments_count, noofposts ,engagement_rate, engagement_rate_sum = 0,
					engagement_rate_avg = 0,
					followers = 0;


				var pageres = request('GET', url, {
				  headers: {
					'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
					'accept-encoding': 'gzip, deflate, br',
					'accept-language': 'en-US,en;q=0.9,fr;q=0.8,ro;q=0.7,ru;q=0.6,la;q=0.5,pt;q=0.4,de;q=0.3',
					'cache-control': 'max-age=0',
					'upgrade-insecure-requests': '1',
					'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36'
				  },
				});
				var $ = cheerio.load(pageres.getBody('utf8'));
				/* Get the proper script of the html page which contains the json */
				let script = $('script').eq(4).html();


				/* Traverse through the JSON of instagram response */
				let { entry_data: { ProfilePage : {[0] : { graphql : {user} }} } } = JSON.parse(/window\._sharedData = (.+);/g.exec(script)[1]);

				if (user['has_blocked_viewer'] === false)
				{
					followers = user['edge_followed_by']['count'];
					let edges = user['edge_felix_video_timeline']['edges'] && user['edge_owner_to_timeline_media']['edges'] ;
					for (let p in edges) {
						if (edges.hasOwnProperty(p)) {
							like_count = edges[p]['node']['edge_liked_by']['count'];
							comments_count = edges[p]['node']['edge_media_to_comment']['count'];
							engagement_rate = ((like_count + comments_count) / followers) * 100;
							engagement_rate_sum += engagement_rate;
							engagement_rate = Number((engagement_rate).toFixed(3));
							images.push({

								"type": edges[p]['node']['__typename'],
								"caption": edges[p]['node']['edge_media_to_caption']['edges'].length > 0 ? edges[p]['node']['edge_media_to_caption']['edges'][0]['node']['text'] : '',
								"engagement_rate": engagement_rate,
								"like": like_count,
								"comments": comments_count,
								"link": 'https://www.instagram.com/p/' + edges[p]['node']['shortcode'],
								"thumbnail": edges[p]['node']['thumbnail_resources'][1]['src']
							});
						}}
					if (images.length > 0) {
						engagement_rate_avg = engagement_rate_sum / images.length;
						engagement_rate_avg = Number((engagement_rate_avg).toFixed(3));
					}
				}
				ResponseData = user;
				ResponseMessage = "Success";
				ResponseCode = 200;
				return res.status(200).json({
					ResponseMessage : 'Success',
					ResponseCode : '200',
					full_name: user['full_name'],
					username: user['username'],
					link: 'https://www.instagram.com/' + user['username'],
					biography: user['biography'],
					No_of_posts: user['edge_owner_to_timeline_media']['count'],
					followers: followers,
					can_see: !((user['is_private'] && user['followed_by_viewer'] === false) && user['has_blocked_viewer']),
					engagement_rate_avg: engagement_rate_avg,
					posts: images,

				});


			}
			// else {
				// ResponseMessage = "Username not found on insta";
				// ResponseCode = 203
			// }
		} else {
			ResponseMessage = "Username is empty";
			ResponseCode = 204
		}
	} catch (error) {
		ResponseMessage = `${error}`;
		ResponseCode = 400
	} finally {
		return res.status(200).json({
			code : ResponseCode,
			data : ResponseData,
			msg : ResponseMessage
		});
	}
});


router.get('/usernameStats', async function (req, res) {

	console.log(req.query.username)
	var ResponseCode = 200;
	var ResponseMessage = ``;
	var ResponseData = null;
	try {
		if(req.query.username) {
			var username = req.query.username;
			// var pageres = request('GET', "https://www.instagram.com/web/search/topsearch/?context=blended&query="+username, {
			// headers: {
			// 'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
			// 'accept-encoding': 'gzip, deflate, br',
			// 'accept-language': 'en-US,en;q=0.9,fr;q=0.8,ro;q=0.7,ru;q=0.6,la;q=0.5,pt;q=0.4,de;q=0.3',
			// 'cache-control': 'max-age=0',
			// 'upgrade-insecure-requests': '1',
			// 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36'
			// },
			// });
			// var jsonResponse = JSON.parse(pageres.getBody('utf8'));
			// if(jsonResponse.users.length > 0)
			{
				// var url =  "https://www.instagram.com/"+jsonResponse.users[0].user.username;
				//username = username.replace(/[^a-zA-Z0-9]/g, '');

				var url =  "https://www.instagram.com/"+username;
				let images = [], output = [], like_count, comments_count, noofposts ,engagement_rate, engagement_rate_sum = 0,
					engagement_rate_avg = 0,
					followers = 0;


				var pageres = request('GET', url, {
					headers: {
						'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
						'accept-encoding': 'gzip, deflate, br',
						'accept-language': 'en-US,en;q=0.9,fr;q=0.8,ro;q=0.7,ru;q=0.6,la;q=0.5,pt;q=0.4,de;q=0.3',
						'cache-control': 'max-age=0',
						'upgrade-insecure-requests': '1',
						'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36'
					},
				});
				var $ = cheerio.load(pageres.getBody('utf8'));
				/* Get the proper script of the html page which contains the json */
				let script = $('script').eq(4).html();


				/* Traverse through the JSON of instagram response */
				let { entry_data: { ProfilePage : {[0] : { graphql : {user} }} } } = JSON.parse(/window\._sharedData = (.+);/g.exec(script)[1]);

				if (user['has_blocked_viewer'] === false)
				{
					followers = user['edge_followed_by']['count'];
					following = user['edge_follow']['count'];
					let edges = user['edge_felix_video_timeline']['edges'] && user['edge_owner_to_timeline_media']['edges'] ;
					for (let p in edges) {
						if (edges.hasOwnProperty(p)) {
							like_count = edges[p]['node']['edge_liked_by']['count'];
							videos_count = edges[p]['node']['video_view_count'];
							comments_count = edges[p]['node']['edge_media_to_comment']['count'];
							engagement_rate = ((like_count + comments_count) / followers) * 100;
							engagement_rate_sum += engagement_rate;
							engagement_rate = Number((engagement_rate).toFixed(3));
							images.push({

								"type": edges[p]['node']['__typename'],
								"caption": edges[p]['node']['edge_media_to_caption']['edges'].length > 0 ? edges[p]['node']['edge_media_to_caption']['edges'][0]['node']['text'] : '',
								"engagement_rate": engagement_rate,
								"likes total": like_count,
								"video views count": videos_count,
								"comments total ": comments_count,
								"link": 'https://www.instagram.com/p/' + edges[p]['node']['shortcode'],
								"thumbnail": edges[p]['node']['thumbnail_resources'][1]['src']
							});
						}}
					if (images.length > 0) {
						engagement_rate_avg = engagement_rate_sum / images.length;
						engagement_rate_avg = Number((engagement_rate_avg).toFixed(3));
					}
				}
				ResponseData = user;
				ResponseMessage = "Success";
				ResponseCode = 200;
				return res.status(200).json({
					ResponseMessage : 'Success',
					ResponseCode : '200',
					full_name: user['full_name'],
					username: user['username'],
					link: 'https://www.instagram.com/' + user['username'],
					biography: user['biography'],
					No_of_posts: user['edge_owner_to_timeline_media']['count'],
					followers: followers,
					following: following,
					can_see: !((user['is_private'] && user['followed_by_viewer'] === false) && user['has_blocked_viewer']),
					engagement_rate_avg: engagement_rate_avg,
					posts: images,

				});


			}
			// else {
			// ResponseMessage = "Username not found on insta";
			// ResponseCode = 203
			// }
		} else {
			ResponseMessage = "Username is empty";
			ResponseCode = 204
		}
	} catch (error) {
		ResponseMessage = `${error}`;
		ResponseCode = 400
	} finally {
		return res.status(200).json({
			code : ResponseCode,
			data : ResponseData,
			msg : ResponseMessage
		});
	}
});


module.exports = router;
