const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const Queue = require('bull');

app.use(bodyParser.json());

const redisSettings = { redis: { port: 6379, host: '127.0.0.1' } };

const testQueue = new Queue('Test Queue', redisSettings);

testQueue.process(job => {
	let intervalId = 0;
	let progress = 0;

	job.progress(progress);

	const doWork = new Promise(
		resolve =>
			(intervalId = setInterval(() => {
				progress += 10;
				job.progress(progress);
				if (progress === 100) {
					clearInterval(intervalId);
					return resolve({ data: job.data.message });
				}
			}, 1000))
	);

	return doWork;
});

testQueue.on('active', (job, jobPromise) => {
	console.log(`Job ID: ${job.id} has just started.`);
});

testQueue.on('progress', (job, progress) => {
	console.log(`Job ID: ${job.id} is currently at: ${progress}%`);
});

testQueue.on('completed', (job, result) => {
	console.log(`Job ID: ${job.id} completed with result: ${result.data}`);
});

app.post('/message', function(req, res) {
	testQueue.add({ message: req.body.message });

	res.json({
		result: 'Message dropped on queue'
	});
});

app.listen(3000, () => console.log('Listening on port 3000'));
